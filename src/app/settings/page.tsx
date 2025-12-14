'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { NotificationSettings } from '@/types/photo';
import { getNotificationSettings, updateNotificationSettings } from '@/lib/api';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import UploadModal from '@/components/UploadModal';
import { motion } from 'framer-motion';
import { Bell, Mail, Heart, MessageCircle, Image as ImageIcon, Loader2, Save } from 'lucide-react';

export default function SettingsPage() {
  const { token, user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (token) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadSettings = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const data = await getNotificationSettings(token);
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    if (!settings) return;
    
    setSettings(prev => prev ? { ...prev, [key]: !prev[key] } : null);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!token || !settings || saving) return;
    
    setSaving(true);
    try {
      const updated = await updateNotificationSettings(
        {
          notificationsEnabled: settings.notificationsEnabled,
          emailNotificationsEnabled: settings.emailNotificationsEnabled,
          likeNotifications: settings.likeNotifications,
          commentNotifications: settings.commentNotifications,
          commentLikeNotifications: settings.commentLikeNotifications,
          newPinNotifications: settings.newPinNotifications,
        },
        token
      );
      setSettings(updated);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
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
              Войдите, чтобы настроить уведомления
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

  if (!settings) {
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
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Настройки уведомлений</h1>
            
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Сохранить
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* General Notifications */}
            <div className="bg-[var(--card-bg)] rounded-3xl p-6">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">Общие настройки</h2>
              
              <div className="space-y-4">
                <SettingToggle
                  icon={<Bell className="w-5 h-5" />}
                  title="Включить уведомления"
                  description="Получать уведомления о действиях других пользователей"
                  checked={settings.notificationsEnabled}
                  onChange={() => handleToggle('notificationsEnabled')}
                />
                
                <SettingToggle
                  icon={<Mail className="w-5 h-5" />}
                  title="Email уведомления"
                  description="Получать уведомления на электронную почту"
                  checked={settings.emailNotificationsEnabled}
                  onChange={() => handleToggle('emailNotificationsEnabled')}
                  disabled={!settings.notificationsEnabled}
                />
              </div>
            </div>

            {/* Specific Notifications */}
            <div className="bg-[var(--card-bg)] rounded-3xl p-6">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">Типы уведомлений</h2>
              
              <div className="space-y-4">
                <SettingToggle
                  icon={<Heart className="w-5 h-5 text-red-500" />}
                  title="Лайки"
                  description="Когда кто-то лайкает ваш пин"
                  checked={settings.likeNotifications}
                  onChange={() => handleToggle('likeNotifications')}
                  disabled={!settings.notificationsEnabled}
                />
                
                <SettingToggle
                  icon={<MessageCircle className="w-5 h-5 text-blue-500" />}
                  title="Комментарии"
                  description="Когда кто-то комментирует ваш пин"
                  checked={settings.commentNotifications}
                  onChange={() => handleToggle('commentNotifications')}
                  disabled={!settings.notificationsEnabled}
                />
                
                <SettingToggle
                  icon={<Heart className="w-5 h-5 text-red-500" />}
                  title="Лайки комментариев"
                  description="Когда кто-то лайкает ваш комментарий"
                  checked={settings.commentLikeNotifications}
                  onChange={() => handleToggle('commentLikeNotifications')}
                  disabled={!settings.notificationsEnabled}
                />
                
                <SettingToggle
                  icon={<ImageIcon className="w-5 h-5 text-green-500" />}
                  title="Новые пины от подписок"
                  description="Когда пользователь, на которого вы подписаны, публикует новый пин"
                  checked={settings.newPinNotifications}
                  onChange={() => handleToggle('newPinNotifications')}
                  disabled={!settings.notificationsEnabled}
                />
              </div>
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

interface SettingToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function SettingToggle({ icon, title, description, checked, onChange, disabled = false }: SettingToggleProps) {
  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl transition-colors ${disabled ? 'opacity-50' : 'hover:bg-[var(--input-bg)]'}`}>
      <div className="shrink-0 mt-1">{icon}</div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[var(--foreground)] mb-1">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
      
      <label className="shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={`w-14 h-8 rounded-full transition-colors relative ${
          checked ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <div className={`absolute w-6 h-6 bg-white rounded-full shadow top-1 transition-all ${
            checked ? 'left-7' : 'left-1'
          }`} />
        </div>
      </label>
    </div>
  );
}
