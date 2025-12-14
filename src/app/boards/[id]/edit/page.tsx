'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Board, UpdateBoardRequest } from '@/types/photo';
import { getBoard, updateBoard } from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import UploadModal from '@/components/UploadModal';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Lock, Globe } from 'lucide-react';
import Link from 'next/link';

export default function EditBoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = parseInt(params.id as string, 10);
  const { token, user } = useAuth();
  
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  
  const [formData, setFormData] = useState<UpdateBoardRequest>({
    name: '',
    description: '',
    isPrivate: false,
  });

  useEffect(() => {
    if (!isNaN(boardId) && token) {
      loadBoard();
    }
  }, [boardId, token]);

  const loadBoard = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const data = await getBoard(boardId, token);
      setBoard(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        isPrivate: data.isPrivate,
      });
    } catch (error) {
      console.error('Error loading board:', error);
      router.push('/boards');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token || !formData.name || !formData.name.trim() || saving) return;
    
    setSaving(true);
    try {
      await updateBoard(
        boardId,
        {
          name: formData.name?.trim() || '',
          description: formData.description?.trim() || undefined,
          isPrivate: formData.isPrivate,
        },
        token
      );
      router.push(`/boards/${boardId}`);
    } catch (error) {
      console.error('Error updating board:', error);
      setSaving(false);
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
              Войдите, чтобы редактировать доску
            </h1>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar onCreateClick={() => setUploadModalOpen(true)} />
        <Header onUploadClick={() => setUploadModalOpen(true)} />
        
        <main className="ml-20 pt-20 pb-8 px-4 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </main>
      </div>
    );
  }

  if (!board || board.user.id !== user.id) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar onCreateClick={() => setUploadModalOpen(true)} />
        <Header onUploadClick={() => setUploadModalOpen(true)} />
        
        <main className="ml-20 pt-32 pb-8 px-4">
          <div className="max-w-xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Доска не найдена
            </h1>
            <Link
              href="/boards"
              className="inline-block mt-4 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors"
            >
              Вернуться к доскам
            </Link>
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
        <div className="max-w-2xl mx-auto">
          <Link
            href={`/boards/${boardId}`}
            className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Назад к доске
          </Link>

          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">
            Редактировать доску
          </h1>

          <div className="bg-[var(--card-bg)] rounded-3xl p-6 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Название
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-[var(--input-bg)] text-[var(--foreground)] rounded-2xl outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Название доски"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-[var(--input-bg)] text-[var(--foreground)] rounded-2xl outline-none focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="Добавьте описание..."
                rows={4}
                maxLength={500}
              />
            </div>

            {/* Privacy */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  className="mt-1 w-5 h-5 rounded border-2 border-[var(--border-color)] bg-[var(--input-bg)] checked:bg-red-500 checked:border-red-500"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {formData.isPrivate ? (
                      <Lock className="w-4 h-4 text-[var(--foreground)]" />
                    ) : (
                      <Globe className="w-4 h-4 text-[var(--foreground)]" />
                    )}
                    <p className="font-medium text-[var(--foreground)]">
                      {formData.isPrivate ? 'Приватная доска' : 'Публичная доска'}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {formData.isPrivate 
                      ? 'Только вы сможете видеть эту доску'
                      : 'Доска будет видна всем пользователям'
                    }
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.name.trim()}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить'
                )}
              </button>
              <Link
                href={`/boards/${boardId}`}
                className="px-6 py-3 bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--foreground)] rounded-full font-semibold transition-colors"
              >
                Отмена
              </Link>
            </div>
          </div>
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
