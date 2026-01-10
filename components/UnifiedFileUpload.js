import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, File, X, Camera, FolderOpen } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';

export default function UnifiedFileUpload({ 
  onFileUploaded, 
  isDark, 
  disabled = false,
  className = ''
}) {
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file, source) => {
    if (!file) return;

    setUploading(true);
    setShowModal(false);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const fileExtension = file.name.split('.').pop();
      const fileName = `conversation-files/${timestamp}-${randomId}.${fileExtension}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('conversation-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('conversation-files')
        .getPublicUrl(fileName);

      const attachment = {
        fileUrl: urlData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type.startsWith('image/') ? 'image' : 'file',
        mimeType: file.type
      };

      if (onFileUploaded) {
        onFileUploaded(attachment);
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      // Reset inputs
      imageInputRef.current.value = '';
      cameraInputRef.current.value = '';
      fileInputRef.current.value = '';
    }
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const uploadOptions = [
    {
      id: 'gallery',
      label: 'Photo Library',
      icon: ImageIcon,
      onClick: handleImageClick,
      color: isDark ? 'text-blue-400' : 'text-blue-600',
      bgColor: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
      borderColor: isDark ? 'border-blue-500/30' : 'border-blue-300'
    },
    {
      id: 'camera',
      label: 'Take Photo',
      icon: Camera,
      onClick: handleCameraClick,
      color: isDark ? 'text-green-400' : 'text-green-600',
      bgColor: isDark ? 'bg-green-500/20' : 'bg-green-100',
      borderColor: isDark ? 'border-green-500/30' : 'border-green-300'
    },
    {
      id: 'files',
      label: 'Files',
      icon: FolderOpen,
      onClick: handleFileClick,
      color: isDark ? 'text-purple-400' : 'text-purple-600',
      bgColor: isDark ? 'bg-purple-500/20' : 'bg-purple-100',
      borderColor: isDark ? 'border-purple-500/30' : 'border-purple-300'
    }
  ];

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled || uploading}
        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${className} ${
          isDark
            ? 'hover:bg-white/10 text-white/70 hover:text-white'
            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
        } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {uploading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <ImageIcon className="w-4 h-4" />
        )}
      </button>

      {/* Glass Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowModal(false)}
            >
              <div
                className={`about-devello-glass rounded-2xl p-6 max-w-sm w-full ${
                  isDark ? 'border border-white/10' : 'border border-gray-200'
                }`}
                style={{
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  backgroundColor: isDark 
                    ? 'rgba(255, 255, 255, 0.15)' 
                    : 'rgba(255, 255, 255, 0.7)',
                  borderColor: isDark 
                    ? 'rgba(255, 255, 255, 0.25)' 
                    : 'rgba(0, 0, 0, 0.1)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Upload File
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className={`p-1 rounded-lg transition-colors ${
                      isDark
                        ? 'hover:bg-white/10 text-white/70 hover:text-white'
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-700'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {uploadOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <motion.button
                        key={option.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          option.onClick();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${option.color} ${option.bgColor} ${option.borderColor} hover:opacity-80`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{option.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files?.[0], 'gallery')}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files?.[0], 'camera')}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files?.[0], 'files')}
      />
    </>
  );
}

