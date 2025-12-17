'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { X, Upload, Loader2 } from 'lucide-react';
import { uploadPhoto } from '@/lib/api';
import { Photo } from '@/types/photo';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (photo: Photo) => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    const validTypes = [...imageTypes, ...videoTypes];

    if (!validTypes.includes(selectedFile.type)) {
      setError('Поддерживаются изображения (JPEG/PNG/GIF/WebP) и видео (MP4/WebM/MOV/MKV)');
      return;
    }

    const maxSizeMb = 100;
    if (selectedFile.size > maxSizeMb * 1024 * 1024) {
      setError(`Максимальный размер файла — ${maxSizeMb} МБ`);
      return;
    }

    setError(null);
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !token) return;

    setLoading(true);
    setError(null);

    try {
      const photo = await uploadPhoto(file, title.trim(), token, description.trim() || undefined);
      onSuccess(photo);
      handleClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Ошибка при загрузке');
      } else {
        setError('Ошибка при загрузке');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setTitle('');
    setDescription('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />

      <div className="relative bg-[var(--card-bg)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Создать дим</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[var(--foreground)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              {!preview ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`h-80 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-[var(--border-color)] hover:border-[var(--text-secondary)] bg-[var(--input-bg)]'
                  }`}
                >
                  <Upload className="w-10 h-10 text-[var(--text-secondary)] mb-3" />
                  <p className="text-[var(--foreground)] font-medium">
                    Перетащите или нажмите для загрузки
                  </p>
                  <p className="text-[var(--text-secondary)] text-sm mt-1">
                    Фото: JPEG/PNG/GIF/WebP, Видео: MP4/WebM/MOV/MKV
                  </p>
                </div>
              ) : (
                <div className="relative h-80 rounded-2xl overflow-hidden bg-[var(--input-bg)]">
                  {file?.type.startsWith('video') ? (
                    <video
                      src={preview || ''}
                      className="w-full h-full object-contain"
                      controls
                    />
                  ) : (
                    <img
                      src={preview || ''}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-[var(--card-bg)] rounded-full shadow-md hover:bg-[var(--input-bg)] transition-colors"
                  >
                    <X className="w-4 h-4 text-[var(--foreground)]" />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime,video/x-matroska"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Название <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={255}
                  placeholder="Добавьте название"
                  className="w-full px-4 py-3 border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Описание
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                  placeholder="Расскажите подробнее"
                  rows={4}
                  className="w-full px-4 py-3 border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--foreground)] rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={!file || !title.trim() || loading}
                className="w-full py-3 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  'Опубликовать'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
