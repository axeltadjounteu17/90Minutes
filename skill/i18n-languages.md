# 90Minutes — Internationalization (i18n)

## OVERVIEW

The app supports **two languages**:
- 🇫🇷 **Français** (default)
- 🇬🇧 **English**

The user can switch language in Settings. The app also detects the device locale on first launch.

---

## IMPLEMENTATION

### Library
Use **`i18next`** + **`react-i18next`** + **`expo-localization`**

```bash
npm install i18next react-i18next expo-localization
```

### File Structure
```
src/
└── i18n/
    ├── index.ts          ← i18n init config
    ├── fr.json           ← French translations (default)
    └── en.json           ← English translations
```

### Init Config
```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fr from './fr.json';
import en from './en.json';

const deviceLang = getLocales()[0]?.languageCode ?? 'fr';

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: deviceLang === 'en' ? 'en' : 'fr',  // Default FR for non-EN devices
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

// Restore saved preference
AsyncStorage.getItem('language').then(saved => {
  if (saved) i18n.changeLanguage(saved);
});

export default i18n;
```

---

## TRANSLATION KEYS

### fr.json (Default)
```json
{
  "app": {
    "name": "90Minutes",
    "tagline": "Le football, c'est mieux ensemble"
  },

  "splash": {
    "loading": "Chargement..."
  },

  "onboarding": {
    "skip": "Passer",
    "next": "Suivant",
    "start": "Commencer",
    "slide1_title": "Vis le match en direct",
    "slide1_desc": "Rejoins tes amis dans une room et suis chaque action en temps réel",
    "slide2_title": "Prédis le score",
    "slide2_desc": "Fais ta prédiction et gagne des points si tu as raison",
    "slide3_title": "Réagis ensemble",
    "slide3_desc": "Partage tes émotions avec les autres fans en temps réel"
  },

  "auth": {
    "title": "Rejoins le Squad",
    "fan_name": "Ton nom de fan",
    "email": "Email",
    "password": "Mot de passe",
    "login": "Se connecter",
    "register": "Let's Go !",
    "already_account": "J'ai déjà un compte",
    "guest": "Continuer en invité",
    "error_invalid": "Email ou mot de passe incorrect",
    "error_exists": "Ce compte existe déjà"
  },

  "home": {
    "live": "EN DIRECT",
    "upcoming": "À VENIR",
    "fans_connected": "{{count}} fans connectés",
    "kickoff_at": "Coup d'envoi à {{time}}"
  },

  "room": {
    "title": "Choisir une room",
    "available": "ROOMS DISPONIBLES",
    "join": "Rejoindre",
    "create": "Créer une room",
    "room_name": "Nom de la room",
    "fans": "{{count}} fans",
    "empty": "Aucune room disponible. Crée la tienne !"
  },

  "match": {
    "live": "LIVE",
    "minute": "{{min}}'",
    "halftime": "Mi-temps",
    "fulltime": "Terminé",
    "waiting": "En attente",
    "goal": "BUUUUT !",
    "card_yellow": "Carton jaune !",
    "card_red": "Carton rouge !",
    "substitution": "Changement",
    "offside": "Hors-jeu",
    "foul": "Faute",
    "final_score": "Score final : {{score}}",
    "ai_narration": "IA Narration",
    "reconnecting": "Reconnexion..."
  },

  "prediction": {
    "title": "Quel sera le score final ?",
    "subtitle": "Prédis et gagne jusqu'à 100 points",
    "lock": "Verrouiller ma prédiction 🔒",
    "skip": "Passer",
    "time_remaining": "{{time}} restant",
    "halftime_title": "Prédis la 2ème mi-temps !",
    "submitted": "Prédiction enregistrée ✅",
    "exact": "Score exact ! +100 pts",
    "correct_winner": "Bon vainqueur ! +30 pts",
    "correct_diff": "Bonne différence ! +20 pts"
  },

  "reaction": {
    "point_earned": "+1 pt",
    "cooldown": "Attends un peu..."
  },

  "leaderboard": {
    "title": "CLASSEMENT",
    "my_room": "Ma Room",
    "global": "Global",
    "me": "Moi",
    "points": "{{count}} pts",
    "rank_up": "↑ Tu montes !",
    "rank_down": "↓ Tu descends"
  },

  "profile": {
    "title": "Mon Profil",
    "edit": "Modifier",
    "matches_watched": "Matchs",
    "correct_predictions": "Prédictions correctes",
    "total_points": "Points",
    "my_badges": "MES BADGES",
    "see_all": "Voir tous →"
  },

  "badges": {
    "title": "MES BADGES",
    "unlocked": "{{count}}/{{total}} débloqués",
    "sniper": "Sniper",
    "sniper_desc": "Prédire le score exact",
    "in_the_zone": "In The Zone",
    "in_the_zone_desc": "5 réactions dans un match",
    "champion": "Champion",
    "champion_desc": "Finir #1 d'une room",
    "first_blood": "First Blood",
    "first_blood_desc": "1ère prédiction envoyée",
    "assidu": "Assidu",
    "assidu_desc": "3 matchs suivis",
    "squad_goals": "Squad Goals",
    "squad_goals_desc": "Rejoindre une room de 5+ fans"
  },

  "settings": {
    "title": "PARAMÈTRES",
    "account": "COMPTE",
    "edit_name": "Modifier le nom de fan",
    "change_password": "Changer le mot de passe",
    "notifications": "Notifications push",
    "app": "APPLICATION",
    "language": "Langue",
    "sounds": "Sons",
    "theme": "Thème",
    "theme_dark": "Sombre",
    "theme_light": "Clair",
    "theme_system": "Système",
    "privacy": "CONFIDENTIALITÉ",
    "my_data": "Mes données",
    "delete_account": "Supprimer le compte",
    "about": "À PROPOS",
    "version": "Version",
    "terms": "Conditions d'utilisation",
    "logout": "Se déconnecter"
  },

  "common": {
    "loading": "Chargement...",
    "error": "Une erreur est survenue",
    "retry": "Réessayer",
    "cancel": "Annuler",
    "confirm": "Confirmer",
    "save": "Enregistrer",
    "back": "Retour"
  }
}
```

