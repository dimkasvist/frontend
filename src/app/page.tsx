'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Photo } from '@/types/photo';
import { getFeed } from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PhotoGrid from '@/components/PhotoGrid';
import UploadModal from '@/components/UploadModal';
import PhotoModal from '@/components/PhotoModal';
import ShareToChat from '@/components/ShareToChat';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useChat } from '@/lib/chat-context';
import { sendMessageREST } from '@/lib/chat-api';

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [photoToShare, setPhotoToShare] = useState<number | null>(null);
  const firstRenderRef = useRef(true);
  const initialLoadRef = useRef(false);
  const { token } = useAuth();
  const { openChat } = useChat();
  const router = useRouter();

  const loadPhotos = useCallback(async (nextCursor?: string | null, reset: boolean = false) => {
    setLoading(true);
    try {
      const response = await getFeed({
        cursor: reset ? null : nextCursor,
        size: 20,
        token,
      });
      setPhotos(prev => reset ? response.items : [...prev, ...response.items]);
      setHasMore(response.hasMore);
      setCursor(response.nextCursor);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
      if (firstRenderRef.current) {
        firstRenderRef.current = false;
      }
    }
  }, [token]);

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadPhotos(null, true);
    }
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPhotos(cursor);
    }
  }, [loading, hasMore, cursor, loadPhotos]);

  const handleUploadSuccess = (photo: Photo) => {
    setPhotos(prev => [photo, ...prev]);
  };

  const handlePhotoDelete = (id: number) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const handleShareClick = (photoId: number) => {
    setPhotoToShare(photoId);
    setShareModalOpen(true);
  };

  const handleChatSelect = async (chatId: number) => {
    if (!token || !photoToShare) return;

    try {
      const chats = await import('@/lib/chat-api').then(m => m.getChats(token));
      const selectedChat = chats.chats.find(c => c.id === chatId);
      
      if (selectedChat) {
        await sendMessageREST(token, {
          recipientId: selectedChat.user.id,
          content: '',
          messageType: 'SHARED_POST',
          attachmentUrl: null,
          sharedMediaId: photoToShare,
        });
        
        openChat(selectedChat.user.id);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    } finally {
      setShareModalOpen(false);
      setPhotoToShare(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors">
      <Sidebar onCreateClick={() => setUploadModalOpen(true)} />
      <Header onUploadClick={() => setUploadModalOpen(true)} />
      
      <motion.main
        className="ml-20 pt-20 pb-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <PhotoGrid
          photos={photos}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onPhotoClick={handlePhotoClick}
          onShare={handleShareClick}
          showInitialSkeleton={firstRenderRef.current && loading}
        />
      </motion.main>

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <PhotoModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDelete={handlePhotoDelete}
      />

      <ShareToChat
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setPhotoToShare(null);
        }}
        onSelectChat={handleChatSelect}
      />
    </div>
  );
}
