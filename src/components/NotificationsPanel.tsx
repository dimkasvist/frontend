'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Notification } from '@/types/photo';
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount, getImageUrl } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatar';
import { Bell, Loader2, Heart, MessageCircle, User as UserIcon, Image as ImageIcon, CheckCheck, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}

export default function NotificationsPanel({ isOpen, onClose, unreadCount, onUnreadCountChange }: NotificationsPanelProps) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && token) {
      loadNotifications();
    }
  }, [isOpen, token]);

  const loadNotifications = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await getUnreadNotifications(0, 20, token);
      setNotifications(response.notifications);
      onUnreadCountChange(response.unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    if (!token) return;
    
    try {
      await markNotificationAsRead(notificationId, token);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      onUnreadCountChange(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token || markingAll) return;
    
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead(token);
      setNotifications([]);
      onUnreadCountChange(0);
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
        className="fixed left-20 bottom-16 w-96 max-h-[600px] bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden z-50"
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between sticky top-0 bg-[var(--card-bg)] z-10">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Уведомления</h2>
          {notifications.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1 disabled:opacity-50"
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

        {/* Content */}
        <div className="overflow-y-auto max-h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="w-16 h-16 text-[var(--text-secondary)] mb-4" />
              <p className="text-[var(--text-secondary)] text-center">
                Нет новых уведомлений
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)]">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={getNotificationLink(notification)}
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="block p-4 hover:bg-[var(--input-bg)] transition-colors group"
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--input-bg)] shrink-0">
                          {notification.actor.avatarUrl ? (
                            <Image
                              src={notification.actor.avatarUrl}
                              alt={notification.actor.displayName}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                            </div>
                          )}
                        </div>

                        {/* Message */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--foreground)] line-clamp-2">
                            <span className="font-semibold">{notification.actor.displayName}</span>
                            {' '}
                            {notification.message.replace(notification.actor.displayName + ' ', '')}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {new Date(notification.createdAt).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>

                        {/* Media Preview */}
                        {notification.media && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--input-bg)] shrink-0">
                            <Image
                              src={getImageUrl(notification.media.url)}
                              alt=""
                              width={48}
                              height={48}
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
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-[var(--border-color)] bg-[var(--card-bg)]">
            <Link
              href="/notifications"
              className="block text-center text-sm text-red-500 hover:text-red-600 font-medium"
              onClick={onClose}
            >
              Посмотреть все уведомления
            </Link>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
