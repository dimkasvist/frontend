'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import PhotoGrid from '@/components/PhotoGrid';
import PhotoModal from '@/components/PhotoModal';
import { getUser, getFeed } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatar';
import { Photo, User } from '@/types/photo';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function UserProfilePage() {
  const params = useParams();
  const userId = Number(params?.id);

  const [author, setAuthor] = useState<User | null>(null);
  const [authorLoading, setAuthorLoading] = useState(false);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) return;
    const loadAuthor = async () => {
      setAuthorLoading(true);
      try {
        const data = await getUser(userId);
        setAuthor(data);
      } catch (error) {
        console.error('Failed to load user', error);
      } finally {
        setAuthorLoading(false);
      }
    };
    loadAuthor();
  }, [userId]);

  const loadFeed = useCallback(
    async (nextCursor?: string | null, reset: boolean = false) => {
      if (!userId || Number.isNaN(userId) || loading || !feedHasMore) return;
      setLoading(true);
      try {
        const res = await getFeed(reset ? null : nextCursor, 30);
        const filtered = res.items.filter((p) => p.author.id === userId);
        setPhotos((prev) => (reset ? filtered : [...prev, ...filtered]));
        setCursor(res.nextCursor);
        setFeedHasMore(res.hasMore);
      } catch (error) {
        console.error('Failed to load feed', error);
      } finally {
        setLoading(false);
      }
    },
    [userId, loading, feedHasMore]
  );

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) return;
    // reset when user changes
    setPhotos([]);
    setCursor(null);
    setFeedHasMore(true);
    loadFeed(null, true);
  }, [userId, loadFeed]);

  const handleLoadMore = useCallback(() => {
    if (!loading && feedHasMore) {
      loadFeed(cursor);
    }
  }, [loading, feedHasMore, cursor, loadFeed]);

  const avatar = getAvatarUrl(author?.avatarUrl) || author?.avatarUrl || null;
  const name = author?.displayName || 'Профиль пользователя';

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors">
      <Header onUploadClick={() => {}} />

      <main className="pt-20 pb-12 px-3 sm:px-6 max-w-6xl mx-auto">
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
              {authorLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
            </div>
            <p className="text-[var(--text-secondary)]">Медиа пользователя</p>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Пины</h2>
            {loading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
          </div>
          <PhotoGrid
            photos={photos}
            loading={loading}
            hasMore={feedHasMore}
            onLoadMore={handleLoadMore}
            onPhotoClick={setSelectedPhoto}
          />
          {!loading && photos.length === 0 && !feedHasMore && (
            <div className="text-center text-[var(--text-secondary)] py-8">
              У пользователя пока нет пинов.
            </div>
          )}
        </section>
      </main>

      <PhotoModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDelete={(id) => setPhotos((prev) => prev.filter((p) => p.id !== id))}
      />
    </div>
  );
}
