'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from '@/lib/auth-context';
import { SettingsProvider } from '@/lib/settings-context';
import { ChatProvider } from '@/lib/chat-context';
import { ReactNode } from 'react';
import Snow from './Snow';
import Garland from './Garland';
import ChatModal from './ChatModal';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <SettingsProvider>
        <AuthProvider>
          <ChatProvider>
            {children}
            <ChatModal />
            <Snow />
            <Garland />
          </ChatProvider>
        </AuthProvider>
      </SettingsProvider>
    </GoogleOAuthProvider>
  );
}
