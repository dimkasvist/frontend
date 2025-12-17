'use client';

import { useRef, useState } from 'react';
import { uploadChatFile } from '@/lib/chat-api';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

interface FileUploadButtonProps {
  accept: string;
  icon: React.ReactNode;
  label: string;
  onUpload: (fileUrl: string, fileType: 'IMAGE' | 'VIDEO' | 'FILE') => void;
}

export default function FileUploadButton({ accept, icon, label, onUpload }: FileUploadButtonProps) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    try {
      const response = await uploadChatFile(token, file);
      onUpload(response.fileUrl, response.fileType);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Ошибка при загрузке файла');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={uploading}
        className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--input-bg)] rounded-lg transition-colors w-full text-left disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          icon
        )}
        <span className="text-sm">{uploading ? 'Загрузка...' : label}</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
