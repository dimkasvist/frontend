'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { X, Trash2, Download, Loader2, User, Heart, MessageCircle, MoreHorizontal, Send, Share2, Expand } from 'lucide-react';
import { Photo, Comment } from '@/types/photo';
import {
  getImageUrl,
  getVideoUrl,
  deletePhoto,
  toggleLike,
  getLikeStatus,
  getComments,
  addComment,
  deleteComment,
  toggleCommentLike,
} from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatar';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import ShareButton from './ShareButton';
import SaveToBoard from './SaveToBoard';

interface PhotoModalProps {
  photo: Photo | null;
  onClose: () => void;
  onDelete: (id: number) => void;
}

export default function PhotoModal({ photo, onClose, onDelete }: PhotoModalProps) {
  const { token, user: currentUser } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  
  // Likes state
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likingInProgress, setLikingInProgress] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [commentLikeLoading, setCommentLikeLoading] = useState<Record<number, boolean>>({});
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Reset state when photo changes
  useEffect(() => {
    if (photo) {
      // Reset all state for new photo
      setLiked(false);
      setLikesCount(photo.likesCount || 0);
      setCommentsCount(photo.commentsCount || 0);
      setComments([]);
      setCommentText('');
      setError(null);
      setShowDeleteConfirm(false);
      
      // Load like status if logged in
      if (token) {
        getLikeStatus(photo.id, token)
          .then(res => {
            setLiked(res.liked);
            setLikesCount(res.likesCount ?? photo.likesCount ?? 0);
          })
          .catch(() => {});
      }
    }
  }, [photo?.id, token]);

  // Load comments when section is opened or photo changes
  useEffect(() => {
    if (showComments && photo) {
      loadComments();
    }
  }, [showComments, photo?.id, token]);

  const loadComments = async () => {
    if (!photo) return;
    setLoadingComments(true);
    try {
      const res = await getComments(photo.id, undefined, undefined, token);
      setComments(
        res.comments.map((comment) => ({
          ...comment,
          likesCount: comment.likesCount ?? 0,
          liked: comment.liked ?? false,
        }))
      );
      setCommentsCount(res.totalCount ?? res.comments.length);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  if (!photo) return null;

  const handleDelete = async () => {
    if (!token) return;
    
    setDeleting(true);
    setError(null);
    try {
      await deletePhoto(photo.id, token);
      onDelete(photo.id);
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 403) {
          setError('Вы не можете удалить чужой дим');
        } else {
          setError(axiosError.response?.data?.message || 'Ошибка при удалении');
        }
      } else {
        setError('Ошибка при удалении');
      }
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = getImageUrl(photo.url);
    link.download = `${photo.title}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleLike = async () => {
    if (!token || likingInProgress) return;
    setLikingInProgress(true);
    try {
      const res = await toggleLike(photo.id, token);
      setLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setLikingInProgress(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !commentText.trim() || submittingComment) return;
    
    setSubmittingComment(true);
    try {
      const newComment = await addComment(photo.id, commentText.trim(), token);
      const normalizedComment: Comment = {
        ...newComment,
        likesCount: newComment.likesCount ?? 0,
        liked: newComment.liked ?? false,
      };
      setComments(prev => [normalizedComment, ...prev]);
      setCommentsCount(prev => prev + 1);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!token) return;
    try {
      await deleteComment(commentId, token);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentsCount(prev => prev - 1);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleToggleCommentLike = async (commentId: number) => {
    if (!token || commentLikeLoading[commentId]) return;
    setCommentLikeLoading(prev => ({ ...prev, [commentId]: true }));
    try {
      const res = await toggleCommentLike(commentId, token);
      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? { ...comment, liked: res.liked, likesCount: res.likesCount }
            : comment
        )
      );
    } catch (err) {
      console.error('Failed to toggle comment like:', err);
    } finally {
      setCommentLikeLoading(prev => {
        const { [commentId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          key={photo.id}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Close button - outside modal */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 left-4 z-50 p-3 bg-[var(--card-bg)]/90 backdrop-blur rounded-full shadow-lg hover:bg-[var(--card-bg)] transition-colors outline-none focus:outline-none"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <X className="w-5 h-5 text-[var(--foreground)]" />
          </motion.button>

          {/* Modal */}
          <motion.div
            className="relative bg-[var(--card-bg)] rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
          >
            {/* Image */}
            <div className="flex-1 bg-[var(--card-bg)] flex items-center justify-center min-h-[300px] md:min-h-[600px] overflow-hidden relative group/image">
              <div className="relative w-full h-full min-h-[300px] md:min-h-[600px]">
                {photo.mediaType === 'VIDEO' ? (
                  <video
                    src={getVideoUrl(photo.url)}
                    poster={getImageUrl(photo.posterUrl || photo.url)}
                    className="absolute inset-0 w-full h-full object-contain"
                    controls
                    autoPlay
                    loop
                    playsInline
                  />
                ) : (
                  <Image
                    src={getImageUrl(photo.url)}
                    alt={photo.title}
                    fill
                    className="object-contain border-0 outline-none ring-0"
                    style={{ border: 'none', outline: 'none' }}
                    unoptimized
                  />
                )}
              </div>
              
              {/* Expand button */}
              <button
                onClick={() => setShowFullscreen(true)}
                className="absolute bottom-4 right-4 p-3 bg-[var(--card-bg)]/90 hover:bg-[var(--card-bg)] backdrop-blur rounded-full shadow-lg transition-all opacity-0 group-hover/image:opacity-100"
                title="Открыть в полном размере"
              >
                <Expand className="w-5 h-5 text-[var(--foreground)]" />
              </button>
            </div>

            {/* Fullscreen overlay */}
            {showFullscreen && (
              <div 
                className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
                onClick={() => setShowFullscreen(false)}
              >
                <button
                  onClick={() => setShowFullscreen(false)}
                  className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full transition-colors z-10"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
                <div className="relative w-full h-full p-8 flex items-center justify-center">
                  {photo.mediaType === 'VIDEO' ? (
                    <video
                      src={getVideoUrl(photo.url)}
                      poster={getImageUrl(photo.posterUrl || photo.url)}
                      className="max-w-full max-h-full object-contain"
                      controls
                      autoPlay
                      loop
                      playsInline
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <img
                      src={getImageUrl(photo.url)}
                      alt={photo.title}
                      className="max-w-full max-h-full object-contain"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Info panel */}
            <div className="w-full md:w-[400px] flex flex-col overflow-hidden">
              {/* Top actions bar */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-4">
                  {/* Like button */}
                  <button
                    onClick={handleLike}
                    disabled={!currentUser || likingInProgress}
                    className="flex items-center gap-2 hover:bg-[var(--input-bg)] rounded-full p-2 -ml-2 transition-colors disabled:opacity-50"
                  >
                    <Heart 
                      className={`w-6 h-6 transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-[var(--foreground)]'}`} 
                    />
                    <span className="font-semibold text-[var(--foreground)]">{likesCount}</span>
                  </button>
                  
                  {/* Comments button */}
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 hover:bg-[var(--input-bg)] rounded-full p-2 transition-colors"
                  >
                    <MessageCircle className="w-6 h-6 text-[var(--foreground)]" />
                    {commentsCount > 0 && (
                      <span className="font-semibold text-[var(--foreground)]">{commentsCount}</span>
                    )}
                  </button>
                  
                  {/* Save to Board */}
                  <SaveToBoard mediaId={photo.id} variant="icon" />
                  
                  {/* Download */}
                  <button
                    onClick={handleDownload}
                    className="p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors"
                    title="Скачать"
                  >
                    <Download className="w-6 h-6 text-[var(--foreground)]" />
                  </button>
                  
                  {/* Share */}
                  <ShareButton mediaId={photo.id} variant="icon" />
                  
                  {/* More options */}
                  <button className="p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors">
                    <MoreHorizontal className="w-6 h-6 text-[var(--foreground)]" />
                  </button>
                </div>

                {/* Delete button */}
                {currentUser?.id === photo.author?.id && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto p-5">
                {/* Author */}
                {photo.author && (
                  <Link
                    href={`/users/${photo.author.id}`}
                    className="flex items-center gap-3 mb-4 hover:bg-[var(--input-bg)] rounded-2xl px-2 py-1 transition-colors"
                    onClick={onClose}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {photo.author.avatarUrl ? (
                        <Image
                          src={getAvatarUrl(photo.author.avatarUrl) || photo.author.avatarUrl}
                          alt={photo.author.displayName}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <span className="text-lg font-bold text-gray-500">
                          {photo.author.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--foreground)] underline decoration-transparent hover:decoration-current">
                        {photo.author.displayName}
                      </p>
                    </div>
                  </Link>
                )}

                {/* Title */}
                <h1 className="text-xl font-bold text-[var(--foreground)] mb-2 leading-tight">
                  {photo.title}
                </h1>

                {/* Description */}
                {photo.description && (
                  <p className="text-[var(--text-secondary)] text-sm mb-4 leading-relaxed">{photo.description}</p>
                )}

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 text-red-500 text-sm rounded-2xl border border-red-500/30">
                    {error}
                  </div>
                )}

                {/* Delete confirmation */}
                {showDeleteConfirm && (
                  <div className="mb-4 p-4 bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)]">
                    <p className="text-sm text-[var(--foreground)] mb-3">
                      Удалить этот дим?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2 px-4 bg-[var(--border-color)] hover:opacity-80 rounded-full text-sm font-medium text-[var(--foreground)] transition-colors"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Удалить'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Comments section */}
                {showComments && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                    <h3 className="font-semibold text-[var(--foreground)] mb-3">
                      Комментарии {commentsCount > 0 && `(${commentsCount})`}
                    </h3>
                    
                    {loadingComments ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-[var(--text-secondary)] text-sm py-4">Пока нет комментариев</p>
                    ) : (
                      <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3 group">
                            <Link
                              href={`/users/${comment.author.id}`}
                              className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-[var(--border-color)] transition-all"
                              onClick={onClose}
                            >
                              {comment.author.avatarUrl ? (
                                <Image
                                  src={getAvatarUrl(comment.author.avatarUrl) || comment.author.avatarUrl}
                                  alt={comment.author.displayName}
                                  width={32}
                                  height={32}
                                  className="object-cover w-full h-full"
                                  unoptimized
                                />
                              ) : (
                                <span className="text-xs font-bold text-gray-500">
                                  {comment.author.displayName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </Link>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/users/${comment.author.id}`}
                                  onClick={onClose}
                                  className="font-medium text-sm text-[var(--foreground)] hover:underline"
                                >
                                  {comment.author.displayName}
                                </Link>
                                <span className="text-xs text-[var(--text-secondary)]">{formatDate(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm text-[var(--foreground)] mt-0.5">{comment.text}</p>
                              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                <button
                                  onClick={() => handleToggleCommentLike(comment.id)}
                                  disabled={!currentUser || !token || commentLikeLoading[comment.id]}
                                  className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors ${
                                    comment.liked
                                      ? 'bg-red-500/10 text-red-500'
                                      : 'hover:bg-[var(--input-bg)] text-[var(--text-secondary)]'
                                  } disabled:opacity-50 disabled:hover:bg-transparent`}
                                >
                                  <Heart
                                    className={`w-4 h-4 ${
                                      comment.liked ? 'fill-red-500 text-red-500' : 'text-[var(--foreground)]'
                                    }`}
                                  />
                                  {comment.likesCount > 0 && (
                                    <span className="font-medium text-sm text-current">{comment.likesCount}</span>
                                  )}
                                </button>
                                {commentLikeLoading[comment.id] && (
                                  <Loader2 className="w-3 h-3 animate-spin text-[var(--text-secondary)]" />
                                )}
                              </div>
                            </div>
                            {currentUser && currentUser.email === comment.author.displayName && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                                title="Удалить комментарий"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            )}
                          </div>
                        ))}
                        <div ref={commentsEndRef} />
                      </div>
                    )}
                  </div>
                )}

                {/* Meta */}
                <div className="mt-4 pt-4 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                  <p>{formatDate(photo.createdAt)}</p>
                  <p className="mt-0.5">{photo.width}</p>
                </div>
              </div>

              {/* Comment input */}
              {currentUser && (
                <form onSubmit={handleSubmitComment} className="p-4 border-t border-[var(--border-color)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {currentUser.picture ? (
                        <Image
                          src={getAvatarUrl(currentUser.picture) || currentUser.picture}
                          alt={currentUser.name}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Добавить комментарий..."
                      maxLength={1000}
                      className="flex-1 bg-[var(--input-bg)] text-[var(--foreground)] rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || submittingComment}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      {submittingComment ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
