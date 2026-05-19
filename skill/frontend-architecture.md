# Fan Squad — Frontend Architecture & Components

## FRAMEWORK
- **React Native** with **Expo SDK 52+**
- **TypeScript** strict mode
- **Expo Router** for file-based navigation
- **React Native Reanimated 3** for all animations
- **React Native Gesture Handler** for swipes/touches

## MANDATORY DEPENDENCIES
```json
{
  "expo": "~52.0.0",
  "expo-router": "~4.0.0",
  "react-native-reanimated": "~3.16.0",
  "react-native-gesture-handler": "~2.20.0",
  "react-native-safe-area-context": "~4.12.0",
  "expo-secure-store": "~14.0.0",
  "expo-haptics": "~14.0.0",
  "expo-linear-gradient": "~14.0.0",
  "@expo/vector-icons": "^14.0.0",
  "amazon-cognito-identity-js": "^6.3.0"
}
```

---

## SCREEN ARCHITECTURE

### Navigation Structure (Expo Router)
```
app/
├── _layout.tsx          ← Root layout (font loading, theme provider)
├── index.tsx            ← Splash screen (auto-redirect)
├── (auth)/
│   ├── _layout.tsx      ← Auth stack layout
│   ├── onboarding.tsx   ← 3-slide intro
│   └── login.tsx        ← Login/Register
├── (tabs)/
│   ├── _layout.tsx      ← Bottom tab layout (4 tabs)
│   ├── index.tsx         ← Home / Lobby
│   ├── match/
│   │   ├── _layout.tsx
│   │   ├── index.tsx     ← Room Selector
│   │   └── [roomId].tsx  ← Live Match Dashboard
│   ├── leaderboard.tsx   ← Leaderboard
│   └── profile/
│       ├── index.tsx     ← Profile
│       ├── badges.tsx    ← Badges collection
│       └── settings.tsx  ← Settings
```

---

## COMPONENT LIBRARY

### Every component must:
1. Be typed with proper `interface Props {}`
2. Use design tokens from the design system (never hardcoded colors)
3. Include loading/error/empty states where applicable
4. Be wrapped with `React.memo()` if in a list or frequently re-rendered
5. Use Reanimated for any animation (never Animated from react-native)
6. Support haptic feedback on interactive elements via `expo-haptics`

### Core Components to Build

#### `<ScoreHero />`
```typescript
interface ScoreHeroProps {
  homeCode: string;      // "FCT"
  guestCode: string;     // "CLU"
  homeScore: number;     // 2
  guestScore: number;    // 1
  matchMinute: number;   // 67
  isLive: boolean;
}
```
- Largest element on Dashboard screen
- Score digits use `display-xl` (64px, Oswald, bold)
- Score pulses with orange glow on GOAL event
- Match minute in orange pill badge
- Team codes in `heading-lg` flanking the score
- Red pulsing LIVE dot top-left when `isLive=true`

#### `<EventCard />`
```typescript
interface EventCardProps {
  type: 'GOAL' | 'CARD' | 'HALFTIME' | 'FULLTIME' | 'SUBSTITUTION';
  emoji: string;
  title: string;
  message: string;
  matchMinute: number;
  kpis?: { xG?: number; playerSpeed?: number; goalZone?: number };
  narrative?: string;    // AI-generated text from Bedrock
  isNew?: boolean;       // triggers slide-in animation
}
```
- Slides in from bottom when new
- Left: emoji in colored circle (orange for goal, yellow for card, grey for sub)
- Center: title bold white + message secondary
- Right: minute badge
- GOAL cards show KPI chips below (xG, speed)
- GOAL cards show AI narrative in italic below KPIs
- Bundesliga-style red left border accent on GOAL cards

