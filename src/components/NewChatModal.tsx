'use client';

import { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { User } from '@/types/photo';
import { searchUsers } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: number) => void;
}

export default function NewChatModal({ isOpen, onClose, onSelectUser }: NewChatModalProps) {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery && token) {
      searchForUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery, token]);

  const searchForUsers = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const results = await searchUsers(token, searchQuery);
      setUsers(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: number) => {
    onSelectUser(userId);
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-xl font-bold">Новое сообщение</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-[var(--input-bg)] text-[var(--foreground)] rounded-full outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--text-secondary)]" />
            </div>
          ) : users.length === 0 && searchQuery ? (
            <div className="text-center py-12 px-6">
              <p className="text-[var(--text-secondary)]">Пользователи не найдены</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Попробуйте другой запрос
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Search className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3" />
              <p className="text-[var(--text-secondary)]">
                Начните вводить имя пользователя
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[var(--input-bg)] rounded-xl transition-colors"
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.displayName}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white font-bold">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-[var(--foreground)]">
                      {user.displayName}
                    </p>
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
