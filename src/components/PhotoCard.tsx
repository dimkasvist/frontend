'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Photo } from '@/types/photo';
import { getImageUrl, getVideoUrl } from '@/lib/api';
import { MoreHorizontal, Play } from 'lucide-react';

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
}

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const isVideo = photo.mediaType === 'VIDEO';
  const isGif = useMemo(() => {
    const type = photo.contentType?.toLowerCase() || '';
    return photo.mediaType === 'PHOTO' && (type.includes('gif') || photo.url.toLowerCase().endsWith('.gif'));
  }, [photo]);

  const gifStillFallback = useMemo(
    () => getImageUrl(photo.posterUrl || photo.url),
    [photo.posterUrl, photo.url]
  );

  const [isGifPlaying, setIsGifPlaying] = useState(false);
  const [gifStillUrl, setGifStillUrl] = useState<string | null>(photo.posterUrl ?? null);
  const [gifPosterSrc, setGifPosterSrc] = useState<string>(gifStillFallback);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Извлекаем первый кадр GIF, если постера нет
  useEffect(() => {
    if (!isGif || gifStillUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = gifStillFallback;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        setGifStillUrl(dataUrl);
      } catch {
        // Если не удалось (CORS), просто остаёмся без постера
      }
    };
  }, [gifStillUrl, isGif, photo.url]);

  // Выбираем источник превью для GIF
  useEffect(() => {
    const src = gifStillUrl
      ? gifStillUrl
      : gifStillFallback;
    setGifPosterSrc(src);
  }, [gifStillUrl, gifStillFallback, photo.posterUrl]);

  const handleHover = (shouldPlay: boolean) => {
    const video = videoRef.current;
    if (!video) return;
    if (shouldPlay) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  };

  return (
    <div
      className="mb-4 break-inside-avoid cursor-zoom-in group"
      onClick={onClick}
      onMouseEnter={() => {
        handleHover(true);
        if (isGif) setIsGifPlaying(true);
      }}
      onMouseLeave={() => {
        handleHover(false);
        if (isGif) setIsGifPlaying(false);
      }}
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-gray-200"
        style={{
          aspectRatio: photo.aspectRatio || photo.width / Math.max(photo.height, 1),
        }}
      >
        {isVideo ? (
          <>
            <video
              ref={videoRef}
              src={getVideoUrl(photo.url)}
              poster={getImageUrl(photo.posterUrl || photo.url)}
              className="w-full h-auto block object-contain bg-black"
              muted
              loop
              playsInline
            />
            <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur">
              <Play className="w-4 h-4" />
              <span>Видео</span>
            </div>
          </>
        ) : isGif ? (
          <>
            {isGifPlaying ? (
              <img
                key="gif"
                src={getImageUrl(photo.url)}
                alt={photo.title}
                className="w-full h-auto block object-contain"
                loading="eager"
                decoding="async"
              />
            ) : (
              <img
                key="poster"
                src={gifPosterSrc}
                alt={photo.title}
                className="w-full h-auto block object-contain"
                loading="eager"
                decoding="async"
                onError={() => setGifPosterSrc(gifStillFallback)}
              />
            )}
            <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur">
              <span>GIF</span>
            </div>
          </>
        ) : (
          <img
            src={getImageUrl(photo.url)}
            alt={photo.title}
            className="w-full h-auto block object-contain"
            loading="eager"
            decoding="async"
          />
        )}

        {/* Overlay on hover - Pinterest style */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />
        
        {/* Action button - Pinterest style */}
        <button
          onClick={(e) => { e.stopPropagation(); }}
          className="absolute bottom-2 right-2 p-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-700" />
        </button>
      </div>
    </div>
  );
}
