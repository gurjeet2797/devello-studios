import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { getSupabase } from '../../lib/supabaseClient';

export default function ImageUploader({ 
  value, 
  onChange, 
  onUploadComplete,
  isDark, 
  label = 'Product Image',
  accept = 'image/*',
  maxSizeMB = 10,
  folder = 'products'
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const supabase = getSupabase();

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Get session for authenticated upload
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // Try direct upload with anon key (if bucket is public)
        console.log('[IMAGE_UPLOADER] No session, attempting public upload');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${folder}/${timestamp}-${randomId}.${fileExtension}`;

      // Simulate progress (Supabase doesn't provide progress callbacks)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (uploadError) {
        console.error('[IMAGE_UPLOADER] Upload error:', uploadError);
        
        // If upload fails, try using the API endpoint as fallback
        if (uploadError.message?.includes('new row violates') || uploadError.message?.includes('policy')) {
          console.log('[IMAGE_UPLOADER] Direct upload failed, trying API endpoint...');
          return await uploadViaAPI(file);
        }
        
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      setUploadProgress(100);
      
      // Call onChange with the URL
      if (onChange) {
        onChange(urlData.publicUrl);
      }

      // Call onUploadComplete callback if provided (for auto-save functionality)
      if (onUploadComplete) {
        onUploadComplete(urlData.publicUrl);
      }

      // Small delay to show success
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      console.error('[IMAGE_UPLOADER] Error:', err);
      setError(err.message || 'Failed to upload image');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadViaAPI = async (file) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/products/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadProgress(100);
        if (onChange) {
          onChange(result.url);
        }
        if (onUploadComplete) {
          onUploadComplete(result.url);
        }
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 500);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeImage = () => {
    if (onChange) {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {label}
        </label>
      )}

      {value ? (
        <div className="relative group">
          <div className="relative rounded-lg overflow-hidden border-2 border-white/20">
            <img
              src={value}
              alt="Product"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <motion.button
                onClick={removeImage}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full ${isDark ? 'bg-red-500/80 hover:bg-red-500' : 'bg-red-600 hover:bg-red-700'} text-white`}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
          <div className="mt-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-sm ${
                isDark
                  ? 'bg-white/5 border border-white/10 text-white'
                  : 'bg-white/60 border border-gray-300 text-gray-900'
              }`}
              placeholder="Image URL"
            />
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg transition-all ${
            dragActive
              ? isDark
                ? 'border-blue-400 bg-blue-500/10'
                : 'border-blue-500 bg-blue-50'
              : isDark
              ? 'border-white/20 hover:border-white/40 bg-white/5'
              : 'border-gray-300 hover:border-gray-400 bg-white/60'
          }`}
        >
          {uploading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-3"></div>
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                Uploading... {uploadProgress}%
              </p>
              <div className={`mt-2 h-2 rounded-full overflow-hidden ${
                isDark ? 'bg-white/10' : 'bg-gray-200'
              }`}>
                <motion.div
                  className={`h-full ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          ) : (
            <label
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-8 cursor-pointer"
            >
              <div className={`p-4 rounded-full mb-4 ${
                isDark ? 'bg-white/10' : 'bg-gray-100'
              }`}>
                <Upload className={`w-8 h-8 ${isDark ? 'text-white/60' : 'text-gray-400'}`} />
              </div>
              <p className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Click to upload or drag and drop
              </p>
              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                PNG, JPG, GIF up to {maxSizeMB}MB
              </p>
            </label>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            disabled={uploading}
          />
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            isDark ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