#### `<ReactionBar />`
```typescript
interface ReactionBarProps {
  onReaction: (emoji: string) => void;
  disabled: boolean;
  cooldownMs: number;  // 1000ms between reactions
}
```
- 4 large circular buttons: ⚽ 😱 🔥 💀
- Bounce animation on press (scale spring)
- Haptic feedback on press (medium impact)
- Emoji flies upward and fades out after pressing
- Shows "+1 pt" toast briefly
- 1 second cooldown between presses (button greys out)
- Counter badge on each showing total room reactions

#### `<PredictionModal />`
```typescript
interface PredictionModalProps {
  visible: boolean;
  homeCode: string;
  guestCode: string;
  currentScore?: string;    // null = pre-match, "1:0" = halftime
  timeRemaining: number;    // seconds until modal auto-closes
  onSubmit: (home: number, away: number) => void;
  onDismiss: () => void;
}
```
- Bottom sheet modal (slides up 60% of screen)
- Countdown timer in red badge (auto-closes at 0)
- Two score steppers with team colors
- Stepper buttons: orange circles with - and +
- Lock button with shake animation on submit
- Haptic success feedback on lock

#### `<LeaderboardRow />`
```typescript
interface LeaderboardRowProps {
  rank: number;
  username: string;
  points: number;
  avatarColor: string;
  isMe: boolean;
  previousRank?: number;  // for animation direction
}
```
- Smooth Y-position animation when rank changes
- Green arrow up / red arrow down indicator
- `isMe` row: orange left border + slightly elevated
- Top 3: gold/silver/bronze medal emoji prefix
- Points in orange monospace font

#### `<LiveIndicator />`
- Red circle with infinite pulse animation
- "LIVE" text in white caps next to it
- Green variant for WebSocket connected

#### `<KPIChip />`
```typescript
interface KPIChipProps {
  label: string;   // "xG"
  value: string;   // "0.23"
  icon?: string;   // "⚡"
}
```
- Small dark pill badge
- Label in secondary text, value in white bold
- Used inside GOAL EventCards

#### `<NarrativeCard />`
- Orange left accent bar (4px)
- Italic white text (AI-generated narration)
- Small "🤖 IA" label top-right in tertiary text
- Subtle fade-in animation (300ms)

---

## STATE MANAGEMENT

### WebSocket State (via React Context)
```typescript
interface MatchState {
  status: 'connecting' | 'connected' | 'disconnected';
  matchInfo: MatchInfo | null;
  currentScore: string;
  matchMinute: number;
  matchStatus: 'waiting' | 'live' | 'halftime' | 'finished';
  events: MatchEvent[];
  lastEvent: MatchEvent | null;
  leaderboard: PlayerScore[];
  myPrediction: Prediction | null;
  myPoints: number;
}
```

### Hooks Architecture
| Hook | Purpose |
|---|---|
| `useWebSocket(roomId)` | Manages WebSocket connection, auto-reconnect |
| `useMatchState()` | Consumes MatchContext, returns current state |
| `useAuth()` | Cognito auth state, login/logout/register |
| `usePrediction(roomId)` | Submit & track prediction |
| `useReaction(roomId)` | Send reaction with cooldown logic |
| `useLeaderboard(roomId)` | Real-time sorted leaderboard |
| `useHaptic()` | Trigger haptic feedback patterns |

---

## PERFORMANCE RULES
1. **FlatList** for all scrollable lists (never ScrollView with map)
2. **React.memo()** on all list item components
3. **useCallback** on all event handlers passed as props
4. **useMemo** on computed values (sorted leaderboard, filtered events)
5. **Image caching** via Expo Image for any team logos
6. **Debounce** reaction presses (300ms)
7. **Throttle** WebSocket message processing (batch if > 5/sec)
8. Max **10 events** in visible feed (older events in "See more")

---

## ACCESSIBILITY
- All buttons: `accessibilityLabel` + `accessibilityRole="button"`
- Score: `accessibilityLabel="Score: Bayern 2, Hamburg 1"`
- Live indicator: `accessibilityLabel="Match en direct"`
- Minimum contrast ratio 4.5:1 (white on #111111 = ✅ 18.1:1)
- Touch targets minimum 44x44px
