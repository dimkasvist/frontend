'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Chat, Message, TypingNotification } from '@/types/chat';
import { ChatService, getChats, createChat, sendMessageREST } from '@/lib/chat-api';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';
import ChatSidebar from '@/components/ChatSidebar';
import ChatWindow from '@/components/ChatWindow';
import NewChatModal from '@/components/NewChatModal';
import PhotoModal from '@/components/PhotoModal';
import { getPhoto } from '@/lib/api';
import { Photo } from '@/types/photo';
import { X } from 'lucide-react';

export default function ChatModal() {
  const { isOpen, selectedUserId, closeChat } = useChat();
  const { token, user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [typingNotification, setTypingNotification] = useState<TypingNotification | null>(null);
  const [newMessages, setNewMessages] = useState<Message[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<any[]>([]);
  const [deletedMessageIds, setDeletedMessageIds] = useState<number[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const chatServiceRef = useRef<ChatService | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen || !token) return;

    loadChats();
    setupWebSocket();
    
    // Listen for shared post clicks
    const handleOpenPhotoModal = async (event: any) => {
      const photoId = event.detail?.photoId;
      if (photoId) {
        try {
          const photo = await getPhoto(photoId);
          setSelectedPhoto(photo);
        } catch (error) {
          console.error('Error loading shared photo:', error);
        }
      }
    };
    
    window.addEventListener('openPhotoModal', handleOpenPhotoModal);
    
    return () => {
      window.removeEventListener('openPhotoModal', handleOpenPhotoModal);
      if (chatServiceRef.current) {
        chatServiceRef.current.disconnect();
      }
    };
  }, [isOpen, token]);

  const loadChats = async () => {
    if (!token) return;
    
    try {
      const response = await getChats(token);
      setChats(response.chats);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const setupWebSocket = () => {
    if (!token) return;

    const chatService = new ChatService(token);
    chatServiceRef.current = chatService;

    chatService.connect(
      (message) => {
        console.log('Received WebSocket message:', message);
        
        // Check if this is a delete notification
        if ((message as any).action === 'DELETED') {
          console.log('Delete notification detected:', message);
          const deleteNotification = message as any;
          handleMessageDeletedNotification(deleteNotification.messageId, deleteNotification.chatId);
          return;
        }
        
        // Check if this is an update to existing message (edit)
        const existingMessageIndex = newMessages.findIndex(m => m.id === message.id);
        if (existingMessageIndex !== -1) {
          console.log('Message update detected:', message);
          setNewMessages((prev) => prev.map(m => m.id === message.id ? message : m));
        } else {
          setNewMessages((prev) => [...prev, message]);
        }
        
        updateChatWithNewMessage(message);
      },
      (notification) => {
        setTypingNotification(notification);
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        if (notification.isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setTypingNotification(null);
          }, 5000);
        }
      },
      (statusUpdate) => {
        console.log('Status update:', statusUpdate);
        
        // Backend sends { messageId: X, status: { isDelivered, isRead, ... } }
        const messageId = statusUpdate.messageId;
        const status = statusUpdate.status;
        
        if (messageId && status) {
          setStatusUpdates((prev) => [...prev, { messageId, ...status }]);
          
          setNewMessages((prev) => 
            prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, status: { ...msg.status, ...status } }
                : msg
            )
          );
          
          // Update status in chat list
          setChats((prevChats) =>
            prevChats.map((chat) => {
              if (chat.lastMessage && chat.lastMessage.id === messageId) {
                return {
                  ...chat,
                  lastMessage: {
                    ...chat.lastMessage,
                    status: {
                      isDelivered: status.isDelivered ?? chat.lastMessage.status?.isDelivered ?? false,
                      isRead: status.isRead ?? chat.lastMessage.status?.isRead ?? false,
                      deliveredAt: status.deliveredAt ?? chat.lastMessage.status?.deliveredAt ?? null,
                      readAt: status.readAt ?? chat.lastMessage.status?.readAt ?? null,
                    }
                  }
                };
              }
              return chat;
            })
          );
        }
      },
      () => {
        console.log('WebSocket connected');
      },
      (error) => {
        console.error('WebSocket error:', error);
      }
    );
  };

  const handleMessageDeletedNotification = (messageId: number, chatId: number) => {
    setNewMessages((prev) => prev.filter(m => m.id !== messageId));
    setDeletedMessageIds((prev) => [...prev, messageId]);
    
    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.lastMessage?.id === messageId) {
          return {
            ...chat,
            lastMessage: null,
          };
        }
        return chat;
      })
    );
  };

  const updateChatWithNewMessage = (message: Message) => {
    setChats((prevChats) => {
      const updatedChats = prevChats.map((chat) => {
        if (chat.id === message.chatId) {
          return {
            ...chat,
            lastMessage: message,
            unreadCount: message.sender.id === user?.id ? chat.unreadCount : chat.unreadCount + 1,
            updatedAt: message.createdAt,
          };
        }
        return chat;
      });

      return updatedChats.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  };

  const handleSelectChat = useCallback((chatId: number) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setSelectedChat(chat);
      setNewMessages([]);
      setDeletedMessageIds([]);
      setShowSidebar(false);
      
      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === chatId ? { ...c, unreadCount: 0 } : c
        )
      );
    }
  }, [chats]);

  const handleStartChatWithUser = useCallback(async (userId: number) => {
    if (!token) return;

    const existingChat = chats.find((c) => c.user.id === userId);
    if (existingChat) {
      setSelectedChat(existingChat);
      setShowSidebar(false);
      return;
    }

    try {
      const newChat = await createChat(token, userId);
      setChats((prev) => [newChat, ...prev]);
      setSelectedChat(newChat);
      setShowSidebar(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  }, [token, chats]);

  useEffect(() => {
    if (selectedUserId && token) {
      handleStartChatWithUser(selectedUserId);
    }
  }, [selectedUserId, token, handleStartChatWithUser]);

  const handleSendMessage = async (
    content: string,
    messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE',
    attachmentUrl?: string
  ) => {
    if (!token || !selectedChat) return;

    const messageRequest = {
      recipientId: selectedChat.user.id,
      content,
      messageType,
      attachmentUrl: attachmentUrl || null,
    };

    if (chatServiceRef.current?.isConnected()) {
      chatServiceRef.current.sendMessage(messageRequest);
    } else {
      try {
        const message = await sendMessageREST(token, messageRequest);
        setNewMessages([message]);
        updateChatWithNewMessage(message);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!selectedChat || !chatServiceRef.current) return;
    
    chatServiceRef.current.sendTypingNotification(
      selectedChat.id,
      selectedChat.user.id,
      isTyping
    );
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    setShowSidebar(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed left-24 top-4 h-[calc(100vh-2rem)] w-[440px] bg-[var(--background)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden">
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            onBack={handleBackToList}
            onClose={closeChat}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            typingNotification={typingNotification}
            newMessages={newMessages}
            statusUpdates={statusUpdates}
            deletedMessageIds={deletedMessageIds}
            chatService={chatServiceRef.current}
          />
        ) : (
          <ChatSidebar
            isOpen={true}
            onClose={closeChat}
            selectedChatId={null}
            onSelectChat={handleSelectChat}
            onNewChat={() => setShowNewChatModal(true)}
          />
        )}
      </div>

      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSelectUser={handleStartChatWithUser}
      />
      
      <PhotoModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDelete={(id) => {
          setSelectedPhoto(null);
        }}
      />
    </>
  );
}
