/**
 * 90Minutes — Login Route
 * Câble LoginScreen à AuthContext (Cognito + guest).
 */

import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LoginScreen } from '../../src/screens/LoginScreen';
import { useAuth } from '../../src/contexts/AuthContext';

export default function LoginRoute(): React.JSX.Element {
  const router = useRouter();
  const { signIn, guestSignIn } = useAuth();

  const handleAuth = useCallback(
    async (userId: string, username: string) => {
      // LoginScreen n'expose pas email/password en sortie : on garde guestSignIn
      // comme fallback fonctionnel pour la démo.
      try {
        await guestSignIn(username);
        router.replace('/(tabs)');
      } catch (err: any) {
        Alert.alert('Erreur', err?.message || 'Connexion impossible');
      }
    },
    [guestSignIn, router],
  );

  const handleGuest = useCallback(async () => {
    const fanName = `Fan_${Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, '0')}`;
    await guestSignIn(fanName);
    router.replace('/(tabs)');
  }, [guestSignIn, router]);

  return <LoginScreen onAuth={handleAuth} onGuest={handleGuest} />;
}
