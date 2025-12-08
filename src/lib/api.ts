import axios from 'axios';
import { Photo, PhotoFeedResponse, LikesFeedResponse, User, LikeResponse, CommentsResponse, Comment } from '@/types/photo';

// Используем относительный базовый путь, чтобы проходить через rewrite Next.js и избегать CORS при разработке.
// Для продакшена можно задать абсолютный домен через NEXT_PUBLIC_API_URL.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Публичные эндпоинты
export async function getFeed(cursor?: string | null, size: number = 20): Promise<PhotoFeedResponse> {
  const params: { size: number; cursor?: string } = { size };
  if (cursor) {
    params.cursor = cursor;
  }
  const response = await api.get<PhotoFeedResponse>('/media/feed', { params });
  return response.data;
}

export async function getPhoto(id: number): Promise<Photo> {
  const response = await api.get<Photo>(`/media/${id}`);
  return response.data;
}

export async function getUser(id: number): Promise<User> {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
}

// Защищённые эндпоинты (требуют токен)
export async function getCurrentUser(token: string): Promise<User> {
  const response = await api.get<User>('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function uploadPhoto(
  file: File,
  title: string,
  token: string,
  description?: string
): Promise<Photo> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  if (description) {
    formData.append('description', description);
  }

  const response = await api.post<Photo>('/media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function deletePhoto(id: number, token: string): Promise<void> {
  await api.delete(`/media/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

function makeAbsolute(url: string): string {
  if (url.startsWith('http')) return url;
  if (url.startsWith('/api')) {
    return `${API_BASE_URL}${url.replace('/api', '')}`;
  }
  return `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
}

export function getImageUrl(imageUrl: string): string {
  // Если уже абсолютный URL (S3/MinIO) — возвращаем как есть
  return makeAbsolute(imageUrl);
}

export function getVideoUrl(videoUrl: string): string {
  return makeAbsolute(videoUrl);
}

// Лайки
export async function toggleLike(photoId: number, token: string): Promise<LikeResponse> {
  const response = await api.post<LikeResponse>(`/media/${photoId}/likes`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getLikeStatus(photoId: number, token: string): Promise<LikeResponse> {
  const response = await api.get<LikeResponse>(`/media/${photoId}/likes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getMyLikedMedia(
  token: string,
  cursor?: string | null,
  size: number = 20
): Promise<LikesFeedResponse> {
  const params: { size: number; cursor?: string } = { size };
  if (cursor) {
    params.cursor = cursor;
  }
  const response = await api.get<LikesFeedResponse>('/users/me/likes', {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// Комментарии
export async function getComments(
  photoId: number,
  cursor?: string | null,
  size: number = 20
): Promise<CommentsResponse> {
  const params: { size: number; cursor?: string } = { size };
  if (cursor) {
    params.cursor = cursor;
  }
  const response = await api.get<CommentsResponse>(`/media/${photoId}/comments`, { params });
  return response.data;
}

export async function addComment(
  photoId: number,
  text: string,
  token: string
): Promise<Comment> {
  const response = await api.post<Comment>(
    `/media/${photoId}/comments`,
    { text },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

export async function deleteComment(commentId: number, token: string): Promise<void> {
  await api.delete(`/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
