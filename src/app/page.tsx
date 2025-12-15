'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Photo } from '@/types/photo';
import { getFeed } from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PhotoGrid from '@/components/PhotoGrid';
import UploadModal from '@/components/UploadModal';
import PhotoModal from '@/components/PhotoModal';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const firstRenderRef = useRef(true);
  const { token } = useAuth();
  const router = useRouter();

  const loadPhotos = useCallback(async (nextCursor?: string | null, reset: boolean = false) => {
    setLoading(true);
    try {
      const response = await getFeed({
        cursor: reset ? null : nextCursor,
        size: 20,
        token,
      });
      setPhotos(prev => reset ? response.items : [...prev, ...response.items]);
      setHasMore(response.hasMore);
      setCursor(response.nextCursor);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
      if (firstRenderRef.current) {
        firstRenderRef.current = false;
      }
    }
  }, [token]);

  useEffect(() => {
    loadPhotos(null, true);
  }, [loadPhotos]);

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
    setSelectedPhoto(photo);
  };

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
