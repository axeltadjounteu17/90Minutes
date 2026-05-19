/**
 * 90Minutes — Home Tab Route
 * Header connecté au vrai user (AuthContext).
 */

import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { HomeScreen } from '../../src/screens/HomeScreen';
import { useAuth } from '../../src/contexts/AuthContext';

export default function HomeRoute(): React.JSX.Element {
  const router = useRouter();
  const { user } = useAuth();

  const handleSelectMatch = useCallback(() => {
    router.push('/(tabs)/match');
  }, [router]);

  return (
    <HomeScreen
      username={user?.fanName ?? 'Fan'}
      totalPoints={0}
      onSelectMatch={handleSelectMatch}
    />
  );
}
