'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { followUser, unfollowUser, checkFollowing } from '@/lib/api';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';

interface FollowButtonProps {
  userId: number;
  variant?: 'default' | 'small';
  className?: string;
}

export default function FollowButton({ userId, variant = 'default', className = '' }: FollowButtonProps) {
  const { token, user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (token && user && user.id !== userId) {
      checkIsFollowing();
    } else {
      setLoading(false);
    }
  }, [token, user, userId]);

  const checkIsFollowing = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const following = await checkFollowing(userId, token);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error checking following status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!token || actionLoading) return;
    
    setActionLoading(true);
    try {
      await followUser(userId, token);
      setIsFollowing(true);
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!token || actionLoading) return;
    
    setActionLoading(true);
    try {
      await unfollowUser(userId, token);
      setIsFollowing(false);
    } catch (error) {
      console.error('Error unfollowing user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (!token || !user || user.id === userId) {
    return null;
  }

  if (loading) {
    return (
      <div className={`inline-flex items-center justify-center ${
        variant === 'small' ? 'w-8 h-8' : 'px-6 py-3'
      } ${className}`}>
        <Loader2 className={`animate-spin ${variant === 'small' ? 'w-4 h-4' : 'w-5 h-5'}`} />
      </div>
    );
  }

  if (variant === 'small') {
    return (
      <button
        onClick={isFollowing ? handleUnfollow : handleFollow}
        disabled={actionLoading}
        className={`p-2 rounded-full transition-colors disabled:opacity-50 ${
          isFollowing
            ? 'bg-[var(--input-bg)] hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--foreground)] hover:text-red-500'
            : 'bg-red-500 hover:bg-red-600 text-white'
        } ${className}`}
        title={isFollowing ? 'Отписаться' : 'Подписаться'}
      >
        {actionLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <UserMinus className="w-4 h-4" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={isFollowing ? handleUnfollow : handleFollow}
      disabled={actionLoading}
      className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors disabled:opacity-50 ${
        isFollowing
          ? 'bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--foreground)]'
          : 'bg-red-500 hover:bg-red-600 text-white'
      } ${className}`}
    >
      {actionLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {isFollowing ? 'Отписка...' : 'Подписка...'}
        </>
      ) : isFollowing ? (
        <>
          <UserMinus className="w-5 h-5" />
          Отписаться
        </>
      ) : (
        <>
          <UserPlus className="w-5 h-5" />
          Подписаться
        </>
      )}
    </button>
  );
}
