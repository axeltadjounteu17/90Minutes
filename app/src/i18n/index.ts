/**
 * 90Minutes — i18n Configuration
 * Per i18n-languages.md: French default, English available.
 * NEVER hardcode UI text — always use t('key').
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import en from './en.json';
import de from './de.json';

/**
 * Initialize i18next with French as default language.
 * Device locale detection will be added when expo-localization is installed.
 */
i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    de: { translation: de },
  },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
