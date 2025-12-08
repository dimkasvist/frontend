'use client';

export function getAvatarUrl(url: string | null | undefined) {
  if (!url) return null;
  // Проксируем через backend, чтобы избежать 429 от Google
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}
