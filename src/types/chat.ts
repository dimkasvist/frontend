export interface ChatUser {
  id: number;
  displayName: string;
  avatarUrl: string | null;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'SHARED_POST';
export type FileType = 'IMAGE' | 'VIDEO' | 'FILE';

export interface MessageStatus {
  isDelivered: boolean;
  isRead: boolean;
  deliveredAt: string | null;
  readAt: string | null;
}

export interface SharedMediaInfo {
  id: number;
  title: string;
  thumbnailUrl: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'GIF';
}

export interface Message {
  id: number;
  chatId: number;
  sender: ChatUser;
  content: string;
  messageType: MessageType;
  attachmentUrl: string | null;
  sharedMedia?: SharedMediaInfo | null;
  isEdited: boolean;
  status: MessageStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: number;
  user: ChatUser;
  lastMessage: Message | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatsResponse {
  chats: Chat[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface MessagesResponse {
  messages: Message[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface SendMessageRequest {
  recipientId: number;
  content: string;
  messageType: MessageType;
  attachmentUrl?: string | null;
  sharedMediaId?: number | null;
}

export interface TypingNotification {
  chatId: number;
  userId: number;
  displayName?: string;
  isTyping: boolean;
}

export interface FileUploadResponse {
  fileName: string;
  fileUrl: string;
  fileType: FileType;
}
