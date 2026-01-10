import React, { useState, useRef } from 'react';
import { Button } from '../../ui/Button';

const ReferenceUploader = ({ onReferenceUpload, hotspotId, disabled = false }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedReference, setUploadedReference] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = () => {
    if (!disabled && !isUploading) {
      // If there's an existing reference, remove it first
      if (uploadedReference) {
        removeReference();
      }
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Then prompt for new file
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      
      // Upload the file to get a URL for Gemini
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload reference image');
      }
      
      const uploadResult = await response.json();
      
      // Create reference object with server URL - no selection point, use full image
      const reference = {
        id: `ref_${Date.now()}`,
        file: file,
        name: file.name,
        preview: previewUrl,
        url: uploadResult.url, // Server URL for Gemini
        size: file.size,
        type: file.type
      };

      setUploadedReference(reference);
      
      // Immediately call parent callback with the full image
      if (onReferenceUpload) {
        onReferenceUpload(hotspotId, reference);
      }
      
      console.log('Reference image uploaded successfully:', {
        hotspotId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: uploadResult.url
      });

    } catch (error) {
      console.error('Reference upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeReference = () => {
    if (uploadedReference?.preview) {
      URL.revokeObjectURL(uploadedReference.preview);
    }
    setUploadedReference(null);
    
    // Notify parent that reference was removed
    if (onReferenceUpload) {
      onReferenceUpload(hotspotId, null);
    }
  };

  return (
    <div className="flex items-center gap-1 w-full">
      {/* Reference Upload/Replace Button */}
      <Button
        onClick={handleFileSelect}
        disabled={disabled || isUploading}
        className={`w-auto px-2 py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md border font-medium transition-all duration-200 shadow-lg ${
          uploadedReference
            ? 'bg-gradient-to-r from-orange-500/40 to-orange-600/50 hover:from-orange-500/50 hover:to-orange-600/60 border-orange-300/40 text-white shadow-orange-500/20'
            : 'bg-gradient-to-r from-blue-500/40 to-blue-600/50 hover:from-blue-500/50 hover:to-blue-600/60 border-blue-300/40 text-white shadow-blue-500/20'
        }`}
        title={uploadedReference ? 'Replace reference image' : 'Add reference image for this edit'}
      >
        {isUploading ? 'Uploading...' : uploadedReference ? 'Replace Ref' : 'Add Ref'}
      </Button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif,image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ReferenceUploader;
