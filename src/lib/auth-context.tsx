'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem('google_token');
      if (savedToken) {
        try {
          const decoded = jwtDecode<GoogleJwtPayload>(savedToken);
          if (decoded.exp * 1000 > Date.now()) {
            setToken(savedToken);
            setUser({
              id: null,
              email: decoded.email,
              name: decoded.name,
              picture: decoded.picture,
            });
            await syncUserProfile(savedToken);
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
  }, []);

  const login = async (credential: string) => {
    try {
      const decoded = jwtDecode<GoogleJwtPayload>(credential);
      localStorage.setItem('google_token', credential);
      setToken(credential);
      setUser({
        id: null,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      });

      await syncUserProfile(credential);
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  };

  const logout = () => {
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
