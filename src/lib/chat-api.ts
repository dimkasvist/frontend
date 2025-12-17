import axios from 'axios';
import SockJS from 'sockjs-client';
import { Client, StompSubscription } from '@stomp/stompjs';
import {
  Chat,
  ChatsResponse,
  Message,
  MessagesResponse,
  SendMessageRequest,
  TypingNotification,
  FileUploadResponse,
} from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Determine WebSocket URL based on protocol
const getWebSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  
  // Auto-detect protocol for deployment
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }
  
  // Fallback for server-side rendering
  return 'http://localhost:8080/ws';
};

const WS_URL = typeof window !== 'undefined' ? getWebSocketUrl() : (process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws');

const api = axios.create({
  baseURL: API_BASE_URL,
});

export class ChatService {
  private stompClient: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(token?: string) {
    if (token) {
      this.token = token;
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  connect(
    onMessage: (message: Message) => void,
    onTyping: (notification: TypingNotification) => void,
    onStatus: (status: any) => void,
    onConnect?: () => void,
    onError?: (error: any) => void
  ): void {
    if (this.stompClient?.connected) {
      return;
    }

    const wsUrlWithAuth = `${WS_URL}?access_token=${encodeURIComponent(this.token || '')}`;
    const socket = new SockJS(wsUrlWithAuth, null, {
      transports: ['websocket'],
    });
    
    this.stompClient = new Client({
      webSocketFactory: () => socket as any,
      connectHeaders: {
        Authorization: `Bearer ${this.token}`,
      },
      debug: (str) => {
        console.log('STOMP:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      if (this.stompClient) {
        const messageSub = this.stompClient.subscribe('/user/queue/messages', (msg) => {
          const message = JSON.parse(msg.body) as Message;
          onMessage(message);
        });
        this.subscriptions.set('messages', messageSub);

        const typingSub = this.stompClient.subscribe('/user/queue/typing', (msg) => {
          const typing = JSON.parse(msg.body) as TypingNotification;
          onTyping(typing);
        });
        this.subscriptions.set('typing', typingSub);

        const statusSub = this.stompClient.subscribe('/user/queue/status', (msg) => {
          const status = JSON.parse(msg.body);
          onStatus(status);
        });
        this.subscriptions.set('status', statusSub);
      }

      if (onConnect) {
        onConnect();
      }
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame);
      if (onError) {
        onError(frame);
      }
    };

    this.stompClient.onWebSocketClose = () => {
      console.log('WebSocket closed');
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    };

    this.stompClient.activate();
  }

  disconnect(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }

  sendMessage(message: SendMessageRequest): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(message),
      });
    }
  }

  sendTypingNotification(chatId: number, recipientId: number, isTyping: boolean): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({
          chatId,
          userId: recipientId,
          isTyping,
        }),
      });
    }
  }

  markAsDelivered(messageId: number): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/chat.delivered',
        body: JSON.stringify({ messageId }),
      });
    }
  }

  markAsRead(messageId: number): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/chat.read',
        body: JSON.stringify({ messageId }),
      });
    }
  }

  isConnected(): boolean {
    return this.stompClient?.connected ?? false;
  }
}

export async function getChats(token: string, page: number = 0, size: number = 20): Promise<ChatsResponse> {
  const response = await api.get<ChatsResponse>('/chats', {
    params: { page, size },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function createChat(token: string, userId: number): Promise<Chat> {
  const response = await api.post<Chat>(`/chats/create/${userId}`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getChatMessages(
  token: string,
  chatId: number,
  page: number = 0,
  size: number = 50
): Promise<MessagesResponse> {
  const response = await api.get<MessagesResponse>(`/messages/chat/${chatId}`, {
    params: { page, size },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function sendMessageREST(token: string, message: SendMessageRequest): Promise<Message> {
  const response = await api.post<Message>('/messages', message, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function updateMessage(token: string, messageId: number, content: string): Promise<Message> {
  const response = await api.put<Message>(`/messages/${messageId}`, content, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
  });
  return response.data;
}

export async function deleteMessage(token: string, messageId: number): Promise<void> {
  await api.delete(`/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function markMessageAsDelivered(token: string, messageId: number): Promise<void> {
  await api.post(`/messages/${messageId}/delivered`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function markMessageAsRead(token: string, messageId: number): Promise<void> {
  await api.post(`/messages/${messageId}/read`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function markAllMessagesAsRead(token: string, chatId: number): Promise<void> {
  await api.post(`/messages/chat/${chatId}/read-all`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getUnreadMessagesCount(token: string): Promise<number> {
  const response = await api.get<number>('/messages/unread-count', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function uploadChatFile(token: string, file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<FileUploadResponse>('/chat/files/upload', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}
