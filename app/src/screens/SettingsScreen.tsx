/**
 * 90Minutes — Settings Screen
 * Per frontend-architecture.md:
 * - Sections: Account, App, Privacy, About
 * - iOS-style cells with chevrons
 * - Toggle switches in orange
 * - Theme selector (Dark/Light/System)
 * - Language selector (FR/EN)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  StatusBar,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING, RADIUS, SAFE_AREA } from '../constants/spacing';

export function SettingsScreen({ onClose }: { onClose?: () => void }): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const { theme, isDark, themeName, setTheme } = useTheme();
  const { user, signOut, updateFanName, deleteAccount } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [newFanName, setNewFanName] = useState('');

  // Hydrater les préférences depuis AsyncStorage
  useEffect(() => {
    (async () => {
      const notifs = await AsyncStorage.getItem('prefs.notifications');
      if (notifs !== null) setNotificationsEnabled(notifs === 'true');
      const sounds = await AsyncStorage.getItem('prefs.sounds');
      if (sounds !== null) setSoundsEnabled(sounds === 'true');
    })();
  }, []);

  const currentLang = i18n.language === 'en' ? 'English' : 'Français';

  const toggleLanguage = useCallback(async () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    await AsyncStorage.setItem('prefs.language', newLang);
  }, [i18n]);

  const cycleTheme = useCallback(async () => {
    const order: Array<'dark' | 'light' | 'system'> = ['dark', 'light', 'system'];
    const currentIndex = order.indexOf(themeName as 'dark' | 'light' | 'system');
    const nextIndex = (currentIndex + 1) % order.length;
    const next = order[nextIndex];
    setTheme(next);
    await AsyncStorage.setItem('prefs.theme', next);
  }, [themeName, setTheme]);

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('prefs.notifications', String(value));
  }, []);

  const handleToggleSounds = useCallback(async (value: boolean) => {
    setSoundsEnabled(value);
    await AsyncStorage.setItem('prefs.sounds', String(value));
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const handleEditFanName = useCallback(() => {
    setNewFanName(user?.fanName || '');
    setEditNameVisible(true);
  }, [user]);

  const handleSaveFanName = useCallback(async () => {
    if (newFanName.trim()) {
      await updateFanName(newFanName.trim());
    }
    setEditNameVisible(false);
  }, [newFanName, updateFanName]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t('settings.delete_confirm_title') || 'Supprimer le compte',
      t('settings.delete_confirm_msg') || 'Cette action est irréversible.',
      [
        { text: t('common.cancel') || 'Annuler', style: 'cancel' },
        {
          text: t('common.delete') || 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
          },
        },
      ]
    );
  }, [deleteAccount, t]);

  const themeLabel =
    themeName === 'dark'
      ? t('settings.theme_dark')
      : themeName === 'light'
        ? t('settings.theme_light')
        : t('settings.theme_system');

  return (
    <View style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {t('settings.title')}
          </Text>
          {onClose && (
            <Text style={[styles.closeBtn, { color: theme.textSecondary }]} onPress={onClose}>
              ✕
            </Text>
          )}
        </View>

        {/* ACCOUNT */}
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
          {t('settings.account')}
        </Text>
        <SettingsRow label={t('settings.edit_name')} value={user?.fanName} onPress={handleEditFanName} chevron theme={theme} />
        <SettingsRow
          label={t('settings.notifications')}
          theme={theme}
          right={
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: theme.bgHover, true: theme.accentPrimary }}
              thumbColor="#FFFFFF"
            />
          }
        />

        {/* APP */}
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
          {t('settings.app')}
        </Text>
        <SettingsRow
          label={t('settings.language')}
          value={currentLang}
          onPress={toggleLanguage}
          theme={theme}
        />
        <SettingsRow
          label={t('settings.theme')}
          value={themeLabel}
          onPress={cycleTheme}
          theme={theme}
        />
        <SettingsRow
          label={t('settings.sounds')}
          theme={theme}
          right={
            <Switch
              value={soundsEnabled}
              onValueChange={handleToggleSounds}
              trackColor={{ false: theme.bgHover, true: theme.accentPrimary }}
              thumbColor="#FFFFFF"
            />
          }
        />

        {/* PRIVACY */}
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
          {t('settings.privacy')}
        </Text>
        <SettingsRow label={t('settings.my_data')} chevron theme={theme} />
        <SettingsRow
          label={t('settings.delete_account')}
          theme={theme}
          labelColor={theme.danger}
          onPress={handleDeleteAccount}
          chevron
        />

        {/* ABOUT */}
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
          {t('settings.about')}
        </Text>
        <SettingsRow label={t('settings.version')} value="1.0.0" theme={theme} />
        <SettingsRow label={t('settings.terms')} chevron theme={theme} />

        {/* LOGOUT */}
        <Pressable
          style={[styles.logoutButton, { borderColor: theme.danger }]}
          onPress={handleLogout}
          accessibilityRole="button"
        >
          <Text style={[styles.logoutText, { color: theme.danger }]}>
            {t('settings.logout')}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal édition fanName */}
      <Modal visible={editNameVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.bgCard }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {t('settings.edit_name')}
            </Text>
            <TextInput
              style={[styles.modalInput, { color: theme.textPrimary, borderColor: theme.border }]}
              value={newFanName}
              onChangeText={setNewFanName}
              placeholder="Fan Name"
              placeholderTextColor={theme.textTertiary}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable onPress={() => setEditNameVisible(false)} style={styles.modalBtn}>
                <Text style={{ color: theme.textSecondary }}>{t('common.cancel') || 'Annuler'}</Text>
              </Pressable>
              <Pressable onPress={handleSaveFanName} style={styles.modalBtn}>
                <Text style={{ color: theme.accentPrimary, fontWeight: '700' }}>{t('common.save') || 'Sauver'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** Reusable settings row with iOS-style layout */
function SettingsRow({
  label,
  value,
  chevron,
  onPress,
  right,
  theme,
  labelColor,
}: {
  label: string;
  value?: string;
  chevron?: boolean;
  onPress?: () => void;
  right?: React.ReactNode;
  theme: ReturnType<typeof useTheme>['theme'];
  labelColor?: string;
}): React.JSX.Element {
  const content = (
    <View style={[styles.row, { backgroundColor: theme.bgCard }]}>
      <Text style={[styles.rowLabel, { color: labelColor ?? theme.textPrimary }]}>
        {label}
      </Text>
      <View style={styles.rowRight}>
        {value && (
          <Text style={[styles.rowValue, { color: theme.textSecondary }]}>{value}</Text>
        )}
        {right}
        {chevron && (
          <Text style={[styles.chevron, { color: theme.textTertiary }]}>›</Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SAFE_AREA.top,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING['2xl'],
  },
  title: {
    ...TYPOGRAPHY.displayLg,
    fontSize: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  closeBtn: {
    fontSize: 24,
    padding: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: 2,
    minHeight: 48,
  },
  rowLabel: {
    ...TYPOGRAPHY.bodyLg,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rowValue: {
    ...TYPOGRAPHY.bodyMd,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  logoutButton: {
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  logoutText: {
    ...TYPOGRAPHY.headingSm,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.headingSm,
    marginBottom: SPACING.md,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    marginBottom: SPACING.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  modalBtn: {
    padding: SPACING.sm,
  },
});
