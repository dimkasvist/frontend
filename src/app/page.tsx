'use client';

import { useState, useEffect, useCallback } from 'react';
import { Photo } from '@/types/photo';
import { getFeed } from '@/lib/api';
import Header from '@/components/Header';
import PhotoGrid from '@/components/PhotoGrid';
import UploadModal from '@/components/UploadModal';
import PhotoModal from '@/components/PhotoModal';

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const loadPhotos = useCallback(async (nextCursor?: string | null, reset: boolean = false) => {
    setLoading(true);
    try {
      const response = await getFeed(reset ? null : nextCursor, 20);
      setPhotos(prev => reset ? response.items : [...prev, ...response.items]);
      setHasMore(response.hasMore);
      setCursor(response.nextCursor);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors">
      <Header onUploadClick={() => setUploadModalOpen(true)} />
      
      <main className="pt-20 pb-8">
        <PhotoGrid
          photos={photos}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onPhotoClick={setSelectedPhoto}
        />
      </main>

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
