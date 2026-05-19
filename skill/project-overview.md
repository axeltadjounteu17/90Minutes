# 90Minutes — Project Overview

## What is 90Minutes?
90Minutes is a real-time, multiplayer "second-screen" mobile application for Bundesliga football fans. It allows groups of fans to experience a live match together through predictions, emoji reactions, and a real-time leaderboard — even without watching the match on TV.

## Hackathon Context
- **Competition**: AWS World Sports Innovation Cup 2026 (adidas x AWS x DFL)
- **Challenge**: Challenge 3 — Fan Squad
- **Deadline**: May 17, 2026
- **Target Personas**: Chloe (casual social fan) & Markus (stats-focused fan)

## 3 Mandatory Pillars (by priority)
1. **Multiplayer** — Shared rooms via AWS WebSocket API Gateway
2. **Real-time Data** — DFL XML match events (goals, cards, halftime) streamed live
3. **Gamification** — Score predictions, emoji reactions, leaderboard with points

## Tech Stack
| Layer | Technology | Language |
|---|---|---|
| Mobile App | React Native + Expo | TypeScript |
| Backend Infra | AWS CDK | TypeScript |
| Lambda Functions | Node.js 20 runtime | TypeScript/JS |
| Database | AWS DynamoDB | — |
| Real-time | AWS API Gateway WebSocket | — |
| Auth | AWS Cognito | — |
| AI Narration | AWS Bedrock (Claude Haiku) | — |
| Match Simulator | Python 3.11+ | Python |

## Project Structure
```
fan-squad/
├── emitter/               ← Python match simulator
│   ├── parser.py          ← XML parser for DFL data
│   ├── emitter.py         ← WebSocket event emitter
│   └── data/
│       ├── events.xml     ← DFL match events
│       ├── kpi.xml        ← KPI data with xG, speed, etc.
│       └── match_info.xml ← Teams, players, stadium info
├── infrastructure/        ← AWS CDK (TypeScript)
│   └── lib/
│       └── fan-squad-stack.ts
├── functions/             ← Lambda functions (Node.js)
│   ├── connect.js
│   ├── disconnect.js
│   ├── matchEvent.js
│   ├── prediction.js
│   ├── reaction.js
│   ├── broadcast.js
│   └── utils.js
└── app/                   ← React Native Expo
    └── src/
        ├── screens/
        ├── components/
        ├── hooks/
        ├── services/
        └── constants/
```

## Key DFL Data Format
Match events are XML with this structure:
- `<Event EventId="..." MatchId="DFL-MAT-111111" EventTime="...">`
  - `<ShotAtGoal xG="0.23" PlayerSpeed="19.5">` → contains `<SuccessfulShot CurrentResult="2:0"/>`
  - `<Caution CardColor="yellow" Player="DFL-OBJ-000027"/>`
  - `<FinalWhistle GameSection="firstHalf"/>`
  - `<Substitution PlayerOut="..." PlayerIn="..."/>`
  - `<Foul FoulType="foul"/>`

## Important Rules
- All code produced belongs to adidas (Article 8 of T&Cs)
- Use generic/reusable components when possible
- App language: French UI, English code
- Dark theme by default
- Brand colors: Adidas Black #000000, Bundesliga Red #D0021B, AWS Orange #FF9900
