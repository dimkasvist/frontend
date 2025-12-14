'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Board, CreateBoardRequest } from '@/types/photo';
import { getMyBoards, createBoard } from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import UploadModal from '@/components/UploadModal';
import { motion } from 'framer-motion';
import { Plus, Lock, Globe, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/api';

export default function BoardsPage() {
  const { token, user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newBoard, setNewBoard] = useState<CreateBoardRequest>({
    name: '',
    description: '',
    isPrivate: false,
  });

  useEffect(() => {
    if (token) {
      loadBoards();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadBoards = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await getMyBoards(0, 50, token);
      setBoards(response.boards);
    } catch (error) {
      console.error('Error loading boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!token || !newBoard.name.trim()) return;
    
    setCreating(true);
    try {
      const board = await createBoard(
        {
          name: newBoard.name.trim(),
          description: newBoard.description?.trim() || undefined,
          isPrivate: newBoard.isPrivate,
        },
        token
      );
      setBoards(prev => [board, ...prev]);
      setCreateModalOpen(false);
      setNewBoard({ name: '', description: '', isPrivate: false });
    } catch (error) {
      console.error('Error creating board:', error);
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar onCreateClick={() => setUploadModalOpen(true)} />
        <Header onUploadClick={() => setUploadModalOpen(true)} />
        
        <main className="ml-20 pt-32 pb-8 px-4">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Войдите, чтобы увидеть свои доски
            </h1>
          </div>
        </main>
      </div>
    );
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Мои доски</h1>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              Создать доску
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-[var(--input-bg)] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : boards.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--text-secondary)] mb-4">У вас пока нет досок</p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors"
              >
                Создать первую доску
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className="group block aspect-[3/4] bg-[var(--card-bg)] rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-3/4 bg-[var(--input-bg)]">
                    {board.coverImageUrl ? (
                      <Image
                        src={getImageUrl(board.coverImageUrl)}
                        alt={board.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[var(--border-color)] flex items-center justify-center">
                          <Plus className="w-8 h-8 text-[var(--text-secondary)]" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-[var(--foreground)] line-clamp-1 group-hover:text-red-500 transition-colors">
                        {board.name}
                      </h3>
                      {board.isPrivate ? (
                        <Lock className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                      ) : (
                        <Globe className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {board.mediaCount} {board.mediaCount === 1 ? 'пин' : 'пинов'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </motion.main>

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {}}
      />

      {/* Create Board Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCreateModalOpen(false)} />
          
          <div className="relative bg-[var(--card-bg)] rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>

            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              Создать доску
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Название
                </label>
                <input
                  type="text"
                  value={newBoard.name}
                  onChange={(e) => setNewBoard(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-[var(--input-bg)] text-[var(--foreground)] rounded-2xl outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Моя доска"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Описание (опционально)
                </label>
                <textarea
                  value={newBoard.description}
                  onChange={(e) => setNewBoard(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-[var(--input-bg)] text-[var(--foreground)] rounded-2xl outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  placeholder="Добавьте описание..."
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newBoard.isPrivate}
                    onChange={(e) => setNewBoard(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="w-5 h-5 rounded border-2 border-[var(--border-color)] bg-[var(--input-bg)] checked:bg-red-500 checked:border-red-500"
                  />
                  <div>
                    <p className="font-medium text-[var(--foreground)]">Приватная доска</p>
                    <p className="text-sm text-[var(--text-secondary)]">Только вы сможете её видеть</p>
                  </div>
                </label>
              </div>

              <button
                onClick={handleCreateBoard}
                disabled={creating || !newBoard.name.trim()}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Создание...
                  </>
                ) : (
                  'Создать'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
