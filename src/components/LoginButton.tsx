'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface Props {
  onLogin: (credential: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

export default function LoginButton({ onLogin }: Props) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const initializeGoogle = () => {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        callback: (response: { credential: string }) => {
          if (response.credential) {
            onLogin(response.credential);
          }
        },
      });
      
      const buttonDiv = document.getElementById('google-signin-button');
      if (buttonDiv) {
        window.google.accounts.id.renderButton(buttonDiv, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'signin',
          shape: 'pill',
          locale: 'ru',
        });
      }
    }
  };

  useEffect(() => {
    if (scriptLoaded) {
      initializeGoogle();
    }
  }, [scriptLoaded]);

  return (
    <>
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div id="google-signin-button" className="shrink-0" />
    </>
  );
}
