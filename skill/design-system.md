# Fan Squad — Design System

## DESIGN PHILOSOPHY
Fan Squad's visual identity is built on THREE brand pillars:
- **ADIDAS** → Bold minimalism, premium feel, black & white foundation
- **BUNDESLIGA** → Energy, passion, red accent, sport intensity
- **AWS** → Innovation, orange highlights, tech-forward confidence

The result: A **dark, bold, premium sports app** that feels like it belongs in the same ecosystem as the Adidas app, the Bundesliga Match Center, and the AWS Console dark mode.

---

## Color Palette

### Primary Colors
| Token | HEX | RGB | Usage |
|---|---|---|---|
| `--color-black` | `#000000` | 0,0,0 | Primary background |
| `--color-white` | `#FFFFFF` | 255,255,255 | Primary text |
| `--color-red` | `#D0021B` | 208,2,27 | Live indicators, alerts, Bundesliga accent |
| `--color-orange` | `#FF9900` | 255,153,0 | CTAs, buttons, points, AWS accent |
| `--color-orange-dark` | `#FF6B00` | 255,107,0 | Pressed/active state of orange |

### Surface Colors
| Token | HEX | Usage |
|---|---|---|
| `--surface-primary` | `#000000` | Screen background |
| `--surface-card` | `#111111` | Card background |
| `--surface-elevated` | `#1A1A1A` | Elevated cards, modals |
| `--surface-input` | `#1E1E1E` | Input fields |
| `--surface-hover` | `#2A2A2A` | Hover/press state |

### Text Colors
| Token | HEX | Usage |
|---|---|---|
| `--text-primary` | `#FFFFFF` | Headings, primary text |
| `--text-secondary` | `#999999` | Subtitles, labels |
| `--text-tertiary` | `#666666` | Timestamps, metadata |
| `--text-disabled` | `#444444` | Disabled states |
| `--text-on-orange` | `#000000` | Text on orange buttons |

### Semantic Colors
| Token | HEX | Usage |
|---|---|---|
| `--color-success` | `#00C853` | Successful action, connected |
| `--color-warning` | `#FFC107` | Yellow card, caution |
| `--color-danger` | `#D0021B` | Red card, errors, disconnect |
| `--color-live` | `#D0021B` | Live pulsing indicator |
| `--color-goal` | `#FF9900` | Goal highlight, celebration |

---

## Typography

### Font Family
- **Primary**: `'Inter'` — Clean, modern, excellent readability (Google Fonts)
- **Display/Headlines**: `'Oswald'` or `'Barlow Condensed'` — Bold, sport condensed feel (Adidas-inspired)
- **Monospace**: `'JetBrains Mono'` — For scores, timers, stats

### Type Scale
| Style | Font | Size | Weight | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `display-xl` | Oswald | 64px | 700 | -2px | Live score digits |
| `display-lg` | Oswald | 40px | 700 | -1px | Screen titles |
| `heading-lg` | Oswald | 28px | 600 | 0 | Section headers |
| `heading-md` | Inter | 22px | 600 | 0 | Card titles |
| `heading-sm` | Inter | 18px | 600 | 0 | Subheadings |
| `body-lg` | Inter | 16px | 400 | 0 | Body text |
| `body-md` | Inter | 14px | 400 | 0.2px | Descriptions |
| `body-sm` | Inter | 12px | 400 | 0.3px | Captions, timestamps |
| `label` | Inter | 11px | 600 | 1.5px | ALL CAPS labels |
| `score` | JetBrains Mono | 48px | 700 | -1px | Score numbers |
| `stat` | JetBrains Mono | 20px | 500 | 0 | KPI values |

---

## Spacing System (8px grid)
| Token | Value |
|---|---|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |
| `--space-3xl` | 64px |

---

## Border Radius
| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 8px | Small buttons, chips |
| `--radius-md` | 12px | Cards, inputs |
| `--radius-lg` | 16px | Large cards, modals |
| `--radius-xl` | 24px | Bottom sheets |
| `--radius-full` | 9999px | Circular avatars, pills |

---

## Shadows & Elevation
```css
/* Subtle card shadow */
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.4);

/* Elevated shadow for modals */
--shadow-elevated: 0 8px 32px rgba(0, 0, 0, 0.6);

/* Orange glow for active/highlighted elements */
--glow-orange: 0 0 20px rgba(255, 153, 0, 0.3);

/* Red glow for live indicator */
--glow-red: 0 0 12px rgba(208, 2, 27, 0.5);

/* Goal celebration glow */
--glow-goal: 0 0 40px rgba(255, 153, 0, 0.4);
```

---

## Component Patterns

