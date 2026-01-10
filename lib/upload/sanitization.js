/**
 * Shared filename sanitization utilities
 */

/**
 * Sanitize filename to prevent path traversal and malicious filenames
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename) {
    return 'unnamed-file';
  }

  // Remove path components (prevent directory traversal)
  const basename = filename.split('/').pop().split('\\').pop();
  
  // Remove or replace dangerous characters
  let sanitized = basename
    .replace(/[<>:"|?*\x00-\x1f]/g, '') // Remove invalid filename characters
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .trim();

  // Ensure filename is not empty
  if (!sanitized) {
    sanitized = 'unnamed-file';
  }

  // Limit length to prevent filesystem issues
  const maxLength = 255;
  if (sanitized.length > maxLength) {
    const ext = sanitized.match(/\.[^.]+$/)?.[0] || '';
    const nameWithoutExt = sanitized.slice(0, maxLength - ext.length);
    sanitized = nameWithoutExt + ext;
  }

  return sanitized;
}

/**
 * Generate a unique filename with timestamp
 * @param {string} originalFilename - Original filename
 * @returns {string} Unique filename with timestamp prefix
 */
export function generateUniqueFilename(originalFilename) {
  const sanitized = sanitizeFilename(originalFilename);
  const timestamp = Date.now();
  return `${timestamp}-${sanitized}`;
}

