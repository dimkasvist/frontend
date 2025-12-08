export interface Author {
  id: number;
  displayName: string;
  avatarUrl: string | null;
}

export interface Photo {
  id: number;
  title: string;
  description: string | null;
  url: string;
  mediaType: 'PHOTO' | 'VIDEO';
  posterUrl?: string | null; // fallback для превью видео, если бэк отдаёт
  durationSeconds?: number | null;
  fileSize?: number;
  contentType?: string;
  width: number;
  height: number;
  aspectRatio?: number;
  createdAt: string;
  author: Author;
  likesCount: number;
  commentsCount: number;
  liked?: boolean;
}

export interface Comment {
  id: number;
  text: string;
  createdAt: string;
  author: Author;
  likesCount: number;
  liked: boolean;
}

export interface CommentsResponse {
  comments: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

export interface LikeResponse {
  liked: boolean;
  likesCount: number;
}

export interface CommentLikeResponse {
  liked: boolean;
  likesCount: number;
}

export interface PhotoFeedResponse {
  items: Photo[];
  nextCursor: string | null;
  hasMore: boolean;
  size: number;
}

export interface LikesFeedResponse {
  items: Photo[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
  size?: number;
}

export interface User {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UploadPhotoRequest {
  file: File;
  title: string;
  description?: string;
}
