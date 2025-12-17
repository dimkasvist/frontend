'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Photo } from '@/types/photo';
import PhotoCard from './PhotoCard';

const SKELETON_RATIOS = [0.65, 0.85, 1, 1.2, 1.4, 1.65];

interface PhotoGridProps {
  photos: Photo[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onPhotoClick: (photo: Photo) => void;
  onShare?: (photoId: number) => void;
  showInitialSkeleton?: boolean;
}

export default function PhotoGrid({
  photos,
  loading,
  hasMore,
  onLoadMore,
  onPhotoClick,
  onShare,
  showInitialSkeleton,
}: PhotoGridProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore]
  );

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  const renderSkeleton = (key: number) => (
    <div key={`skeleton-${key}`} className="mb-4 break-inside-avoid">
      <div
        className="w-full rounded-2xl bg-[var(--input-bg)] relative overflow-hidden"
        style={{ aspectRatio: SKELETON_RATIOS[key % SKELETON_RATIOS.length] }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50 animate-[pulse_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );

  const shouldShowSkeletonGrid =
    photos.length === 0 && (typeof showInitialSkeleton === 'boolean' ? showInitialSkeleton : loading);

  if (shouldShowSkeletonGrid) {
    return (
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 px-2 sm:px-4">
        {Array.from({ length: 18 }).map((_, index) => renderSkeleton(index))}
      </div>
    );
  }

  if (photos.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
        <p className="text-xl font-medium">Пока пусто</p>
        <p className="mt-2 text-base">Добавьте первые димы, чтобы страница ожила</p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 px-2 sm:px-4">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => onPhotoClick(photo)}
            onShare={onShare}
          />
        ))}
        {loading &&
          photos.length > 0 &&
          Array.from({ length: 6 }).map((_, index) => renderSkeleton(index))}
      </div>

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center" />
    </>
  );
}
