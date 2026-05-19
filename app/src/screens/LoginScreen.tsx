/**
 * 90Minutes — Login / Register Screen
 * Per frontend-architecture.md:
 * - Logo + tagline
 * - Fan name, email, password inputs
 * - "Let's Go!" CTA
 * - "Continue as guest" link
 * - "Already have an account" toggle
 *
 * Per design-system.md: flat input style (border-bottom, no rounded borders)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING, RADIUS } from '../constants/spacing';

interface LoginScreenProps {
  /** Called on successful login/register */
  onAuth: (userId: string, username: string) => void;
  /** Called when user chooses guest mode */
  onGuest: () => void;
}

export function LoginScreen({ onAuth, onGuest }: LoginScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();

  const [isLogin, setIsLogin] = useState(false);
  const [fanName, setFanName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(() => {
    setError('');

    // Basic client-side validation
    if (!email.trim() || !password.trim()) {
      setError(t('auth.error_invalid'));
      return;
    }

    if (!isLogin && !fanName.trim()) {
      setError(t('auth.error_invalid'));
      return;
    }

    // TODO: integrate with Cognito when SDK is installed
    const userId = `user_${Date.now()}`;
    const name = fanName.trim() || email.split('@')[0];
    onAuth(userId, name);
  }, [email, password, fanName, isLogin, onAuth, t]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bgPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Logo */}
      <Text style={[styles.logo, { color: theme.accentPrimary }]}>⚽</Text>
      <Text style={[styles.appName, { color: theme.textPrimary }]}>
        {t('app.name')}
      </Text>
      <Text style={[styles.tagline, { color: theme.textSecondary }]}>
        {t('app.tagline')}
      </Text>

      {/* Title */}
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {t('auth.title')}
      </Text>

      {/* Form */}
      <View style={styles.form}>
        {!isLogin && (
          <TextInput
            style={[styles.input, { color: theme.textPrimary, borderBottomColor: theme.border, backgroundColor: theme.bgInput }]}
            placeholder={t('auth.fan_name')}
            placeholderTextColor={theme.textTertiary}
            value={fanName}
            onChangeText={setFanName}
            autoCapitalize="none"
            accessibilityLabel={t('auth.fan_name')}
          />
        )}

        <TextInput
          style={[styles.input, { color: theme.textPrimary, borderBottomColor: theme.border, backgroundColor: theme.bgInput }]}
          placeholder={t('auth.email')}
          placeholderTextColor={theme.textTertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel={t('auth.email')}
        />

        <TextInput
          style={[styles.input, { color: theme.textPrimary, borderBottomColor: theme.border, backgroundColor: theme.bgInput }]}
          placeholder={t('auth.password')}
          placeholderTextColor={theme.textTertiary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel={t('auth.password')}
        />

        {/* Error message */}
        {error !== '' && (
          <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
        )}

        {/* Submit button */}
        <Pressable
          style={[styles.submitButton, { backgroundColor: theme.accentPrimary }]}
          onPress={handleSubmit}
          accessibilityRole="button"
        >
          <Text style={[styles.submitText, { color: theme.textOnAccent }]}>
            {isLogin ? t('auth.login') : t('auth.register')}
          </Text>
        </Pressable>

        {/* Toggle login/register */}
        <Pressable onPress={() => setIsLogin(!isLogin)} style={styles.toggleLink}>
          <Text style={[styles.toggleText, { color: theme.textSecondary }]}>
            {isLogin ? t('auth.register') : t('auth.already_account')}
          </Text>
        </Pressable>

        {/* Guest mode */}
        <Pressable onPress={onGuest} style={styles.guestLink}>
          <Text style={[styles.guestText, { color: theme.textTertiary }]}>
            {t('auth.guest')}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logo: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  appName: {
    ...TYPOGRAPHY.displayLg,
    textAlign: 'center',
  },
  tagline: {
    ...TYPOGRAPHY.bodyMd,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
  },
  title: {
    ...TYPOGRAPHY.headingLg,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  form: {
    gap: SPACING.md,
  },
  input: {
    height: 52,
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.md,
    ...TYPOGRAPHY.bodyLg,
  },
  error: {
    ...TYPOGRAPHY.bodySm,
    textAlign: 'center',
  },
  submitButton: {
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  submitText: {
    ...TYPOGRAPHY.headingSm,
    fontWeight: '700',
  },
  toggleLink: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  toggleText: {
    ...TYPOGRAPHY.bodyMd,
  },
  guestLink: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  guestText: {
    ...TYPOGRAPHY.bodyMd,
    textDecorationLine: 'underline',
  },
});
