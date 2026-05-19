/**
 * 90Minutes — Onboarding Route
 */

import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../../src/screens/OnboardingScreen';

export default function OnboardingRoute(): React.JSX.Element {
  const router = useRouter();

  const handleComplete = useCallback(() => {
    router.replace('/(auth)/login');
  }, [router]);

  return <OnboardingScreen onComplete={handleComplete} />;
}
