'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Photo } from '@/types/photo';
import { getPhoto } from '@/lib/api';
import PhotoModal from '@/components/PhotoModal';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import UploadModal from '@/components/UploadModal';
import { Loader2 } from 'lucide-react';

export default function MediaPage() {
  const params = useParams();
  const router = useRouter();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    const id = parseInt(params.id as string, 10);
    if (isNaN(id)) {
      setError('Некорректный ID');
      setLoading(false);
      return;
    }

    getPhoto(id)
      .then(data => {
        setPhoto(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load photo:', err);
        setError('Пин не найден');
        setLoading(false);
      });
  }, [params.id]);

  const handleClose = () => {
    router.push('/');
  };

  const handleDelete = (id: number) => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center ml-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar onCreateClick={() => setUploadModalOpen(true)} />
        <Header onUploadClick={() => setUploadModalOpen(true)} />
        <div className="ml-20 pt-32 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-[var(--foreground)] mb-2">
            {error || 'Пин не найден'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors"
          >
            На главную
          </button>
        </div>
        <UploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar onCreateClick={() => setUploadModalOpen(true)} />
      <PhotoModal
        photo={photo}
        onClose={handleClose}
        onDelete={handleDelete}
      />
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
