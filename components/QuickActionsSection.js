import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image, File, Phone, RefreshCw, Upload, X } from 'lucide-react';
import { getSupabase } from '../lib/supabaseClient';

export default function QuickActionsSection({
  isDark,
  conversation,
  isPartner = false,
  onFileUpload,
  onRequestPhoneAccess,
  onRequestUpdate,
  partnerPhone
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const phoneSharingApproved = conversation?.phone_sharing_approved || false;
  const canCall = phoneSharingApproved && partnerPhone;

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleFileChange = async (e, isImage = false) => {
    const file = e.target.files?.[0];
    if (!file || !onFileUpload) return;

    setUploading(true);
    try {
      // Upload file to Supabase storage first
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const fileExtension = file.name.split('.').pop();
      const fileName = `conversation-files/${timestamp}-${randomId}.${fileExtension}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('conversation-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('conversation-files')
        .getPublicUrl(fileName);

      // Call the callback with file info
      if (onFileUpload) {
        await onFileUpload({
          fileUrl: urlData.publicUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: isImage ? 'image' : 'file',
          mimeType: file.type
        });
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      // Reset input
      if (isImage) {
        imageInputRef.current.value = '';
      } else {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCall = () => {
    if (canCall && partnerPhone) {
      window.location.href = `tel:${partnerPhone}`;
    }
  };

  const handleRequestPhoneAccess = () => {
    if (onRequestPhoneAccess) {
      onRequestPhoneAccess();
    }
  };

  const handleRequestUpdate = () => {
    if (onRequestUpdate) {
      onRequestUpdate();
    }
  };

  const allActions = [
    {
      id: 'image',
      label: 'Share Image',
      icon: Image,
      onClick: handleImageClick,
      color: isDark ? 'text-blue-400' : 'text-blue-600',
      bgColor: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
      borderColor: isDark ? 'border-blue-500/30' : 'border-blue-300'
    },
    {
      id: 'file',
      label: 'Share File',
      icon: File,
      onClick: handleFileClick,
      color: isDark ? 'text-purple-400' : 'text-purple-600',
      bgColor: isDark ? 'bg-purple-500/20' : 'bg-purple-100',
      borderColor: isDark ? 'border-purple-500/30' : 'border-purple-300'
    },
    {
      id: 'call',
      label: canCall ? 'Call' : 'Request Phone',
      icon: Phone,
      onClick: canCall ? handleCall : handleRequestPhoneAccess,
      disabled: false,
      color: canCall 
        ? (isDark ? 'text-green-400' : 'text-green-600')
        : (isDark ? 'text-gray-400' : 'text-gray-500'),
      bgColor: canCall
        ? (isDark ? 'bg-green-500/20' : 'bg-green-100')
        : (isDark ? 'bg-gray-500/10' : 'bg-gray-100'),
      borderColor: canCall
        ? (isDark ? 'border-green-500/30' : 'border-green-300')
        : (isDark ? 'border-gray-500/20' : 'border-gray-300')
    },
    {
      id: 'update',
      label: 'Request Update',
      icon: RefreshCw,
      onClick: handleRequestUpdate,
      color: isDark ? 'text-orange-400' : 'text-orange-600',
      bgColor: isDark ? 'bg-orange-500/20' : 'bg-orange-100',
      borderColor: isDark ? 'border-orange-500/30' : 'border-orange-300'
    }
  ];

  // Filter out image and file actions for client portal (when isPartner is false)
  const actions = isPartner 
    ? allActions 
    : allActions.filter(action => action.id !== 'image' && action.id !== 'file');

  return (
    <div className="w-full mb-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="about-devello-glass rounded-2xl p-4 border-2"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.4)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.onClick}
                disabled={uploading || action.disabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
                  action.color
                } ${action.bgColor} ${action.borderColor} ${
                  uploading || action.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:opacity-80 cursor-pointer'
                }`}
                style={{
                  borderColor: isDark 
                    ? action.borderColor.includes('border-') 
                      ? undefined 
                      : 'rgba(255, 255, 255, 0.1)'
                    : undefined
                }}
              >
                {uploading && action.id === 'image' || action.id === 'file' ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="text-sm font-medium whitespace-nowrap">
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e, true)}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFileChange(e, false)}
        />
      </motion.div>
    </div>
  );
}

