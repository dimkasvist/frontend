'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Chat, TypingNotification } from '@/types/chat';
import { getChatMessages, markAllMessagesAsRead, updateMessage, deleteMessage, ChatService } from '@/lib/chat-api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, X, Phone, Video, Paperclip, Image as ImageIcon, Send, FileText, Film } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import MessageBubble from './MessageBubble';
import FileUploadButton from './FileUploadButton';
import { formatMessageDate } from '@/lib/date-utils';

interface ChatWindowProps {
  chat: Chat;
  onBack: () => void;
  onClose: () => void;
  onSendMessage: (content: string, messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE', attachmentUrl?: string) => void;
  onTyping: (isTyping: boolean) => void;
  typingNotification: TypingNotification | null;
  newMessages: Message[];
  statusUpdates?: any[];
  deletedMessageIds?: number[];
  onMessageUpdate?: (messageId: number, content: string) => void;
  onMessageDelete?: (messageId: number) => void;
  chatService?: ChatService | null;
}

export default function ChatWindow({
  chat,
  onBack,
  onClose,
  onSendMessage,
  onTyping,
  typingNotification,
  newMessages,
  statusUpdates = [],
  deletedMessageIds = [],
  onMessageUpdate,
  onMessageDelete,
  chatService,
}: ChatWindowProps) {
  const router = useRouter();
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [showFileMenu, setShowFileMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat && token) {
      loadMessages();
      markAsRead();
    }
  }, [chat.id, token]);

  useEffect(() => {
    if (newMessages.length > 0) {
      const messagesForThisChat = newMessages.filter(msg => msg.chatId === chat.id);
      if (messagesForThisChat.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMessages = messagesForThisChat.filter(msg => !existingIds.has(msg.id));
          if (uniqueNewMessages.length > 0) {
            uniqueNewMessages.forEach(msg => {
              if (msg.sender.id !== user?.id && chatService) {
                chatService.markAsRead(msg.id);
              }
            });
            return [...prev, ...uniqueNewMessages];
          }
          const updatedMessages = prev.map(prevMsg => {
            const updated = messagesForThisChat.find(newMsg => newMsg.id === prevMsg.id);
            return updated || prevMsg;
          });
          if (JSON.stringify(updatedMessages) !== JSON.stringify(prev)) {
            return updatedMessages;
          }
          return prev;
        });
        scrollToBottom();
      }
    }
  }, [newMessages, chat.id, chatService, user]);

  useEffect(() => {
    if (deletedMessageIds.length > 0) {
      setMessages((prev) => prev.filter(msg => !deletedMessageIds.includes(msg.id)));
    }
  }, [deletedMessageIds]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setShowFileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (statusUpdates.length > 0) {
      const latestUpdate = statusUpdates[statusUpdates.length - 1];
      if (latestUpdate.messageId) {
        setMessages((prev) =>
          prev.map(msg =>
            msg.id === latestUpdate.messageId
              ? {
                  ...msg,
                  status: {
                    isDelivered: latestUpdate.isDelivered ?? msg.status?.isDelivered ?? false,
                    isRead: latestUpdate.isRead ?? msg.status?.isRead ?? false,
                    deliveredAt: latestUpdate.deliveredAt ?? msg.status?.deliveredAt ?? null,
                    readAt: latestUpdate.readAt ?? msg.status?.readAt ?? null,
                  }
                }
              : msg
          )
        );
      }
    }
  }, [statusUpdates]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom(true);
    }
  }, [loading]);

  const loadMessages = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await getChatMessages(token, chat.id);
      setMessages(response.messages.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!token) return;
    
    try {
      await markAllMessagesAsRead(token, chat.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const scrollToBottom = (instant = false) => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
    }, instant ? 0 : 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (e.target.value) {
      onTyping(true);
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 3000);
    } else {
      onTyping(false);
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    onSendMessage(messageText, 'TEXT');
    setMessageText('');
    onTyping(false);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (fileUrl: string, fileType: 'IMAGE' | 'VIDEO' | 'FILE') => {
    onSendMessage(messageText || 'Отправлено вложение', fileType, fileUrl);
    setMessageText('');
    setShowFileMenu(false);
  };

  const handleEditMessage = async (messageId: number, newContent: string) => {
    if (!token) return;
    try {
      const updatedMessage = await updateMessage(token, messageId, newContent);
      setMessages((prev) => prev.map(m => m.id === messageId ? updatedMessage : m));
      if (onMessageUpdate) onMessageUpdate(messageId, newContent);
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!token) return;
    try {
      await deleteMessage(token, messageId);
      setMessages((prev) => prev.filter(m => m.id !== messageId));
      if (onMessageDelete) onMessageDelete(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach((message) => {
      const dateKey = new Date(message.createdAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      messages: msgs,
    }));
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <div className="flex items-center gap-2 p-3 border-b border-[var(--border-color)] bg-[var(--header-bg)]">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-[var(--input-bg)] rounded-full transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        
        <div 
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push(`/users/${chat.user.id}`)}
        >
          {chat.user.avatarUrl ? (
            <Image
              src={chat.user.avatarUrl}
              alt={chat.user.displayName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              {chat.user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[var(--foreground)] truncate">
              {chat.user.displayName}
            </h2>
            {typingNotification?.isTyping && typingNotification.chatId === chat.id && (
              <p className="text-xs text-[var(--text-secondary)]">печатает...</p>
            )}
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-[var(--input-bg)] rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-xs animate-pulse">
                  <div className="h-16 bg-[var(--input-bg)] rounded-2xl w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[var(--input-bg)] flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-[var(--text-secondary)]" />
            </div>
            <p className="text-[var(--text-secondary)] mb-2">Нет сообщений</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Отправьте первое сообщение {chat.user.displayName}
            </p>
          </div>
        ) : (
          <>
            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <div className="flex items-center justify-center my-4">
                  <div className="px-4 py-1 bg-[var(--input-bg)] rounded-full text-xs text-[var(--text-secondary)] font-medium">
                    {formatMessageDate(group.messages[0].createdAt)}
                  </div>
                </div>
                
                {group.messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender.id === user?.id}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                  />
                ))}
              </div>
            ))}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 border-t border-[var(--border-color)] bg-[var(--header-bg)]">
        <div className="flex items-center gap-1">
          <div className="relative" ref={fileMenuRef}>
            <button
              onClick={() => setShowFileMenu(!showFileMenu)}
              className="p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors"
            >
              <Paperclip className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
            
            {showFileMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] p-2 z-10">
                <FileUploadButton
                  accept="image/*"
                  icon={<ImageIcon className="w-4 h-4" />}
                  label="Фото"
                  onUpload={handleFileUpload}
                />
                <FileUploadButton
                  accept="video/*"
                  icon={<Film className="w-4 h-4" />}
                  label="Видео"
                  onUpload={handleFileUpload}
                />
                <FileUploadButton
                  accept="*"
                  icon={<FileText className="w-4 h-4" />}
                  label="Файл"
                  onUpload={handleFileUpload}
                />
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={messageText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Сообщение..."
              className="w-full px-4 py-3 text-base bg-[var(--input-bg)] text-[var(--foreground)] rounded-full outline-none focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className={`p-2 rounded-full transition-colors ${
              messageText.trim()
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-[var(--input-bg)] text-[var(--text-secondary)] cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
