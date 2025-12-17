'use client';

import { useState, useRef, useEffect } from 'react';
import { useSettings } from '@/lib/settings-context';
import { useAuth } from '@/lib/auth-context';
import { getUnreadCount } from '@/lib/api';
import { getUnreadMessagesCount } from '@/lib/chat-api';
import { Home, Grid, Plus, Bell, Settings, Sun, Moon, Snowflake, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import NotificationsPanel from './NotificationsPanel';
import { useChat } from '@/lib/chat-context';

interface SidebarProps {
  onCreateClick: () => void;
}

export default function Sidebar({ onCreateClick }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme, christmasMode, setChristmasMode } = useSettings();
  const { token, user } = useAuth();
  const { toggleChat } = useChat();
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const settingsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (token) {
      loadUnreadCount();
      loadUnreadMessagesCount();
      const interval = setInterval(() => {
        loadUnreadCount();
        loadUnreadMessagesCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const loadUnreadCount = async () => {
    if (!token) return;
    
    try {
      const count = await getUnreadCount(token);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadUnreadMessagesCount = async () => {
    if (!token) return;
    
    try {
      const count = await getUnreadMessagesCount(token);
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Error loading unread messages count:', error);
    }
  };

  const menuItems: Array<{
    icon: typeof Home;
    label: string;
    href: string;
    match: (path: string) => boolean;
    badge?: number;
  }> = [
    { icon: Home, label: 'Главная', href: '/', match: (path: string) => path === '/' },
    { icon: Grid, label: 'Доски', href: '/boards', match: (path: string) => path.startsWith('/boards') },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-[var(--header-bg)] border-r border-[var(--border-color)] flex flex-col items-center py-4 z-40">
      {/* Logo */}
      <Link href="/" className="mb-4 flex items-center justify-center w-12 h-12 rounded-full overflow-hidden border border-red-500/30">
        <Image src="/icon.jpg" alt="Димкасвист" width={48} height={48} className="w-full h-full object-cover" />
      </Link>

      {/* Menu items */}
      <nav className="flex-1 flex flex-col items-center gap-2 w-full px-2">
        {menuItems.map((item) => {
          const isActive = item.match(pathname);
          const Icon = item.icon;
          const requiresAuth = item.href === '/boards';
          const isDisabled = requiresAuth && !user;
          
          if (isDisabled) {
            return (
              <button
                key={item.href}
                onClick={() => alert('Войдите, чтобы открыть доски')}
                className="relative w-12 h-12 rounded-full flex items-center justify-center transition-colors text-gray-400 cursor-not-allowed opacity-60"
                title="Войдите, чтобы открыть доски"
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isActive
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'hover:bg-[var(--input-bg)] text-[var(--foreground)]'
              }`}
              title={item.label}
            >
              <Icon className="w-6 h-6" />
              {'badge' in item && item.badge && item.badge > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Create button */}
        <button
          onClick={() => {
            if (!user) {
              alert('Войдите, чтобы создавать посты');
              return;
            }
            onCreateClick();
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors mt-2 ${
            user 
              ? 'bg-red-500 hover:bg-red-600 text-white cursor-pointer' 
              : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-60'
          }`}
          title={user ? 'Создать' : 'Войдите, чтобы создавать посты'}
        >
          <Plus className="w-6 h-6" />
        </button>
      </nav>

      {/* Bottom items */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        <button
          onClick={() => {
            if (!user) {
              alert('Войдите, чтобы открыть сообщения');
              return;
            }
            toggleChat();
          }}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            user 
              ? 'hover:bg-[var(--input-bg)] text-[var(--foreground)] cursor-pointer' 
              : 'text-gray-400 cursor-not-allowed opacity-60'
          }`}
          title={user ? 'Сообщения' : 'Войдите, чтобы открыть сообщения'}
        >
          <MessageCircle className="w-6 h-6" />
          {user && unreadMessagesCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
            </span>
          )}
        </button>

        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              if (!user) {
                alert('Войдите, чтобы открыть уведомления');
                return;
              }
              setShowNotifications(!showNotifications);
            }}
            className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              user 
                ? 'hover:bg-[var(--input-bg)] text-[var(--foreground)] cursor-pointer' 
                : 'text-gray-400 cursor-not-allowed opacity-60'
            }`}
            title={user ? 'Уведомления' : 'Войдите, чтобы открыть уведомления'}
          >
            <Bell className="w-6 h-6" />
            {user && unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          <NotificationsPanel
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            unreadCount={unreadCount}
            onUnreadCountChange={setUnreadCount}
          />
        </div>
        
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-[var(--input-bg)] text-[var(--foreground)] transition-colors"
            title="Настройки"
          >
            <Settings className="w-6 h-6" />
          </button>
          
          {showSettings && (
            <div className="absolute left-20 bottom-0 w-56 bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] py-2 z-50">
              <div className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] uppercase">Настройки</div>
              
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="w-full px-4 py-3 text-left hover:bg-[var(--input-bg)] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  <span>Тёмная тема</span>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-red-500' : 'bg-gray-300'}`}>
                  <div className={`absolute w-5 h-5 bg-white rounded-full shadow top-0.5 transition-all ${theme === 'dark' ? 'left-5' : 'left-0.5'}`} />
                </div>
              </button>

              <button
                onClick={() => setChristmasMode(!christmasMode)}
                className="w-full px-4 py-3 text-left hover:bg-[var(--input-bg)] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Snowflake className={`w-5 h-5 ${christmasMode ? 'text-blue-400' : ''}`} />
                  <span>Новогодний режим</span>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${christmasMode ? 'bg-blue-400' : 'bg-gray-300'}`}>
                  <div className={`absolute w-5 h-5 bg-white rounded-full shadow top-0.5 transition-all ${christmasMode ? 'left-5' : 'left-0.5'}`} />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
