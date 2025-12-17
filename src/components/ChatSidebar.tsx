'use client';

import { useState, useEffect } from 'react';
import { Chat } from '@/types/chat';
import { getChats } from '@/lib/chat-api';
import { useAuth } from '@/lib/auth-context';
import { X, Edit, UserPlus, Search } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from '@/lib/date-utils';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedChatId: number | null;
  onSelectChat: (chatId: number) => void;
  onNewChat: () => void;
  unreadCount?: number;
}

export default function ChatSidebar({
  isOpen,
  onClose,
  selectedChatId,
  onSelectChat,
  onNewChat,
  unreadCount = 0,
}: ChatSidebarProps) {
  const { token } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && token) {
      loadChats();
    }
  }, [isOpen, token]);

  const loadChats = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await getChats(token);
      setChats(response.chats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const truncateMessage = (text: string, maxLength: number = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">Сообщения</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewChat}
            className="p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors text-red-500"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Поиск"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-[var(--input-bg)] text-[var(--foreground)] text-sm rounded-full outline-none focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-1 px-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-2 p-2 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[var(--input-bg)]" />
                  <div className="flex-1">
                    <div className="h-3 bg-[var(--input-bg)] rounded w-3/4 mb-1" />
                    <div className="h-3 bg-[var(--input-bg)] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <UserPlus className="w-10 h-10 text-[var(--text-secondary)] mb-2" />
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                {searchQuery ? 'Чаты не найдены' : 'Нет сообщений'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {searchQuery ? 'Попробуйте другой запрос' : 'Начните новый чат'}
              </p>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`w-full flex gap-2 p-2 rounded-lg transition-colors ${
                    selectedChatId === chat.id
                      ? 'bg-[var(--input-bg)]'
                      : 'hover:bg-[var(--input-bg)]'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {chat.user.avatarUrl ? (
                      <Image
                        src={chat.user.avatarUrl}
                        alt={chat.user.displayName}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                        {chat.user.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {chat.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {chat.unreadCount > 9 ? '9' : chat.unreadCount}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
                        {chat.user.displayName}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-[10px] text-[var(--text-secondary)] ml-1 whitespace-nowrap">
                          {formatDistanceToNow(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p
                        className={`text-xs truncate ${
                          chat.unreadCount > 0
                            ? 'text-[var(--foreground)] font-medium'
                            : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {chat.lastMessage.messageType === 'TEXT'
                          ? truncateMessage(chat.lastMessage.content, 30)
                          : chat.lastMessage.messageType === 'IMAGE'
                          ? '📷 Фото'
                          : chat.lastMessage.messageType === 'VIDEO'
                          ? '🎥 Видео'
                          : chat.lastMessage.messageType === 'SHARED_POST'
                          ? '🔗 Пост'
                          : '📎 Файл'}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}
