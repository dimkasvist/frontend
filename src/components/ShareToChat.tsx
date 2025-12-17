'use client';

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { getChats } from '@/lib/chat-api';
import { useAuth } from '@/lib/auth-context';
import { Chat } from '@/types/chat';
import Image from 'next/image';

interface ShareToChatProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: number) => void;
}

export default function ShareToChat({ isOpen, onClose, onSelectChat }: ShareToChatProps) {
  const { token } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center" onClick={onClose}>
      <div 
        className="bg-[var(--background)] rounded-2xl w-[400px] max-h-[500px] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold">Поделиться в чате</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--input-bg)] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[var(--border-color)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Поиск чатов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-[var(--text-secondary)]">Загрузка...</div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-[var(--text-secondary)]">
                {searchQuery ? 'Ничего не найдено' : 'Нет чатов'}
              </div>
            </div>
          ) : (
            <div className="p-2">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--input-bg)] transition-colors text-left"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-300 flex-shrink-0">
                    {chat.user.avatarUrl ? (
                      <Image
                        src={chat.user.avatarUrl}
                        alt={chat.user.displayName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-white bg-gradient-to-br from-blue-500 to-purple-600">
                        {chat.user.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{chat.user.displayName}</p>
                    {chat.lastMessage && (
                      <p className="text-sm text-[var(--text-secondary)] truncate">
                        {chat.lastMessage.messageType === 'TEXT'
                          ? chat.lastMessage.content
                          : '📎 Вложение'}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
