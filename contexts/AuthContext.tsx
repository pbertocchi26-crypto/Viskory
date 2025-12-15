'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getCurrentUser, onAuthStateChange, signOut as authSignOut } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial user
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      setUserState(currentUser);
      setLoading(false);
    };

    loadUser();

    // Subscribe to auth state changes
    const { data: authListener } = onAuthStateChange((user) => {
      setUserState(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const setUser = (user: User | null) => {
    setUserState(user);
  };

  const signOut = async () => {
    await authSignOut();
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
