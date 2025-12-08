'use client';

import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { getAvatarUrl } from '@/lib/avatar';
import { Plus, LogOut, Sun, Moon, Settings, Snowflake, User as UserIcon, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LoginButton from './LoginButton';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

interface HeaderProps {
  onUploadClick: () => void;
}

export default function Header({ onUploadClick }: HeaderProps) {
  const { user, isLoading, login, logout } = useAuth();
  const { theme, setTheme, christmasMode, setChristmasMode } = useSettings();
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUploadClick = () => {
    if (!user) {
      // Will be handled by LoginButton
    } else {
      onUploadClick();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--header-bg)] shadow-sm z-50 transition-colors">
      <div className="h-full mx-auto px-4 flex items-center">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="text-red-500 font-bold text-xl hidden sm:block">Dimkasvist</span>
        </div>

        {/* Search - centered */}
        <div className="flex-1 flex justify-center px-4">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Поиск"
              className="w-full h-12 pl-12 pr-4 bg-[var(--input-bg)] text-[var(--foreground)] rounded-full outline-none focus:ring-2 focus:ring-blue-200 transition-all text-base"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Upload button - only show when logged in */}
          {user && (
            <button
              onClick={handleUploadClick}
              className="h-10 px-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center gap-2 transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:block">Создать</span>
            </button>
          )}

          {/* Settings */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--input-bg)] transition-colors"
            >
              <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            {showSettings && (
              <div className="absolute right-0 top-12 w-56 bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] py-2 z-50">
                <div className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] uppercase">Настройки</div>
                
                {/* Theme toggle */}
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

                {/* Christmas mode toggle */}
                <button
                  onClick={() => setChristmasMode(!christmasMode)}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--input-bg)] flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Snowflake className={`w-5 h-5 ${christmasMode ? 'text-blue-400' : ''}`} />
                    <span>Новогодний режим</span>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors relative ${christmasMode ? 'bg-red-500' : 'bg-gray-300'}`}>
                    <div className={`absolute w-5 h-5 bg-white rounded-full shadow top-0.5 transition-all ${christmasMode ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Auth */}
          {isLoading ? (
            <div className="w-10 h-10 rounded-full bg-[var(--input-bg)] animate-pulse" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="relative w-10 h-10 rounded-full overflow-visible flex items-center justify-center"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                  {user.picture ? (
                    <Image
                      src={getAvatarUrl(user.picture) || user.picture}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                </div>
              </button>
              {showMenu && (
                <div className="absolute right-0 top-12 w-48 bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] py-2 z-50">
                  <div className="px-4 py-2 border-b border-[var(--border-color)]">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-[var(--text-secondary)] truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setShowMenu(false)}
                    className="w-full px-4 py-2 text-left hover:bg-[var(--input-bg)] flex items-center gap-2 transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    Мой профиль
                  </Link>
                  <button
                    onClick={() => { logout(); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-[var(--input-bg)] flex items-center gap-2 text-red-500 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <LoginButton onLogin={login} />
          )}
        </div>
      </div>
    </header>
  );
}
