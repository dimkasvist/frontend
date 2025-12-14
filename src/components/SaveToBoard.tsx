'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Board } from '@/types/photo';
import { getMyBoards, addMediaToBoard, createBoard } from '@/lib/api';
import { Bookmark, Plus, Lock, Globe, Check, Loader2, X } from 'lucide-react';

interface SaveToBoardProps {
  mediaId: number;
  variant?: 'icon' | 'button';
  className?: string;
}

export default function SaveToBoard({ mediaId, variant = 'icon', className = '' }: SaveToBoardProps) {
  const { token } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [savedBoards, setSavedBoards] = useState<Set<number>>(new Set());
  const [creatingNew, setCreatingNew] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (showModal && token) {
      loadBoards();
    }
  }, [showModal, token]);

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

  const handleSaveToBoard = async (boardId: number) => {
    if (!token || saving) return;
    
    setSaving(boardId);
    try {
      await addMediaToBoard(boardId, mediaId, token);
      setSavedBoards(prev => new Set([...prev, boardId]));
      
      setTimeout(() => {
        setShowModal(false);
      }, 500);
    } catch (error) {
      console.error('Error saving to board:', error);
    } finally {
      setSaving(null);
    }
  };

  const handleCreateBoard = async () => {
    if (!token || !newBoardName.trim() || creating) return;
    
    setCreating(true);
    try {
      const board = await createBoard(
        { name: newBoardName.trim(), isPrivate: false },
        token
      );
      setBoards(prev => [board, ...prev]);
      setNewBoardName('');
      setCreatingNew(false);
      
      // Auto-save to new board
      await handleSaveToBoard(board.id);
    } catch (error) {
      console.error('Error creating board:', error);
      setCreating(false);
    }
  };

  if (!token) return null;

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={() => setShowModal(true)}
          className={`p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors ${className}`}
          title="Сохранить"
        >
          <Bookmark className="w-6 h-6 text-[var(--foreground)]" />
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className={`flex items-center gap-2 px-4 py-2 bg-[var(--input-bg)] hover:bg-[var(--border-color)] rounded-full transition-colors ${className}`}
        >
          <Bookmark className="w-5 h-5" />
          <span>Сохранить</span>
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-[var(--card-bg)] rounded-3xl w-full max-w-md shadow-2xl max-h-[600px] flex flex-col">
            <div className="p-6 border-b border-[var(--border-color)]">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                Сохранить в доску
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Create new board */}
                  {creatingNew ? (
                    <div className="p-4 bg-[var(--input-bg)] rounded-2xl">
                      <input
                        type="text"
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        placeholder="Название доски"
                        className="w-full px-4 py-2 bg-[var(--card-bg)] text-[var(--foreground)] rounded-xl outline-none focus:ring-2 focus:ring-red-500 mb-3"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateBoard();
                          if (e.key === 'Escape') setCreatingNew(false);
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateBoard}
                          disabled={!newBoardName.trim() || creating}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                        >
                          {creating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Создать'}
                        </button>
                        <button
                          onClick={() => {
                            setCreatingNew(false);
                            setNewBoardName('');
                          }}
                          className="px-4 py-2 bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--foreground)] rounded-xl font-semibold transition-colors"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCreatingNew(true)}
                      className="w-full p-4 bg-[var(--input-bg)] hover:bg-[var(--border-color)] rounded-2xl flex items-center gap-3 transition-colors"
                    >
                      <div className="w-12 h-12 bg-[var(--card-bg)] rounded-xl flex items-center justify-center">
                        <Plus className="w-6 h-6 text-[var(--foreground)]" />
                      </div>
                      <span className="font-semibold text-[var(--foreground)]">Создать доску</span>
                    </button>
                  )}

                  {/* Existing boards */}
                  {boards.map((board) => {
                    const isSaved = savedBoards.has(board.id);
                    const isSaving = saving === board.id;
                    
                    return (
                      <button
                        key={board.id}
                        onClick={() => !isSaved && !isSaving && handleSaveToBoard(board.id)}
                        disabled={isSaved || isSaving}
                        className="w-full p-4 bg-[var(--input-bg)] hover:bg-[var(--border-color)] rounded-2xl flex items-center gap-3 transition-colors disabled:opacity-50"
                      >
                        <div className="w-12 h-12 bg-[var(--card-bg)] rounded-xl flex items-center justify-center">
                          {board.isPrivate ? (
                            <Lock className="w-5 h-5 text-[var(--text-secondary)]" />
                          ) : (
                            <Globe className="w-5 h-5 text-[var(--text-secondary)]" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-[var(--foreground)]">{board.name}</p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {board.mediaCount} {board.mediaCount === 1 ? 'пин' : 'пинов'}
                          </p>
                        </div>
                        {isSaving ? (
                          <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                        ) : isSaved ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : null}
                      </button>
                    );
                  })}

                  {boards.length === 0 && !creatingNew && (
                    <p className="text-center text-[var(--text-secondary)] py-4">
                      У вас пока нет досок
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
