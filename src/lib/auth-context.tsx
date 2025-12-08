'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('google_token');
    if (savedToken) {
      try {
        const decoded = jwtDecode<GoogleJwtPayload>(savedToken);
        // Check if token is expired
        if (decoded.exp * 1000 > Date.now()) {
          setToken(savedToken);
          setUser({
            email: decoded.email,
            name: decoded.name,
            picture: decoded.picture,
          });
        } else {
          localStorage.removeItem('google_token');
        }
      } catch {
        localStorage.removeItem('google_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credential: string) => {
    try {
      const decoded = jwtDecode<GoogleJwtPayload>(credential);
      localStorage.setItem('google_token', credential);
      setToken(credential);
      setUser({
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      });

      // Вызываем /users/me чтобы создать пользователя в БД
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      const res = await fetch(`${apiUrl}/users/me`, {
        headers: { Authorization: `Bearer ${credential}` },
      });
      if (res.ok) {
        const dbUser = await res.json();
        console.log('User synced with DB:', dbUser);
      }
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
