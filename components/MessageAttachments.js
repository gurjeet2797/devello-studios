import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, File, X, Download, ExternalLink } from 'lucide-react';

export default function MessageAttachments({ attachments, isDark }) {
  const [previewImage, setPreviewImage] = useState(null);

  if (!attachments || attachments.length === 0) return null;

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = (mimeType) => {
    return mimeType && mimeType.startsWith('image/');
  };

  const handleImageClick = (url) => {
    setPreviewImage(url);
  };

  const handleDownload = (url, fileName) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="mt-2 space-y-2">
        {attachments.map((attachment, index) => {
          const attachmentData = typeof attachment === 'string' 
            ? { fileUrl: attachment, fileName: 'Attachment', fileType: 'file' }
            : attachment;
          
          const { fileUrl, fileName, fileSize, fileType, mimeType } = attachmentData;
          const isImg = isImage(mimeType) || fileType === 'image';

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative rounded-lg overflow-hidden border-2 ${
                isDark 
                  ? 'border-white/20 bg-white/5' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {isImg ? (
                <div className="relative group">
                  <img
                    src={fileUrl}
                    alt={fileName || 'Image'}
                    className="max-w-full h-auto max-h-64 cursor-pointer"
                    onClick={() => handleImageClick(fileUrl)}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div 
                    className="hidden items-center justify-center p-4 min-h-[100px]"
                    style={{ display: 'none' }}
                  >
                    <div className="text-center">
                      <Image className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                      <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        Failed to load image
                      </p>
                    </div>
                  </div>
                  <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100`}>
                    <button
                      onClick={() => handleImageClick(fileUrl)}
                      className={`p-2 rounded-full ${isDark ? 'bg-white/20 text-white' : 'bg-black/20 text-white'}`}
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <File className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {fileName || 'File'}
                    </p>
                    {fileSize && (
                      <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                        {formatFileSize(fileSize)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDownload(fileUrl, fileName)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'hover:bg-white/10 text-white/70 hover:text-white' 
                        : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-7xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

