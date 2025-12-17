'use client';

import { Message } from '@/types/chat';
import { Check, CheckCheck, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { formatMessageTime } from '@/lib/date-utils';
import { useState, useRef, useEffect } from 'react';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onEdit?: (messageId: number, newContent: string) => void;
  onDelete?: (messageId: number) => void;
}

export default function MessageBubble({ message, isOwnMessage, onEdit, onDelete }: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content && onEdit) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete && confirm('Удалить это сообщение?')) {
      onDelete(message.id);
    }
    setShowMenu(false);
  };
  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'IMAGE':
        return (
          <div className="mb-2">
            {message.attachmentUrl && (
              <Image
                src={message.attachmentUrl}
                alt="Image"
                width={300}
                height={300}
                className="rounded-lg max-w-xs w-full h-auto object-cover"
                unoptimized
              />
            )}
            {message.content && message.content !== 'Отправлено вложение' && (
              <p className="mt-2 text-[var(--foreground)]">{message.content}</p>
            )}
          </div>
        );
      
      case 'VIDEO':
        return (
          <div className="mb-2">
            {message.attachmentUrl && (
              <video
                src={message.attachmentUrl}
                controls
                className="rounded-lg max-w-xs w-full"
              />
            )}
            {message.content && message.content !== 'Отправлено вложение' && (
              <p className="mt-2 text-[var(--foreground)]">{message.content}</p>
            )}
          </div>
        );
      
      case 'FILE':
        return (
          <div className="mb-2">
            {message.attachmentUrl && (
              <a
                href={message.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-[var(--input-bg)] rounded-lg hover:bg-[var(--border-color)] transition-colors"
              >
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">
                  📎
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--foreground)] truncate">
                    {message.attachmentUrl.split('/').pop()}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">Нажмите, чтобы открыть</p>
                </div>
              </a>
            )}
            {message.content && message.content !== 'Отправлено вложение' && (
              <p className="mt-2 text-[var(--foreground)]">{message.content}</p>
            )}
          </div>
        );
      
      default:
        return <p className="text-[var(--foreground)] break-words">{message.content}</p>;
    }
  };

  return (
    <div className={`flex mb-2 group ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'} relative`}>
        {isOwnMessage && (onEdit || onDelete) && !isEditing && (
          <div className="absolute -left-7 top-1 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-[var(--input-bg)] rounded-full transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
            {showMenu && (
              <div className="absolute left-0 bottom-8 bg-[var(--card-bg)] rounded-lg shadow-lg border border-[var(--border-color)] py-1 z-[100] min-w-[120px]">
                {onEdit && message.messageType === 'TEXT' && (
                  <button
                    onClick={handleEdit}
                    className="w-full px-3 py-2 text-left hover:bg-[var(--input-bg)] flex items-center gap-2 text-sm"
                  >
                    <Edit2 className="w-3 h-3" />
                    Изменить
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left hover:bg-[var(--input-bg)] flex items-center gap-2 text-sm text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                    Удалить
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        <div
          className={`px-3 py-1.5 rounded-2xl text-sm ${
            isOwnMessage
              ? 'bg-red-500 text-white rounded-br-md'
              : 'bg-[var(--input-bg)] text-[var(--foreground)] rounded-bl-md'
          }`}
        >
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-sm outline-none"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded"
                >
                  Сохранить
                </button>
              </div>
            </div>
          ) : (
            <>
              {renderMessageContent()}
              
              <div className={`flex items-center gap-0.5 justify-end mt-0.5 ${
                isOwnMessage ? 'text-white/70' : 'text-[var(--text-secondary)]'
              }`}>
                <span className="text-[10px]">
                  {formatMessageTime(message.createdAt)}
                </span>
                {isOwnMessage && (
                  <>
                    {message.status?.isRead ? (
                      <CheckCheck className="w-3.5 h-3.5" />
                    ) : message.status?.isDelivered ? (
                      <CheckCheck className="w-3.5 h-3.5 opacity-50" />
                    ) : (
                      <Check className="w-3.5 h-3.5 opacity-50" />
                    )}
                  </>
                )}
                {message.isEdited && (
                  <span className="text-[10px] ml-0.5">(ред.)</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
