'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PhotoGrid from '@/components/PhotoGrid';
import PhotoModal from '@/components/PhotoModal';
import FollowersModal from '@/components/FollowersModal';
import { getUser, getFeed, getUserLikedMedia, followUser, unfollowUser, checkFollowing, getFollowStats, getUserBoards } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatar';
import { Photo, User, Board } from '@/types/photo';
import { Loader2, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useChat } from '@/lib/chat-context';

export default function UserProfilePage() {
  const params = useParams();
  const userId = Number(params?.id);
  const { token } = useAuth();
  const { openChat } = useChat();

  const [author, setAuthor] = useState<User | null>(null);
  const [authorLoading, setAuthorLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'created' | 'liked' | 'boards'>('created');

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);

  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsPage, setBoardsPage] = useState(0);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [boardsHasMore, setBoardsHasMore] = useState(true);
  const [boardsTotalPages, setBoardsTotalPages] = useState(0);

  const [createdPhotos, setCreatedPhotos] = useState<Photo[]>([]);
  const [createdCursor, setCreatedCursor] = useState<string | null>(null);
  const [createdHasMore, setCreatedHasMore] = useState(true);
  const [createdLoading, setCreatedLoading] = useState(false);

  const [likedPhotos, setLikedPhotos] = useState<Photo[]>([]);
  const [likedCursor, setLikedCursor] = useState<string | null>(null);
  const [likedHasMore, setLikedHasMore] = useState(true);
  const [likedLoading, setLikedLoading] = useState(false);

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following'>('followers');
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
    
    if (token) {
      loadFollowStatus();
    }
    loadFollowStats();
  }, [userId, token]);

  const loadFollowStatus = async () => {
    if (!userId || !token || Number.isNaN(userId)) return;
    try {
      const following = await checkFollowing(userId, token);
      setIsFollowing(following);
    } catch (error) {
      console.error('Failed to load follow status', error);
    }
  };

  const loadFollowStats = async () => {
    if (!userId || Number.isNaN(userId)) return;
    setStatsLoading(true);
    try {
      const stats = await getFollowStats(userId, token || undefined);
      setFollowersCount(stats.followersCount);
      setFollowingCount(stats.followingCount);
    } catch (error) {
      console.error('Failed to load follow stats', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!token || !userId || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId, token);
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        await followUser(userId, token);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to toggle follow', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const loadBoards = useCallback(
    async (page: number = 0) => {
      if (!userId || Number.isNaN(userId) || boardsLoading) return;
      setBoardsLoading(true);
      try {
        const res = await getUserBoards(userId, page, 20, token || undefined);
        if (page === 0) {
          setBoards(res.boards);
        } else {
          setBoards(prev => [...prev, ...res.boards]);
        }
        setBoardsPage(res.page);
        setBoardsHasMore(res.page < res.totalPages - 1);
        setBoardsTotalPages(res.totalPages);
      } catch (error) {
        console.error('Failed to load boards', error);
      } finally {
        setBoardsLoading(false);
      }
    },
    [userId, token]
  );

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

    setBoards([]);
    setBoardsPage(0);
    setBoardsHasMore(true);

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
    } else if (activeTab === 'boards') {
      if (!boardsLoading && boardsHasMore) {
        loadBoards(boardsPage + 1);
      }
    }
  }, [activeTab, createdHasMore, createdCursor, loadCreated, likedHasMore, likedCursor, loadLiked, boardsLoading, boardsHasMore, boardsPage, loadBoards]);

  const handleTabChange = useCallback(
    (tab: 'created' | 'liked' | 'boards') => {
      setActiveTab(tab);
      if (tab === 'liked' && likedPhotos.length === 0 && !likedLoadingRef.current) {
        loadLiked(null, true);
      } else if (tab === 'boards' && boards.length === 0 && !boardsLoading) {
        loadBoards(0);
      }
    },
    [likedPhotos.length, loadLiked, boards.length, boardsLoading, loadBoards]
  );

  const { user: currentUser } = useAuth();
  const avatar = getAvatarUrl(author?.avatarUrl) || author?.avatarUrl || null;
  const name = author?.displayName || 'Профиль пользователя';
  const currentPhotos = activeTab === 'created' ? createdPhotos : activeTab === 'liked' ? likedPhotos : [];
  const gridLoading = activeTab === 'created' ? createdLoading : activeTab === 'liked' ? likedLoading : boardsLoading;
  const gridHasMore = activeTab === 'created' ? createdHasMore : activeTab === 'liked' ? likedHasMore : boardsHasMore;

  const handlePhotoDelete = useCallback((id: number) => {
    setCreatedPhotos((prev) => prev.filter((p) => p.id !== id));
    setLikedPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors">
      <Sidebar onCreateClick={() => {}} />
      <Header onUploadClick={() => {}} />

      <main className="ml-20 pt-20 pb-12 px-3 sm:px-6">
        <section className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
          <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center shrink-0">
            {avatar ? (
              <Image src={avatar} alt={name} fill className="object-cover" unoptimized />
            ) : (
              <span className="text-3xl font-bold text-white">{name.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-bold">{name}</h1>
              {authorLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
            </div>
            
            {/* Follow stats */}
            <div className="flex items-center gap-4 text-sm">
              <button
                onClick={() => {
                  setFollowersModalTab('followers');
                  setShowFollowersModal(true);
                }}
                className="hover:underline transition-all"
              >
                <span className="font-semibold text-[var(--foreground)]">{followersCount}</span>
                <span className="text-[var(--text-secondary)] ml-1">подписчиков</span>
              </button>
              <button
                onClick={() => {
                  setFollowersModalTab('following');
                  setShowFollowersModal(true);
                }}
                className="hover:underline transition-all"
              >
                <span className="font-semibold text-[var(--foreground)]">{followingCount}</span>
                <span className="text-[var(--text-secondary)] ml-1">подписок</span>
              </button>
            </div>
            
            {/* Follow and Message buttons */}
            {token && author && currentUser?.id !== author.id && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-6 py-2 rounded-full font-medium text-sm transition-all flex items-center gap-2 ${
                    isFollowing
                      ? 'bg-[var(--input-bg)] text-[var(--foreground)] hover:bg-[var(--border-color)]'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  } disabled:opacity-50`}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      Отписаться
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Подписаться
                    </>
                  )}
                </button>
                <button
                  onClick={() => openChat(author.id)}
                  className="px-6 py-2 rounded-full font-medium text-sm transition-all flex items-center gap-2 bg-[var(--input-bg)] text-[var(--foreground)] hover:bg-[var(--border-color)]"
                >
                  <MessageCircle className="w-4 h-4" />
                  Сообщение
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {activeTab === 'created' ? 'Созданные димы' : activeTab === 'liked' ? 'Понравившиеся димы' : 'Доски'}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {activeTab === 'created'
                  ? 'Все публикации этого автора'
                  : activeTab === 'liked'
                  ? 'Димы, которые пользователь сохранил к себе'
                  : 'Коллекции досок пользователя'}
              </p>
            </div>
            <div className="flex gap-2 bg-[var(--input-bg)] rounded-full p-1">
              {(['created', 'liked', 'boards'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-[var(--card-bg)] shadow-sm text-[var(--foreground)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab === 'created' ? 'Созданные' : tab === 'liked' ? 'Понравившиеся' : 'Доски'}
                </button>
              ))}
            </div>
          </div>
          {activeTab === 'boards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-4 hover:shadow-lg transition-all group"
                >
                  <div className="aspect-video bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                    {board.coverImageUrl ? (
                      <Image
                        src={board.coverImageUrl}
                        alt={board.name}
                        width={300}
                        height={200}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-4xl">📋</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] group-hover:text-red-500 transition-colors">
                    {board.name}
                  </h3>
                  {board.description && (
                    <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                      {board.description}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-[var(--text-secondary)]">
                    {board.mediaCount || 0} димов
                  </div>
                </Link>
              ))}
              {boardsLoading && boards.length === 0 && (
                <div className="col-span-full flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
              {!boardsLoading && boards.length === 0 && (
                <div className="col-span-full text-center py-12 text-[var(--text-secondary)]">
                  Досок пока нет
                </div>
              )}
            </div>
          ) : (
            <PhotoGrid
              photos={currentPhotos}
              loading={gridLoading}
              hasMore={gridHasMore}
              onLoadMore={handleLoadMore}
              onPhotoClick={setSelectedPhoto}
              showInitialSkeleton={gridLoading && currentPhotos.length === 0}
            />
          )}
        </section>
      </main>

      <PhotoModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDelete={handlePhotoDelete}
      />

      {showFollowersModal && (
        <FollowersModal
          userId={userId}
          initialTab={followersModalTab}
          onClose={() => setShowFollowersModal(false)}
        />
      )}
    </div>
  );
}
