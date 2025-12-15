'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Notification } from '@/types/photo';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatar';
import { getImageUrl } from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import UploadModal from '@/components/UploadModal';
import { motion } from 'framer-motion';
import { Bell, Loader2, Heart, MessageCircle, User as UserIcon, Image as ImageIcon, CheckCheck, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (token) {
      loadNotifications(0, true);
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadNotifications = async (pageNum: number, reset: boolean = false) => {
    if (!token) return;
    
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await getNotifications(pageNum, 20, token);
      setNotifications(prev => reset ? response.notifications : [...prev, ...response.notifications]);
      setHasMore((pageNum + 1) < response.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadNotifications(page + 1);
    }
  }, [loadingMore, hasMore, page]);

  const handleMarkAsRead = async (notificationId: number) => {
    if (!token) return;
    
    try {
      await markNotificationAsRead(notificationId, token);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token || markingAll) return;
    
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-5 h-5 text-red-500 fill-red-500" />;
      case 'COMMENT':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'COMMENT_LIKE':
        return <Heart className="w-5 h-5 text-red-500 fill-red-500" />;
      case 'NEW_PIN_FROM_FOLLOWING':
        return <ImageIcon className="w-5 h-5 text-green-500" />;
      case 'FOLLOW':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: Notification): string => {
    if (notification.media) {
      return `/media/${notification.media.id}`;
    }
    return `/users/${notification.actor.id}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar onCreateClick={() => setUploadModalOpen(true)} />
        <Header onUploadClick={() => setUploadModalOpen(true)} />
        
        <main className="ml-20 pt-32 pb-8 px-4">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Войдите, чтобы увидеть уведомления
            </h1>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar onCreateClick={() => setUploadModalOpen(true)} />
      <Header onUploadClick={() => setUploadModalOpen(true)} />
      
      <motion.main
        className="ml-20 pt-20 pb-8 px-4"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Уведомления</h1>
            
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    Прочитать все
                  </>
                )}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Bell className="w-20 h-20 text-[var(--text-secondary)] mb-4" />
              <p className="text-xl text-[var(--text-secondary)]">Нет уведомлений</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={getNotificationLink(notification)}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                    className={`block p-4 rounded-2xl transition-colors group ${
                      notification.isRead 
                        ? 'bg-[var(--card-bg)] hover:bg-[var(--input-bg)]' 
                        : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className="shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--input-bg)] shrink-0">
                            {notification.actor.avatarUrl ? (
                              <Image
                                src={notification.actor.avatarUrl}
                                alt={notification.actor.displayName}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                              </div>
                            )}
                          </div>

                          {/* Message */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[var(--foreground)]">
                              <span className="font-semibold">{notification.actor.displayName}</span>
                              {' '}
                              {notification.message.replace(notification.actor.displayName + ' ', '')}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                              {new Date(notification.createdAt).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>

                          {/* Media Preview */}
                          {notification.media && (
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--input-bg)] shrink-0">
                              <Image
                                src={getImageUrl(notification.media.url)}
                                alt=""
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--foreground)] rounded-full font-semibold transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Загрузка...
                      </div>
                    ) : (
                      'Загрузить ещё'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.main>

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
