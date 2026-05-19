import React, { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ProfileScreen } from '../../src/screens/ProfileScreen';
import { BadgesScreen } from '../../src/screens/BadgesScreen';
import { SettingsScreen } from '../../src/screens/SettingsScreen';
import { useAuth } from '../../src/contexts/AuthContext';
import { getPredictionsHistory, type PastPrediction } from '../../src/utils/predictions';
import type { UserProfile } from '../../src/types';

type ProfileView = 'profile' | 'badges' | 'settings';

export default function ProfileRoute(): React.JSX.Element {
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();
  const [view, setView] = useState<ProfileView>('profile');
  const [predictions, setPredictions] = useState<PastPrediction[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await getPredictionsHistory();
      if (active) setPredictions(data);
    };
    load();
    const timer = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const correctPredictions = predictions.filter((p) => p.status === 'correct').length;
  const totalPoints = predictions.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
  const matchesWatched = Array.from(new Set(predictions.map((p) => p.matchId))).length;

  const badges: string[] = [];
  if (correctPredictions >= 1) badges.push('first_blood');
  if (correctPredictions >= 3) badges.push('sniper');
  if (totalPoints >= 100) badges.push('in_the_zone');
  if (totalPoints >= 300) badges.push('champion');
  if (predictions.length >= 5) badges.push('assidu');

  const profile: UserProfile = {
    userId: user?.userId ?? 'guest',
    username: user?.fanName ?? 'Fan',
    email: user?.email,
    totalPoints,
    matchesWatched,
    correctPredictions,
    badges,
  };

  const handleLogout = useCallback(async () => {
    await signOut();
    router.replace('/(auth)/login');
  }, [signOut, router]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      '🗑️ Supprimer le compte',
      'Cette action est irréversible. Toutes vos données, prédictions et badges seront définitivement supprimés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  }, [deleteAccount, router]);

  if (view === 'badges') {
    return <BadgesScreen unlockedBadges={profile.badges} onClose={() => setView('profile')} />;
  }

  if (view === 'settings') {
    return <SettingsScreen onClose={() => setView('profile')} />;
  }

  return (
    <ProfileScreen
      profile={profile}
      predictions={predictions}
      onViewBadges={() => setView('badges')}
      onOpenSettings={() => setView('settings')}
      onLogout={handleLogout}
      onDeleteAccount={handleDeleteAccount}
    />
  );
}
