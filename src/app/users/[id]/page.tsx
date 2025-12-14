'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PhotoGrid from '@/components/PhotoGrid';
import PhotoModal from '@/components/PhotoModal';
import { getUser, getFeed, getUserLikedMedia } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatar';
import { Photo, User } from '@/types/photo';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';

export default function UserProfilePage() {
  const params = useParams();
  const userId = Number(params?.id);
  const { token } = useAuth();

  const [author, setAuthor] = useState<User | null>(null);
  const [authorLoading, setAuthorLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'created' | 'liked'>('created');

  const [createdPhotos, setCreatedPhotos] = useState<Photo[]>([]);
  const [createdCursor, setCreatedCursor] = useState<string | null>(null);
  const [createdHasMore, setCreatedHasMore] = useState(true);
  const [createdLoading, setCreatedLoading] = useState(false);

  const [likedPhotos, setLikedPhotos] = useState<Photo[]>([]);
  const [likedCursor, setLikedCursor] = useState<string | null>(null);
  const [likedHasMore, setLikedHasMore] = useState(true);
  const [likedLoading, setLikedLoading] = useState(false);

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const emptyAttemptsRef = useRef(0);
  const MAX_EMPTY_ATTEMPTS = 5;
  const createdLoadingRef = useRef(false);
  const likedLoadingRef = useRef(false);
  const createdHasMoreRef = useRef(true);
  const likedHasMoreRef = useRef(true);

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

  const loadCreated = useCallback(
    async (nextCursor?: string | null, reset: boolean = false) => {
      if (!userId || Number.isNaN(userId) || createdLoadingRef.current || (!reset && !createdHasMoreRef.current)) return;
      createdLoadingRef.current = true;
      setCreatedLoading(true);
      try {
        const res = await getFeed({
          cursor: reset ? null : nextCursor,
          size: 30,
          authorId: userId,
        });
        const filtered = res.items.filter((p) => p.author.id === userId);
        if (filtered.length === 0) {
          emptyAttemptsRef.current += 1;
        } else {
          emptyAttemptsRef.current = 0;
        }

        if (filtered.length > 0 || reset) {
          setCreatedPhotos((prev) => (reset ? filtered : [...prev, ...filtered]));
        }

        setCreatedCursor(res.nextCursor);
        if (!res.nextCursor || emptyAttemptsRef.current >= MAX_EMPTY_ATTEMPTS) {
          setCreatedHasMore(false);
          createdHasMoreRef.current = false;
        } else {
          setCreatedHasMore(res.hasMore);
          createdHasMoreRef.current = res.hasMore;
        }
      } catch (error) {
        console.error('Failed to load feed', error);
      } finally {
        setCreatedLoading(false);
        createdLoadingRef.current = false;
      }
    },
    [userId]
  );

  const loadLiked = useCallback(
    async (nextCursor?: string | null, reset: boolean = false) => {
      if (!userId || Number.isNaN(userId) || likedLoadingRef.current || (!reset && !likedHasMoreRef.current)) return;
      likedLoadingRef.current = true;
      setLikedLoading(true);
      try {
        const res = await getUserLikedMedia(userId, {
          cursor: reset ? null : nextCursor,
          token: token || undefined,
        });
        setLikedPhotos((prev) => (reset ? res.items : [...prev, ...res.items]));
        setLikedCursor(res.nextCursor);
        setLikedHasMore(res.hasMore);
        likedHasMoreRef.current = res.hasMore;
      } catch (error) {
        console.error('Failed to load liked media', error);
      } finally {
        setLikedLoading(false);
        likedLoadingRef.current = false;
      }
    },
    [userId, token]
  );

  useEffect(() => {
    if (!userId || Number.isNaN(userId)) return;
    // reset when user changes
    setCreatedPhotos([]);
    setCreatedCursor(null);
    setCreatedHasMore(true);
    createdHasMoreRef.current = true;
    emptyAttemptsRef.current = 0;
    createdLoadingRef.current = false;

    setLikedPhotos([]);
    setLikedCursor(null);
    setLikedHasMore(true);
    likedHasMoreRef.current = true;
    likedLoadingRef.current = false;

    setActiveTab('created');
    loadCreated(null, true);
  }, [userId, loadCreated]);

  const handleLoadMore = useCallback(() => {
    if (activeTab === 'created') {
      if (!createdLoadingRef.current && createdHasMore) {
        loadCreated(createdCursor);
      }
    } else if (activeTab === 'liked') {
      if (!likedLoadingRef.current && likedHasMore) {
        loadLiked(likedCursor);
      }
    }
  }, [activeTab, createdHasMore, createdCursor, loadCreated, likedHasMore, likedCursor, loadLiked]);

  const handleTabChange = useCallback(
    (tab: 'created' | 'liked') => {
      setActiveTab(tab);
      if (tab === 'liked' && likedPhotos.length === 0 && !likedLoadingRef.current) {
        loadLiked(null, true);
      }
    },
    [likedPhotos.length, loadLiked]
  );

  const avatar = getAvatarUrl(author?.avatarUrl) || author?.avatarUrl || null;
  const name = author?.displayName || 'Профиль пользователя';
  const currentPhotos = activeTab === 'created' ? createdPhotos : likedPhotos;
  const gridLoading = activeTab === 'created' ? createdLoading : likedLoading;
  const gridHasMore = activeTab === 'created' ? createdHasMore : likedHasMore;

  const handlePhotoDelete = useCallback((id: number) => {
    setCreatedPhotos((prev) => prev.filter((p) => p.id !== id));
    setLikedPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors">
      <Sidebar onCreateClick={() => {}} />
      <Header onUploadClick={() => {}} />

      <main className="ml-20 pt-20 pb-12 px-3 sm:px-6 max-w-6xl mx-auto">
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
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {activeTab === 'created' ? 'Созданные пины' : 'Понравившиеся пины'}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {activeTab === 'created'
                  ? 'Все публикации этого автора'
                  : 'Пины, которые пользователь сохранил к себе'}
              </p>
            </div>
            <div className="flex gap-2 bg-[var(--input-bg)] rounded-full p-1">
              {(['created', 'liked'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-[var(--card-bg)] shadow-sm text-[var(--foreground)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab === 'created' ? 'Созданные' : 'Понравившиеся'}
                </button>
              ))}
            </div>
          </div>
          <PhotoGrid
            photos={currentPhotos}
            loading={gridLoading}
            hasMore={gridHasMore}
            onLoadMore={handleLoadMore}
            onPhotoClick={setSelectedPhoto}
            showInitialSkeleton={gridLoading && currentPhotos.length === 0}
          />
        </section>
      </main>

      <PhotoModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDelete={handlePhotoDelete}
      />
    </div>
  );
}
