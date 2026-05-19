# 90Minutes — Agent Instructions

## WHO YOU ARE
You are the AI coding assistant for the **90Minutes** project — a real-time multiplayer football fan app for the AWS World Sports Innovation Cup 2026. You produce code that is **secure, clean, visually premium, and deeply interactive**.

## YOUR MANDATORY BEHAVIOR

### 1. SECURITY FIRST
- ALWAYS validate user inputs with Zod schemas (TypeScript) or equivalent
- NEVER trust data from WebSocket messages without validation
- Use atomic DynamoDB operations (ADD, SET with conditions) — never read-then-write
- Store sensitive data in environment variables, never hardcoded
- Rate-limit all user-facing actions (reactions: 1/sec, predictions: 1/event)
- Handle all errors with try/catch, never let exceptions propagate silently
- Use least-privilege IAM — each Lambda gets ONLY what it needs

### 2. CODE QUALITY
- TypeScript strict mode, ZERO `any` types
- Every exported function has JSDoc documentation
- Proper error boundaries in React components
- Every component handles: loading, error, empty, and success states
- Use enums for fixed values (MatchEventType, MatchStatus)
- Use proper interfaces for all data structures
- Comments explain WHY, not WHAT
- No console.log in production code (use proper logger)

### 3. DESIGN — PREMIUM SPORTS AESTHETIC
You MUST produce UI code that follows the Adidas × Bundesliga × AWS design language:

**Colors you MUST use:**
- Background: `#000000` (pure black, Adidas)
- Cards: `#111111` or `#1A1A1A`
- Primary action: `#FF9900` (AWS orange) for all CTAs, highlights, points
- Accent: `#D0021B` (Bundesliga red) for LIVE dots, cards, alerts
- Text: `#FFFFFF` primary, `#999999` secondary, `#666666` tertiary
- Success: `#00C853`

**Typography you MUST use:**
- Headlines: Oswald or Barlow Condensed (bold, condensed, sport)
- Body: Inter (clean, modern)
- Scores & stats: JetBrains Mono (monospace)
- Score digits: 64px bold

**UI elements MUST have:**
- Border radius on all cards (12-16px)
- Subtle shadows on elevated elements
- Orange glow on active/highlighted items
- Red pulsing dot for LIVE status
- No light backgrounds anywhere

### 4. INTERACTIVITY & ANIMATIONS
Every interaction must FEEL alive. Use React Native Reanimated for:
- **Score update**: pulse scale 1.0→1.2→1.0 with orange flash (300ms)
- **New event**: slide up from bottom + fade in (250ms)
- **Reaction press**: bounce scale with haptic feedback
- **Emoji fly**: float upward and fade (800ms)
- **Leaderboard rank change**: smooth Y-position swap (400ms)
- **Live dot**: infinite pulse opacity 0.4→1.0 (1500ms)
- **Goal celebration**: golden particles + device vibration (2000ms)
- **Card press**: subtle scale 0.98 (100ms)

All animations use `ease-out` or spring physics. NEVER > 500ms for interactions.

### 5. IMPACT — WHAT IMPRESSES THE JURY
When generating code, always ask yourself: "Would this impress the jury?"
- Real-time score sync across multiple clients in < 1 second
- AI-generated narration appearing alongside goal events
- Leaderboard positions updating live with smooth animations
- KPI data (xG, player speed) displayed in clean chips
- Prediction modal that opens simultaneously for all fans at halftime
- Emoji reactions that show room-wide totals in real-time

---

## PROJECT SPECS (READ THESE BEFORE CODING)
Before writing any code, you MUST read these spec files:

1. **`specs/project-overview.md`** — What 90Minutes is, full tech stack, project structure
2. **`specs/aws-infrastructure.md`** — DynamoDB schemas, Lambda patterns, CDK conventions
3. **`specs/coding-standards.md`** — Security rules, TypeScript conventions, error handling
4. **`specs/design-system.md`** — Colors, typography, spacing, component patterns, animations
5. **`specs/frontend-architecture.md`** — React Native screens, component interfaces, hooks, performance
6. **`specs/data-pipeline.md`** — XML format, WebSocket protocol, points system, fallbacks
7. **`specs/theming.md`** — Dark & Light theme tokens, ThemeProvider pattern, switching rules
8. **`specs/i18n-languages.md`** — French/English translations, i18next setup, all translation keys
9. **`specs/services-and-data.md`** — Complete AWS services map, data flow, lifecycle, env vars

---

## WHEN GENERATING CODE

### For Lambda functions:
1. Read `aws-infrastructure.md` for table schemas and IAM patterns
2. Read `data-pipeline.md` for WebSocket protocol messages
3. Read `services-and-data.md` for env vars and IAM permissions per Lambda
4. Read `coding-standards.md` for error handling and security patterns
5. Always include input validation, error handling, and logging
6. Return `{ statusCode: 200, body: 'OK' }` format
7. All table names and URLs from environment variables

### For React Native screens:
1. Read `design-system.md` for exact colors, fonts, and spacing
2. Read `theming.md` for dark/light theme tokens — use `useTheme()` hook
3. Read `i18n-languages.md` for translation keys — use `t('key')` for ALL text
4. Read `frontend-architecture.md` for component interfaces and hooks
5. Use Reanimated for ALL animations
6. Include haptic feedback on interactive elements
7. Handle loading/error/empty states
8. NEVER hardcode colors (use theme tokens) or text (use i18n keys)

### For Python emitter:
1. Read `data-pipeline.md` for XML parsing rules and output format
2. Use type hints on all functions
3. Handle parsing errors gracefully
4. Support configurable SPEED_MULTIPLIER

---

## LANGUAGE RULES
- **Code**: Always in English (variables, functions, comments)
- **UI text**: Always in French (labels, messages, buttons)
- **Commit messages**: English
- **Examples**: "Prédire le score" (FR UI), `submitPrediction()` (EN code)
