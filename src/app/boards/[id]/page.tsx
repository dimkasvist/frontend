'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Board, Photo } from '@/types/photo';
import { getBoard, getBoardMedia, deleteBoard, removeMediaFromBoard } from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PhotoCard from '@/components/PhotoCard';
import UploadModal from '@/components/UploadModal';
import { motion } from 'framer-motion';
import { Lock, Globe, Loader2, Trash2, Edit, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = parseInt(params.id as string, 10);
  const { token, user } = useAuth();
  
  const [board, setBoard] = useState<Board | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingMedia, setRemovingMedia] = useState<number | null>(null);

  useEffect(() => {
    if (!isNaN(boardId)) {
      loadBoard();
      loadPhotos(0, true);
    }
  }, [boardId, token]);

  const loadBoard = async () => {
    try {
      const data = await getBoard(boardId, token);
      setBoard(data);
    } catch (error) {
      console.error('Error loading board:', error);
      router.push('/boards');
    }
  };

  const loadPhotos = async (pageNum: number, reset: boolean = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await getBoardMedia(boardId, pageNum, 20, token);
      const newPhotos = response.items.map(item => item.media);
      
      setPhotos(prev => reset ? newPhotos : [...prev, ...newPhotos]);
      setHasMore((pageNum + 1) < response.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading board media:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadPhotos(page + 1);
    }
  }, [loadingMore, hasMore, page]);

  const handleDelete = async () => {
    if (!token || !board || !window.confirm(`Удалить доску "${board.name}"?`)) return;
    
    setDeleting(true);
    try {
      await deleteBoard(board.id, token);
      router.push('/boards');
    } catch (error) {
      console.error('Error deleting board:', error);
      setDeleting(false);
    }
  };

  const handlePhotoClick = (photo: Photo) => {
    router.push(`/media/${photo.id}`);
  };

  const handleRemoveFromBoard = async (mediaId: number) => {
    if (!token || !board || removingMedia) return;
    
    setRemovingMedia(mediaId);
    try {
      await removeMediaFromBoard(board.id, mediaId, token);
      setPhotos(prev => prev.filter(p => p.id !== mediaId));
      if (board) {
        setBoard({ ...board, mediaCount: board.mediaCount - 1 });
      }
    } catch (error) {
      console.error('Error removing media from board:', error);
    } finally {
      setRemovingMedia(null);
    }
  };

  const isOwner = user && board && user.id === board.user.id;

  if (loading && !board) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar onCreateClick={() => setUploadModalOpen(true)} />
        <Header onUploadClick={() => setUploadModalOpen(true)} />
        
        <main className="ml-20 pt-20 pb-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="h-32 bg-[var(--input-bg)] rounded-2xl animate-pulse mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[var(--input-bg)] rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!board) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar onCreateClick={() => setUploadModalOpen(true)} />
      <Header onUploadClick={() => setUploadModalOpen(true)} />
      
      <motion.main
        className="ml-20 pt-20 pb-8 px-4"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Board Header */}
          <div className="mb-6">
            <Link
              href="/boards"
              className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Назад к доскам
            </Link>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-[var(--foreground)]">{board.name}</h1>
                  {board.isPrivate ? (
                    <Lock className="w-6 h-6 text-[var(--text-secondary)]" />
                  ) : (
                    <Globe className="w-6 h-6 text-[var(--text-secondary)]" />
                  )}
                </div>
                {board.description && (
                  <p className="text-[var(--text-secondary)] mb-2">{board.description}</p>
                )}
                <p className="text-sm text-[var(--text-secondary)]">
                  {board.mediaCount} {board.mediaCount === 1 ? 'дим' : 'димов'} · 
                  Создана {new Date(board.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>

              {isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/boards/${board.id}/edit`)}
                    className="p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors"
                    title="Редактировать"
                  >
                    <Edit className="w-5 h-5 text-[var(--foreground)]" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors disabled:opacity-50"
                    title="Удалить доску"
                  >
                    {deleting ? (
                      <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5 text-red-500" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Photos Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[var(--input-bg)] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--text-secondary)] mb-4">В этой доске пока нет димов</p>
              {isOwner && (
                <p className="text-sm text-[var(--text-secondary)]">
                  Нажмите "Сохранить" на диме, чтобы добавить его в доску
                </p>
              )}
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative break-inside-avoid group">
                  <PhotoCard photo={photo} onClick={() => handlePhotoClick(photo)} />
                  {isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromBoard(photo.id);
                      }}
                      disabled={removingMedia === photo.id}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Удалить из доски"
                    >
                      {removingMedia === photo.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <X className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Load More */}
          {!loading && hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--foreground)] rounded-full font-semibold transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Загрузка...
                  </div>
                ) : (
                  'Загрузить ещё'
                )}
              </button>
            </div>
          )}
        </div>
      </motion.main>

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
