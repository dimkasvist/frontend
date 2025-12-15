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

export interface Board {
  id: number;
  name: string;
  description: string | null;
  isPrivate: boolean;
  user: User;
  mediaCount: number;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardsResponse {
  boards: Board[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface BoardMediaItem {
  id: number;
  media: Photo;
  addedAt: string;
}

export interface BoardMediaResponse {
  items: BoardMediaItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CreateBoardRequest {
  name: string;
  description?: string;
  isPrivate: boolean;
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

// Follow types
export interface Follow {
  id: number;
  user: User;
  createdAt: string;
}

export interface FollowListResponse {
  users: User[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
}

// Notification types
export type NotificationType = 'LIKE' | 'COMMENT' | 'COMMENT_LIKE' | 'NEW_PIN_FROM_FOLLOWING';

export interface Notification {
  id: number;
  type: NotificationType;
  actor: User;
  media?: Photo;
  commentId?: number;
  isRead: boolean;
  createdAt: string;
  message: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// Notification Settings types
export interface NotificationSettings {
  id: number;
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  likeNotifications: boolean;
  commentNotifications: boolean;
  commentLikeNotifications: boolean;
  newPinNotifications: boolean;
}

export interface UpdateNotificationSettingsRequest {
  notificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  likeNotifications?: boolean;
  commentNotifications?: boolean;
  commentLikeNotifications?: boolean;
  newPinNotifications?: boolean;
}
