'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { User } from '@/types/photo';
import { getFollowers, getFollowing } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatar';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

interface FollowersModalProps {
  userId: number;
  initialTab: 'followers' | 'following';
  onClose: () => void;
}

export default function FollowersModal({ userId, initialTab, onClose }: FollowersModalProps) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followersPage, setFollowersPage] = useState(0);
  const [followingPage, setFollowingPage] = useState(0);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followersHasMore, setFollowersHasMore] = useState(true);
  const [followingHasMore, setFollowingHasMore] = useState(true);

  useEffect(() => {
    if (activeTab === 'followers' && (!followers || followers.length === 0)) {
      loadFollowers(0);
    } else if (activeTab === 'following' && (!following || following.length === 0)) {
      loadFollowing(0);
    }
  }, [activeTab, followers, following]);

  const loadFollowers = async (page: number) => {
    if (followersLoading) return;
    setFollowersLoading(true);
    try {
      const res = await getFollowers(userId, page, 20, token || undefined);
      if (page === 0) {
        setFollowers(res.users);
      } else {
        setFollowers(prev => [...prev, ...res.users]);
      }
      setFollowersPage(res.page);
      setFollowersHasMore(res.page < res.totalPages - 1);
    } catch (error) {
      console.error('Failed to load followers', error);
    } finally {
      setFollowersLoading(false);
    }
  };

  const loadFollowing = async (page: number) => {
    if (followingLoading) return;
    setFollowingLoading(true);
    try {
      const res = await getFollowing(userId, page, 20, token || undefined);
      if (page === 0) {
        setFollowing(res.users);
      } else {
        setFollowing(prev => [...prev, ...res.users]);
      }
      setFollowingPage(res.page);
      setFollowingHasMore(res.page < res.totalPages - 1);
    } catch (error) {
      console.error('Failed to load following', error);
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (activeTab === 'followers' && followersHasMore && !followersLoading) {
      loadFollowers(followersPage + 1);
    } else if (activeTab === 'following' && followingHasMore && !followingLoading) {
      loadFollowing(followingPage + 1);
    }
  };

  const currentUsers = (activeTab === 'followers' ? followers : following) || [];
  const currentLoading = activeTab === 'followers' ? followersLoading : followingLoading;
  const currentHasMore = activeTab === 'followers' ? followersHasMore : followingHasMore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-[var(--card-bg)] rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            {activeTab === 'followers' ? 'Подписчики' : 'Подписки'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[var(--foreground)]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'followers'
                ? 'text-[var(--foreground)] border-b-2 border-red-500'
                : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
            }`}
          >
            Подписчики
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'following'
                ? 'text-[var(--foreground)] border-b-2 border-red-500'
                : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
            }`}
          >
            Подписки
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentLoading && currentUsers.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : currentUsers.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              {activeTab === 'followers' ? 'Нет подписчиков' : 'Нет подписок'}
            </div>
          ) : (
            <div className="space-y-3">
              {currentUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/users/${user.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 hover:bg-[var(--input-bg)] rounded-2xl transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-400 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {user.avatarUrl ? (
                      <Image
                        src={getAvatarUrl(user.avatarUrl) || user.avatarUrl}
                        alt={user.displayName}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {user.displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--foreground)] truncate">
                      {user.displayName}
                    </p>
                  </div>
                </Link>
              ))}

              {currentHasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={currentLoading}
                  className="w-full py-3 text-sm font-medium text-red-500 hover:bg-[var(--input-bg)] rounded-xl transition-colors disabled:opacity-50"
                >
                  {currentLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    'Показать ещё'
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
