'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';

interface AuthUser {
  id?: number | null;
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface GoogleJwtPayload {
  email: string;
  name: string;
  picture: string;
  exp: number;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void; auto_select?: boolean }) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const syncUserProfile = async (authToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      const res = await fetch(`${apiUrl}/users/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const dbUser = await res.json();
        setUser((prev) => {
          const fallback: AuthUser = prev ?? {
            id: dbUser.id,
            email: dbUser.email || '',
            name: dbUser.displayName || 'Без имени',
            picture: dbUser.avatarUrl || '',
          };
          return {
            ...fallback,
            id: dbUser.id,
            name: dbUser.displayName || fallback.name,
            picture: dbUser.avatarUrl || fallback.picture,
          };
        });
      }
    } catch (error) {
      console.error('Failed to sync user profile:', error);
    }
  };

  const initializeGoogleAuth = () => {
    if (typeof window !== 'undefined' && window.google && !isInitializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        callback: async (response: { credential: string }) => {
          if (response.credential) {
            await login(response.credential);
          }
        },
        auto_select: false,
      });
      isInitializedRef.current = true;
    }
  };

  const scheduleTokenRefresh = (expirationTime: number) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const now = Date.now();
    const expiresIn = expirationTime - now;
    const refreshTime = expiresIn - 5 * 60 * 1000;

    if (refreshTime > 0) {
      refreshTimerRef.current = setTimeout(() => {
        initializeGoogleAuth();
        if (typeof window !== 'undefined' && window.google) {
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              console.warn('Token refresh failed, logging out');
              logout();
            }
          });
        }
      }, refreshTime);
    } else if (expiresIn > 0) {
      setTimeout(() => {
        logout();
      }, expiresIn);
    } else {
      logout();
    }
  };

  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem('google_token');
      if (savedToken) {
        try {
          const decoded = jwtDecode<GoogleJwtPayload>(savedToken);
          const expirationTime = decoded.exp * 1000;
          
          if (expirationTime > Date.now()) {
            setToken(savedToken);
            setUser({
              id: null,
              email: decoded.email,
              name: decoded.name,
              picture: decoded.picture,
            });
            await syncUserProfile(savedToken);
            scheduleTokenRefresh(expirationTime);
          } else {
            localStorage.removeItem('google_token');
          }
        } catch {
          localStorage.removeItem('google_token');
        }
      }
      setIsLoading(false);
    };
    init();

    const loadScript = () => {
      if (typeof window !== 'undefined' && !document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => initializeGoogleAuth();
        document.head.appendChild(script);
      } else {
        initializeGoogleAuth();
      }
    };

    loadScript();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const login = async (credential: string) => {
    try {
      const decoded = jwtDecode<GoogleJwtPayload>(credential);
      const expirationTime = decoded.exp * 1000;
      
      localStorage.setItem('google_token', credential);
      setToken(credential);
      setUser({
        id: null,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      });

      await syncUserProfile(credential);
      scheduleTokenRefresh(expirationTime);
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  };

  const logout = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    localStorage.removeItem('google_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
