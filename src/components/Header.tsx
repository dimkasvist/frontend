'use client';

import { useAuth } from '@/lib/auth-context';
import { getAvatarUrl } from '@/lib/avatar';
import { LogOut, User as UserIcon, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginButton from './LoginButton';

interface HeaderProps {
  onUploadClick: () => void;
}

export default function Header({ onUploadClick }: HeaderProps) {
  const { user, isLoading, logout, login } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-20 right-0 h-16 bg-[var(--header-bg)] border-b border-[var(--border-color)] z-50 transition-colors">
      <div className="h-full mx-auto px-6 flex items-center justify-between gap-4">
        {/* Empty space for balance */}
        <div className="w-10" />

        {/* Search - centered */}
        <form onSubmit={handleSearch} className="flex-1 max-w-3xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Поиск"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-[var(--input-bg)] text-[var(--foreground)] rounded-full outline-none focus:ring-2 focus:ring-blue-200 transition-all text-base"
            />
          </div>
        </form>

        {/* User profile - right */}
        {isLoading ? (
          <div className="w-10 h-10 rounded-full bg-[var(--input-bg)] animate-pulse" />
        ) : user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-[var(--input-bg)] transition-colors"
            >
              <span className="hidden md:block font-medium text-[var(--foreground)]">
                {user.name || user.email}
              </span>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--border-color)] flex items-center justify-center bg-[var(--input-bg)]">
                {user.picture ? (
                  <Image 
                    src={user.picture} 
                    alt={user.name || user.email} 
                    width={40} 
                    height={40} 
                    className="w-full h-full object-cover" 
                    unoptimized
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                )}
              </div>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-14 w-56 bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] py-2 z-50">
                <div className="px-4 py-3 border-b border-[var(--border-color)]">
                  <p className="font-semibold text-[var(--foreground)]">{user.name || user.email}</p>
                  {user.name && user.email && (
                    <p className="text-sm text-[var(--text-secondary)] truncate">{user.email}</p>
                  )}
                </div>
                <Link href={`/users/${user.id}`} className="block w-full px-4 py-3 text-left hover:bg-[var(--input-bg)] transition-colors">
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5" />
                    <span>Профиль</span>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--input-bg)] transition-colors text-red-500"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    <span>Выйти</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : (
          <LoginButton onLogin={login} />
        )}
      </div>
    </header>
  );
}
