'use client';

import { useEffect, useCallback, useState } from 'react';
import Header from '@/components/Header';
import PhotoGrid from '@/components/PhotoGrid';
import PhotoModal from '@/components/PhotoModal';
import LoginButton from '@/components/LoginButton';
import { useAuth } from '@/lib/auth-context';
import { getCurrentUser, getMyLikedMedia } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatar';
import { Photo, User } from '@/types/photo';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { token, user: authUser, login } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [liked, setLiked] = useState<Photo[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setProfileLoading(true);
    try {
      const data = await getCurrentUser(token);
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setProfileLoading(false);
    }
  }, [token]);

  const loadLiked = useCallback(
    async (nextCursor?: string | null, reset: boolean = false) => {
      if (!token || loading) return;
      setLoading(true);
      try {
        const res = await getMyLikedMedia(token, reset ? null : nextCursor, 20);
        setLiked((prev) => (reset ? res.items : [...prev, ...res.items]));
        setCursor(res.nextCursor);
        setHasMore(res.hasMore);
        setTotalCount(res.totalCount);
      } catch (error) {
        console.error('Failed to load liked media', error);
      } finally {
        setLoading(false);
      }
    },
    [token, loading]
  );

  useEffect(() => {
    if (token) {
      fetchProfile();
      loadLiked(null, true);
    } else {
      setProfile(null);
      setLiked([]);
      setCursor(null);
      setHasMore(true);
      setTotalCount(null);
    }
  }, [token, fetchProfile, loadLiked]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadLiked(cursor);
    }
  }, [loading, hasMore, cursor, loadLiked]);

  const handlePhotoDelete = (id: number) => {
    setLiked((prev) => prev.filter((p) => p.id !== id));
  };

  const avatar = getAvatarUrl(profile?.avatarUrl || authUser?.picture) || profile?.avatarUrl || authUser?.picture || null;
  const name = profile?.displayName || authUser?.name || 'Мой профиль';

  const unauthenticated = !token;

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors">
      <Header onUploadClick={() => {}} />

      <main className="pt-20 pb-12 px-3 sm:px-6 max-w-6xl mx-auto">
        {unauthenticated ? (
          <div className="mt-10 flex flex-col items-center gap-6 text-center">
            <p className="text-2xl font-semibold">Войдите, чтобы увидеть понравившиеся медиа</p>
            <LoginButton onLogin={login} />
          </div>
        ) : (
          <>
            <section className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
              <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center shrink-0">
                {avatar ? (
                  <Image src={avatar} alt={name} fill className="object-cover" unoptimized />
                ) : (
                  <span className="text-3xl font-bold text-white">{name.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl sm:text-4xl font-bold">{name}</h1>
                  {profileLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
                </div>
                <p className="text-[var(--text-secondary)]">
                  {totalCount !== null ? `Понравилось: ${totalCount}` : 'Загружаем лайки...'}
                </p>
              </div>
            </section>

            <section className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Понравившиеся</h2>
                {loading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
              </div>
              <PhotoGrid
                photos={liked}
                loading={loading}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
                onPhotoClick={setSelectedPhoto}
              />
            </section>
          </>
        )}
      </main>

      <PhotoModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDelete={handlePhotoDelete}
      />
    </div>
  );
}