### Buttons
```
Primary (CTA):  bg=#FF9900, text=#000000, bold, height=56px, radius=12px
                 hover: bg=#FF6B00, shadow glow-orange
                 
Secondary:       bg=transparent, border=1px #FF9900, text=#FF9900, height=48px
                 hover: bg=rgba(255,153,0,0.1)

Danger:          bg=transparent, border=1px #D0021B, text=#D0021B
                 hover: bg=rgba(208,2,27,0.1)

Ghost:           bg=transparent, text=#999999
                 hover: text=#FFFFFF

Reaction:        bg=#1A1A1A, size=64x64px, radius=full, emoji center 32px
                 active: border=2px #FF9900, scale(1.1), glow-orange
```

### Cards
```
Standard:        bg=#111111, radius=16px, padding=16px, shadow-card
                 border: none (clean Adidas style)
                 
Match Card:      bg=#1A1A1A, radius=16px, padding=20px
                 top-right: LIVE pill (bg=#D0021B, text=white, radius=full)
                 bottom: thin orange line (2px, #FF9900) as accent

Event Card:      bg=#111111, radius=12px, padding=12px 16px
                 left: colored icon circle (4px border matching event type)
                 right: timestamp in --text-tertiary
```

### Input Fields
```
Style:           bg=#1E1E1E, border-bottom=1px #333333, text=white
                 focus: border-bottom=2px #FF9900
                 label: --text-secondary, body-sm, above field
                 No rounded borders on inputs (Adidas flat style)
```

### Navigation
```
Bottom Tab Bar:  bg=#000000, border-top=1px rgba(255,255,255,0.05)
                 Active icon: #FF9900
                 Inactive icon: #666666
                 No labels (icon-only for clean look)
                 Active indicator: small orange dot below icon (4px)
```

---

## Animation Principles

### Core Philosophy
- **Purposeful**: Every animation must have a reason (feedback, transition, celebration)
- **Fast**: Interactions = 150-250ms. Transitions = 300-400ms. Never > 500ms
- **Smooth**: Always use `ease-out` or `cubic-bezier(0.25, 0.1, 0.25, 1)`
- **Subtle**: Micro-animations should enhance, not distract

### Mandatory Animations
| Element | Animation | Duration | Easing |
|---|---|---|---|
| Score change | Scale pulse 1.0→1.2→1.0 + orange flash | 300ms | ease-out |
| New event | Slide up from bottom + fade in | 250ms | ease-out |
| Reaction press | Scale 1.0→0.9→1.15→1.0 (bounce) | 200ms | spring |
| Reaction emoji fly | Float upward + fade out | 800ms | ease-out |
| Leaderboard rank change | Smooth position swap Y-axis | 400ms | ease-in-out |
| Live indicator | Red dot pulse opacity 0.4→1.0 | 1500ms | infinite |
| Points earned | "+100" text float up + fade | 600ms | ease-out |
| Modal open | Slide up from bottom + backdrop fade | 300ms | ease-out |
| Card press | Scale 0.98 + darken 5% | 100ms | ease-out |
| Prediction lock | Shake + checkmark appear | 400ms | spring |
| Goal celebration | Full screen golden particles + vibration | 2000ms | ease-out |

### Transition Patterns (React Native)
```typescript
// Use Reanimated 2 for all animations
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  Easing 
} from 'react-native-reanimated';

// Standard spring config for interactive elements
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

// Standard timing for transitions
const TIMING_CONFIG = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};
```

---

## Iconography
- Use **Phosphor Icons** (React Native) — clean, consistent, sport-appropriate
- Icon size: 24px default, 20px small, 28px large
- Icon color follows text color hierarchy
- Emoji for match events: ⚽ 🟨 🟥 🔔 🏁 🔄 🚩

---

## Responsive Rules
- Base design: 390px width (iPhone 14)
- All layouts must work 360px–430px
- Web demo: max-width 430px centered (simulates mobile for jury)
- Touch targets: minimum 44x44px (Apple HIG)
- Safe area padding: 48px top, 34px bottom (notch/home indicator)

---

## ANTI-PATTERNS (NEVER DO)
- ❌ Light backgrounds anywhere
- ❌ Default system fonts
- ❌ Sharp corners on cards (always radius)
- ❌ Plain blue, green, or purple as accent colors
- ❌ Thin/light weight text on dark backgrounds
- ❌ Animations longer than 500ms for interactions
- ❌ Static leaderboard (must animate rank changes)
- ❌ Placeholder images or Lorem Ipsum text
- ❌ Flat design without any depth (use subtle shadows)
- ❌ Cluttered screens with too many elements
