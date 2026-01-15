import { json as parseJson } from 'micro';
import { createSupabaseServerClient } from '../supabaseClient.js';
import { generateUniqueFilename } from '../upload/sanitization.js';
import { validateFileType } from '../upload/validation.js';

// Use require for formidable to avoid ESM import issues
const formidable = require('formidable');

export const IOS_IMAGE_MAX_BYTES = 4 * 1024 * 1024; // 4MB
const DEFAULT_BUCKET = 'images';
const DEFAULT_OUTPUT_PREFIX = 'ios-outputs';

const createValidationError = (message, status = 400, code = 'INVALID_REQUEST') => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const normalizeFieldValue = (value) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const normalizeFields = (fields) => {
  if (!fields || typeof fields !== 'object') {
    return {};
  }

  return Object.entries(fields).reduce((acc, [key, value]) => {
    acc[key] = normalizeFieldValue(value);
    return acc;
  }, {});
};

const assertSupabaseImageUrl = (imageUrl, bucket) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw createValidationError('Supabase URL is not configured', 500, 'SERVER_CONFIG_ERROR');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(imageUrl);
  } catch (error) {
    throw createValidationError('image_url must be a valid URL');
  }

  const allowedOrigins = [new URL(supabaseUrl).origin];
  if (!allowedOrigins.includes(parsedUrl.origin)) {
    throw createValidationError('image_url must belong to Supabase Storage');
  }

  const path = parsedUrl.pathname || '';
  const allowedPrefixes = [
    `/storage/v1/object/public/${bucket}/`,
    `/storage/v1/object/sign/${bucket}/`,
    `/storage/v1/object/authenticated/${bucket}/`
  ];

  const isAllowed = allowedPrefixes.some((prefix) => path.startsWith(prefix));
  if (!isAllowed) {
    throw createValidationError('image_url must reference the configured storage bucket');
  }
};

const parseMultipartForm = (req, { maxBytes }) => {
  const form = new formidable.IncomingForm({
    maxFileSize: maxBytes,
    maxFields: 10,
    maxFieldsSize: 256 * 1024,
    allowEmptyFiles: false,
    minFileSize: 1024
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        const status = err.httpCode === 413 ? 413 : 400;
        reject(createValidationError(err.message || 'Failed to parse form data', status));
        return;
      }

      resolve({ fields: normalizeFields(fields), files });
    });
  });
};

const uploadFileToSupabase = async ({ file, bucket }) => {
  if (!file?.filepath) {
    throw createValidationError('Missing uploaded image file');
  }

  if (file.size > IOS_IMAGE_MAX_BYTES) {
    throw createValidationError('Image exceeds the maximum upload size');
  }

  validateFileType({
    mimetype: file.mimetype,
    originalFilename: file.originalFilename,
    size: file.size
  });

  const fs = await import('fs/promises');
  const fileData = await fs.readFile(file.filepath);
  const fileName = generateUniqueFilename(file.originalFilename);

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, fileData, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw createValidationError(`Supabase Storage error: ${error.message}`, 500, 'STORAGE_ERROR');
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  try {
    await fs.unlink(file.filepath);
  } catch (cleanupError) {
    // Non-fatal cleanup failure
  }

  return {
    imageUrl: urlData.publicUrl,
    storagePath: data?.path || fileName
  };
};

const getExtensionForContentType = (contentType) => {
  if (contentType?.includes('png')) return '.png';
  if (contentType?.includes('webp')) return '.webp';
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return '.jpg';
  return '.png';
};

export const storeExternalImageToSupabase = async ({
  imageUrl,
  bucket = DEFAULT_BUCKET,
  prefix = DEFAULT_OUTPUT_PREFIX
}) => {
  if (!imageUrl) {
    throw createValidationError('imageUrl is required');
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw createValidationError('Failed to fetch processed image', 502, 'FETCH_FAILED');
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  const extension = getExtensionForContentType(contentType);
  const fileName = generateUniqueFilename(`output${extension}`);
  const storagePath = `${prefix}/${fileName}`;

  const arrayBuffer = await response.arrayBuffer();
  const fileData = Buffer.from(arrayBuffer);

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileData, {
      contentType,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw createValidationError(`Supabase Storage error: ${error.message}`, 500, 'STORAGE_ERROR');
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data?.path || storagePath);

  return {
    outputUrl: urlData.publicUrl,
    storagePath: data?.path || storagePath
  };
};

export const ingestImageFromRequest = async ({ req, bucket = DEFAULT_BUCKET, maxBytes = IOS_IMAGE_MAX_BYTES }) => {
  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('multipart/form-data')) {
    const { fields, files } = await parseMultipartForm(req, { maxBytes });
    const fileField = files?.image || files?.file;
    const file = Array.isArray(fileField) ? fileField[0] : fileField;

    if (file) {
      const { imageUrl, storagePath } = await uploadFileToSupabase({ file, bucket });
      return { imageUrl, storagePath, body: fields };
    }

    const imageUrl = fields.image_url || fields.imageUrl;
    if (!imageUrl) {
      throw createValidationError('image or image_url is required');
    }

    assertSupabaseImageUrl(imageUrl, bucket);
    return { imageUrl, body: fields };
  }

  if (contentType.includes('application/json')) {
    const body = await parseJson(req);
    const imageUrl = body?.image_url || body?.imageUrl;

    if (!imageUrl) {
      throw createValidationError('image_url is required');
    }

    assertSupabaseImageUrl(imageUrl, bucket);
    return { imageUrl, body };
  }

  throw createValidationError('Unsupported content-type', 415, 'UNSUPPORTED_MEDIA_TYPE');
};
