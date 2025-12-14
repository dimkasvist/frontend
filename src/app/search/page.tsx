'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Photo } from '@/types/photo';
import { searchMedia } from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PhotoGrid from '@/components/PhotoGrid';
import UploadModal from '@/components/UploadModal';
import PhotoModal from '@/components/PhotoModal';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { Search as SearchIcon } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const firstRenderRef = useRef(true);
  const { token } = useAuth();

  const loadPhotos = useCallback(async (nextCursor?: string | null, reset: boolean = false) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await searchMedia({
        query: query.trim(),
        cursor: reset ? null : nextCursor,
        size: 20,
        token,
      });
      setPhotos(prev => reset ? response.items : [...prev, ...response.items]);
      setHasMore(response.hasMore);
      setCursor(response.nextCursor);
    } catch (error) {
      console.error('Error searching photos:', error);
    } finally {
      setLoading(false);
      if (firstRenderRef.current) {
        firstRenderRef.current = false;
      }
    }
  }, [query, token]);

  useEffect(() => {
    setPhotos([]);
    setCursor(null);
    setHasMore(true);
    firstRenderRef.current = true;
    loadPhotos(null, true);
  }, [query, loadPhotos]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPhotos(cursor);
    }
  }, [loading, hasMore, cursor, loadPhotos]);

  const handleUploadSuccess = (photo: Photo) => {
    setPhotos(prev => [photo, ...prev]);
  };

  const handlePhotoDelete = (id: number) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handlePhotoClick = (photo: Photo) => {
    router.push(`/media/${photo.id}`);
  };

  if (!query.trim()) {
    return (
      <div className="min-h-screen bg-[var(--background)] transition-colors">
        <Sidebar onCreateClick={() => setUploadModalOpen(true)} />
        <Header onUploadClick={() => setUploadModalOpen(true)} />
        
        <main className="ml-20 pt-32 pb-8 px-4">
          <div className="max-w-xl mx-auto text-center">
            <SearchIcon className="w-16 h-16 text-[var(--text-secondary)] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Поиск пинов
            </h1>
            <p className="text-[var(--text-secondary)]">
              Введите запрос в строку поиска
            </p>
          </div>
        </main>

        <UploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors">
      <Sidebar onCreateClick={() => setUploadModalOpen(true)} />
      <Header onUploadClick={() => setUploadModalOpen(true)} />
      
      <motion.main
        className="ml-20 pt-20 pb-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="px-4 mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)] max-w-7xl mx-auto">
            Результаты по запросу: <span className="text-red-500">{query}</span>
          </h1>
          {!loading && photos.length === 0 && (
            <p className="text-[var(--text-secondary)] max-w-7xl mx-auto mt-2">
              Ничего не найдено
            </p>
          )}
        </div>

        <PhotoGrid
          photos={photos}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onPhotoClick={handlePhotoClick}
          showInitialSkeleton={firstRenderRef.current && loading}
        />
      </motion.main>

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <PhotoModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDelete={handlePhotoDelete}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <SearchContent />
    </Suspense>
  );
}