### en.json
```json
{
  "app": {
    "name": "90Minutes",
    "tagline": "Football is better together"
  },

  "splash": {
    "loading": "Loading..."
  },

  "onboarding": {
    "skip": "Skip",
    "next": "Next",
    "start": "Get Started",
    "slide1_title": "Live Match Experience",
    "slide1_desc": "Join your friends in a room and follow every action in real-time",
    "slide2_title": "Predict the Score",
    "slide2_desc": "Make your prediction and earn points if you're right",
    "slide3_title": "React Together",
    "slide3_desc": "Share your emotions with other fans in real-time"
  },

  "auth": {
    "title": "Join the Squad",
    "fan_name": "Your fan name",
    "email": "Email",
    "password": "Password",
    "login": "Sign In",
    "register": "Let's Go!",
    "already_account": "I already have an account",
    "guest": "Continue as guest",
    "error_invalid": "Invalid email or password",
    "error_exists": "Account already exists"
  },

  "home": {
    "live": "LIVE NOW",
    "upcoming": "UPCOMING",
    "fans_connected": "{{count}} fans connected",
    "kickoff_at": "Kickoff at {{time}}"
  },

  "room": {
    "title": "Choose a Room",
    "available": "AVAILABLE ROOMS",
    "join": "Join",
    "create": "Create Room",
    "room_name": "Room name",
    "fans": "{{count}} fans",
    "empty": "No rooms available. Create yours!"
  },

  "match": {
    "live": "LIVE",
    "minute": "{{min}}'",
    "halftime": "Half-time",
    "fulltime": "Full-time",
    "waiting": "Waiting",
    "goal": "GOOOAL!",
    "card_yellow": "Yellow card!",
    "card_red": "Red card!",
    "substitution": "Substitution",
    "offside": "Offside",
    "foul": "Foul",
    "final_score": "Final score: {{score}}",
    "ai_narration": "AI Narration",
    "reconnecting": "Reconnecting..."
  },

  "prediction": {
    "title": "What will the final score be?",
    "subtitle": "Predict and earn up to 100 points",
    "lock": "Lock my prediction 🔒",
    "skip": "Skip",
    "time_remaining": "{{time}} remaining",
    "halftime_title": "Predict the 2nd half!",
    "submitted": "Prediction submitted ✅",
    "exact": "Exact score! +100 pts",
    "correct_winner": "Correct winner! +30 pts",
    "correct_diff": "Correct difference! +20 pts"
  },

  "reaction": {
    "point_earned": "+1 pt",
    "cooldown": "Wait a moment..."
  },

  "leaderboard": {
    "title": "LEADERBOARD",
    "my_room": "My Room",
    "global": "Global",
    "me": "Me",
    "points": "{{count}} pts",
    "rank_up": "↑ Moving up!",
    "rank_down": "↓ Dropping down"
  },

  "profile": {
    "title": "My Profile",
    "edit": "Edit",
    "matches_watched": "Matches",
    "correct_predictions": "Correct Predictions",
    "total_points": "Points",
    "my_badges": "MY BADGES",
    "see_all": "See all →"
  },

  "badges": {
    "title": "MY BADGES",
    "unlocked": "{{count}}/{{total}} unlocked",
    "sniper": "Sniper",
    "sniper_desc": "Predict the exact score",
    "in_the_zone": "In The Zone",
    "in_the_zone_desc": "5 reactions in a match",
    "champion": "Champion",
    "champion_desc": "Finish #1 in a room",
    "first_blood": "First Blood",
    "first_blood_desc": "1st prediction submitted",
    "assidu": "Dedicated",
    "assidu_desc": "3 matches followed",
    "squad_goals": "Squad Goals",
    "squad_goals_desc": "Join a room with 5+ fans"
  },

  "settings": {
    "title": "SETTINGS",
    "account": "ACCOUNT",
    "edit_name": "Edit fan name",
    "change_password": "Change password",
    "notifications": "Push notifications",
    "app": "APP",
    "language": "Language",
    "sounds": "Sounds",
    "theme": "Theme",
    "theme_dark": "Dark",
    "theme_light": "Light",
    "theme_system": "System",
    "privacy": "PRIVACY",
    "my_data": "My data",
    "delete_account": "Delete account",
    "about": "ABOUT",
    "version": "Version",
    "terms": "Terms of service",
    "logout": "Sign Out"
  },

  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Retry",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "save": "Save",
    "back": "Back"
  }
}
```

---

## USAGE IN COMPONENTS

```typescript
import { useTranslation } from 'react-i18next';

function PredictionModal() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('prediction.title')}</Text>
      <Text>{t('prediction.subtitle')}</Text>
      <Button title={t('prediction.lock')} />
    </View>
  );
}
```

### Change Language
```typescript
import i18n from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function changeLanguage(lang: 'fr' | 'en') {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem('language', lang);
}
```

---

## RULES

1. **NEVER hardcode UI text** — always use `t('key')` from i18next
2. **Code language is always English** (variables, functions, comments, commits)
3. **UI language default is French** — matches the target audience (Chloe persona)
4. **Interpolation** for dynamic values: `t('home.fans_connected', { count: 12 })`
5. **Pluralization**: i18next handles it automatically with `_one` / `_other` suffixes if needed
6. **Emitter messages** (Python): Always in French — they go directly to the UI feed
7. **Bedrock AI narration**: Prompt specifies French — narrations always in French regardless of app language
8. **DFL data** (player names, team names): Displayed as-is from XML — no translation needed
