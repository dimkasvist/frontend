import axios from 'axios';
import {
  Photo,
  PhotoFeedResponse,
  LikesFeedResponse,
  User,
  LikeResponse,
  CommentsResponse,
  Comment,
  CommentLikeResponse,
  Board,
  BoardsResponse,
  BoardMediaResponse,
  BoardMediaItem,
  CreateBoardRequest,
  UpdateBoardRequest,
  Follow,
  FollowListResponse,
  FollowStats,
  Notification,
  NotificationListResponse,
  NotificationSettings,
  UpdateNotificationSettingsRequest,
} from '@/types/photo';

// Используем относительный базовый путь, чтобы проходить через rewrite Next.js и избегать CORS при разработке.
// Для продакшена можно задать абсолютный домен через NEXT_PUBLIC_API_URL.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Публичные эндпоинты
interface FeedParams {
  cursor?: string | null;
  size?: number;
  authorId?: number;
  token?: string | null;
}

export async function getFeed(params: FeedParams = {}): Promise<PhotoFeedResponse> {
  const { cursor, size = 20, authorId, token } = params;
  const query: { size: number; cursor?: string; authorId?: number } = {
    size,
  };
  if (cursor) {
    query.cursor = cursor;
  }
  if (authorId) {
    query.authorId = authorId;
  }
  const response = await api.get<PhotoFeedResponse>('/media/feed', {
    params: query,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

interface SearchParams {
  query: string;
  cursor?: string | null;
  size?: number;
  token?: string | null;
}

export async function searchMedia(params: SearchParams): Promise<PhotoFeedResponse> {
  const { query, cursor, size = 20, token } = params;
  const searchParams: { q: string; size: number; cursor?: string } = {
    q: query,
    size,
  };
  if (cursor) {
    searchParams.cursor = cursor;
  }
  const response = await api.get<PhotoFeedResponse>('/media/search', {
    params: searchParams,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
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

interface UserLikedOptions {
  cursor?: string | null;
  size?: number;
  token?: string;
}

export async function getUserLikedMedia(
  userId: number,
  options: UserLikedOptions = {}
): Promise<LikesFeedResponse> {
  const { cursor, size = 20, token } = options;
  const params: { size: number; cursor?: string } = { size };
  if (cursor) {
    params.cursor = cursor;
  }

  const response = await api.get<LikesFeedResponse>(`/users/${userId}/likes`, {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

// Комментарии
export async function getComments(
  photoId: number,
  cursor?: string | null,
  size: number = 20,
  token?: string | null
): Promise<CommentsResponse> {
  const params: { size: number; cursor?: string } = { size };
  if (cursor) {
    params.cursor = cursor;
  }
  const response = await api.get<CommentsResponse>(`/media/${photoId}/comments`, {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
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

export async function toggleCommentLike(commentId: number, token: string): Promise<CommentLikeResponse> {
  const response = await api.post<CommentLikeResponse>(`/comments/${commentId}/likes`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getCommentLikeStatus(commentId: number, token: string): Promise<CommentLikeResponse> {
  const response = await api.get<CommentLikeResponse>(`/comments/${commentId}/likes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

// Boards
export async function createBoard(data: CreateBoardRequest, token: string): Promise<Board> {
  const response = await api.post<Board>('/boards', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function updateBoard(id: number, data: UpdateBoardRequest, token: string): Promise<Board> {
  const response = await api.put<Board>(`/boards/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getBoard(id: number, token?: string | null): Promise<Board> {
  const response = await api.get<Board>(`/boards/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function getMyBoards(page: number = 0, size: number = 20, token: string): Promise<BoardsResponse> {
  const response = await api.get<BoardsResponse>('/boards/my', {
    params: { page, size },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getUserBoards(userId: number, page: number = 0, size: number = 20, token?: string | null): Promise<BoardsResponse> {
  const response = await api.get<BoardsResponse>(`/boards/user/${userId}`, {
    params: { page, size },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function deleteBoard(id: number, token: string): Promise<void> {
  await api.delete(`/boards/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function addMediaToBoard(boardId: number, mediaId: number, token: string): Promise<BoardMediaItem> {
  const response = await api.post<BoardMediaItem>(`/boards/${boardId}/media/${mediaId}`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function removeMediaFromBoard(boardId: number, mediaId: number, token: string): Promise<void> {
  await api.delete(`/boards/${boardId}/media/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getBoardMedia(boardId: number, page: number = 0, size: number = 20, token?: string | null): Promise<BoardMediaResponse> {
  const response = await api.get<BoardMediaResponse>(`/boards/${boardId}/media`, {
    params: { page, size },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

// ============================================
// Follow API
// ============================================

export async function followUser(userId: number, token: string): Promise<Follow> {
  const response = await api.post<Follow>(`/follow/${userId}`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function unfollowUser(userId: number, token: string): Promise<void> {
  await api.delete(`/follow/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function checkFollowing(userId: number, token: string): Promise<boolean> {
  const response = await api.get<boolean>(`/follow/check/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getFollowers(userId: number, page: number = 0, size: number = 20, token?: string | null): Promise<FollowListResponse> {
  const response = await api.get<FollowListResponse>(`/follow/${userId}/followers`, {
    params: { page, size },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function getFollowing(userId: number, page: number = 0, size: number = 20, token?: string | null): Promise<FollowListResponse> {
  const response = await api.get<FollowListResponse>(`/follow/${userId}/following`, {
    params: { page, size },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function getFollowStats(userId: number, token?: string | null): Promise<FollowStats> {
  const response = await api.get<FollowStats>(`/follow/${userId}/stats`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

// ============================================
// Notifications API
// ============================================

export async function getNotifications(page: number = 0, size: number = 20, token: string): Promise<NotificationListResponse> {
  const response = await api.get<NotificationListResponse>('/notifications', {
    params: { page, size },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getUnreadNotifications(page: number = 0, size: number = 20, token: string): Promise<NotificationListResponse> {
  const response = await api.get<NotificationListResponse>('/notifications/unread', {
    params: { page, size },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getUnreadCount(token: string): Promise<number> {
  const response = await api.get<number>('/notifications/unread/count', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function markNotificationAsRead(notificationId: number, token: string): Promise<void> {
  await api.put(`/notifications/${notificationId}/read`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function markAllNotificationsAsRead(token: string): Promise<void> {
  await api.put('/notifications/read-all', null, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ============================================
// Notification Settings API
// ============================================

export async function getNotificationSettings(token: string): Promise<NotificationSettings> {
  const response = await api.get<NotificationSettings>('/notification-settings', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function updateNotificationSettings(settings: UpdateNotificationSettingsRequest, token: string): Promise<NotificationSettings> {
  const response = await api.put<NotificationSettings>('/notification-settings', settings, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
