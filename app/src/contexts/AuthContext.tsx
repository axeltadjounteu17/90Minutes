/**
 * 90Minutes — AuthContext
 * Gère l'authentification Cognito, l'hydratation depuis AsyncStorage,
 * et expose user, hydrated, signIn, signOut, updateFanName, deleteAccount.
 *
 * Requirements: 8.1, 8.2, 8.5, 12.1
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Cognito import removed for Web compatibility
import awsOutputs from '../constants/aws-outputs.json';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface AuthUser {
  userId: string;
  fanName: string;
  email?: string;
  isGuest: boolean;
  accessToken?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateFanName: (newName: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  guestSignIn: (fanName: string) => Promise<void>;
}

// ─────────────────────────────────────────
// Cognito config
// ─────────────────────────────────────────

const stack = awsOutputs.NinetyMinutesStack;
// UserPool config removed for Web compatibility

const AUTH_STORAGE_KEY = 'auth.user';

// ─────────────────────────────────────────
// Context
// ─────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrater depuis AsyncStorage au montage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.userId && parsed.fanName) {
            setUser(parsed);
          } else {
            // Données corrompues → reset
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch {
        // Corruption → reset silencieux
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persister le user dans AsyncStorage à chaque changement
  useEffect(() => {
    if (hydrated) {
      if (user) {
        AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, [user, hydrated]);

  const signIn = useCallback(async (email: string, password: string) => {
    // Mock signIn for Web compatibility
    const authUser: AuthUser = {
      userId: `user_${Date.now()}`,
      fanName: email.split('@')[0],
      email,
      isGuest: false,
      accessToken: 'mock-token',
    };
    setUser(authUser);
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const updateFanName = useCallback(async (newName: string) => {
    setUser(prev => prev ? { ...prev, fanName: newName } : null);
  }, [user]);

  const deleteAccount = useCallback(async () => {
    setUser(null);
    // Wipe all user data
    await AsyncStorage.multiRemove([
      AUTH_STORAGE_KEY,
      '90minutes_predictions_history',
      'prefs.notifications',
      'prefs.sounds',
      'prefs.language',
      'prefs.theme',
      '90minutes_active_room',
    ]);
  }, []);

  const guestSignIn = useCallback(async (fanName: string) => {
    const guestUser: AuthUser = {
      userId: `guest_${Date.now().toString(36)}`,
      fanName,
      isGuest: true,
    };
    setUser(guestUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, hydrated, signIn, signOut, updateFanName, deleteAccount, guestSignIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}

export default AuthContext;
