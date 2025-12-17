'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2, Check, Link as LinkIcon, MessageCircle } from 'lucide-react';
import ShareToChat from './ShareToChat';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';
import { sendMessageREST, getChats } from '@/lib/chat-api';

interface ShareButtonProps {
  mediaId: number;
  variant?: 'icon' | 'button';
  className?: string;
}

export default function ShareButton({ mediaId, variant = 'icon', className = '' }: ShareButtonProps) {
  const { token, user } = useAuth();
  const { openChat } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/media/${mediaId}`;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareToChat = async (chatId: number) => {
    if (!token) return;

    try {
      const chats = await getChats(token);
      const selectedChat = chats.chats.find(c => c.id === chatId);
      
      if (selectedChat) {
        await sendMessageREST(token, {
          recipientId: selectedChat.user.id,
          content: '',
          messageType: 'SHARED_POST',
          attachmentUrl: null,
          sharedMediaId: mediaId,
        });
        
        openChat(selectedChat.user.id);
        setShareModalOpen(false);
        setShowMenu(false);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {variant === 'icon' ? (
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`p-2 hover:bg-[var(--input-bg)] rounded-full transition-colors ${className}`}
          title="Поделиться"
        >
          <Share2 className="w-6 h-6 text-[var(--foreground)]" />
        </button>
      ) : (
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`flex items-center gap-2 px-4 py-2 bg-[var(--input-bg)] hover:bg-[var(--border-color)] rounded-full transition-colors ${className}`}
        >
          <Share2 className="w-5 h-5" />
          <span>Поделиться</span>
        </button>
      )}

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden z-50 min-w-[200px]">
          <div className="p-2">
            {user && (
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShareModalOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--input-bg)] rounded-xl transition-colors text-left"
              >
                <MessageCircle className="w-5 h-5 text-[var(--foreground)] shrink-0" />
                <span className="text-sm font-medium text-[var(--foreground)]">Отправить другу</span>
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--input-bg)] rounded-xl transition-colors text-left"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm font-medium text-green-500">Скопировано!</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-5 h-5 text-[var(--foreground)] shrink-0" />
                  <span className="text-sm font-medium text-[var(--foreground)]">Копировать ссылку</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      <ShareToChat
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onSelectChat={handleShareToChat}
      />
    </div>
  );
}
