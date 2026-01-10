/**
 * Shared file validation utilities for upload endpoints
 */

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

/**
 * Validate file type, size, and extension
 * @param {Object} file - File object with mimetype, originalFilename, and size
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
export function validateFileType(file) {
  const { mimetype, originalFilename, size } = file;

  if (size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    // Special case for HEIC files which may have incorrect MIME type
    if (!originalFilename?.toLowerCase().endsWith('.heic') && 
        !originalFilename?.toLowerCase().endsWith('.heif')) {
      throw new Error(`Unsupported file type: ${mimetype}`);
    }
  }

  const ext = originalFilename?.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file extension: ${ext}`);
  }

  return true;
}

/**
 * Validate file metadata (for direct uploads where we don't have the actual file)
 * @param {string} fileType - MIME type
 * @param {number} fileSize - File size in bytes
 * @param {string} fileName - Original filename
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
export function validateFileMetadata(fileType, fileSize, fileName) {
  if (!fileType || !fileSize || !fileName) {
    throw new Error('Missing required file metadata');
  }

  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  if (!ALLOWED_MIME_TYPES.includes(fileType)) {
    // Special case for HEIC files
    if (!fileName?.toLowerCase().endsWith('.heic') && 
        !fileName?.toLowerCase().endsWith('.heif')) {
      throw new Error('File type not allowed');
    }
  }

  return true;
}

/**
 * Get allowed MIME types
 * @returns {string[]} Array of allowed MIME types
 */
export function getAllowedMimeTypes() {
  return [...ALLOWED_MIME_TYPES];
}

/**
 * Get maximum file size
 * @returns {number} Maximum file size in bytes
 */
export function getMaxFileSize() {
  return MAX_FILE_SIZE;
}

