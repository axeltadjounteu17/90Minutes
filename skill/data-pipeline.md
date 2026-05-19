# Fan Squad — Data Pipeline & WebSocket Protocol

## OVERVIEW
The data pipeline transforms raw DFL XML files into real-time fan-facing events:
```
XML Files → Python Parser → Python Emitter → WebSocket → Lambda → DynamoDB → Broadcast → App
```

---

## XML DATA SOURCE FILES

### events.xml (Events_Anonym.xml)
- **Size**: ~824 KB, ~7700 events
- **Match**: DFL-MAT-111111
- **Content**: Every on-pitch action (passes, tackles, shots, fouls, goals, cards)
- **Key tags for Fan Squad**:
  | XML Tag | Fan Event | Priority |
  |---|---|---|
  | `<ShotAtGoal>` + `<SuccessfulShot>` | ⚽ GOAL | 🔴 Critical |
  | `<Caution CardColor="yellow/red">` | 🟨🟥 CARD | 🔴 Critical |
  | `<FinalWhistle GameSection="firstHalf">` | 🔔 HALFTIME | 🔴 Critical |
  | `<FinalWhistle GameSection="secondHalf">` | 🏁 FULLTIME | 🔴 Critical |
  | `<Substitution>` | 🔄 SUB | 🟡 Medium |
  | `<Offside>` | 🚩 OFFSIDE | 🟢 Low |
  | `<ShotAtGoal>` without `<SuccessfulShot>` | 💨 SHOT_MISSED | 🟡 Medium |
  | `<Foul>` | ⚠️ FOUL | 🟢 Low |

### match_info.xml (MatchInformations_Anonym.xml)
- **Size**: ~11 KB
- **Content**: Static metadata
- **Key data**: Team names, codes, player roster (PersonId → ShortName, Position, ShirtNumber), stadium, referee, weather

### kpi.xml (kpi_data_Bayern_Hamburg.xml)
- **Same content as events.xml** — duplicate with identical events
- **Usage**: Not needed separately. Use events.xml as primary source.

---

## PARSER OUTPUT FORMAT

The Python parser must produce this JSON structure for each event:

```json
{
  "eventId": "18902400000048",
  "matchId": "DFL-MAT-111111",
  "eventTime": "2025-01-01T16:32:57.129+02:00",
  "type": "GOAL",
  "matchMinute": 3,
  "relativeDelaySec": 159.919,
  "data": {
    "player": "Spieler Fünf",
    "teamId": "DFL-CLU-000001",
    "currentScore": "1:0",
    "goalZone": 2,
    "xG": 0.0308,
    "playerSpeed": 18.48,
    "pressure": 0.36,
    "distanceToGoal": 18.77,
    "typeOfShot": "rightLeg",
    "solo": true
  }
}
```

---

## WEBSOCKET PROTOCOL

### Client → Server Messages

#### 1. Join Room (on $connect)
```json
// Sent as query parameter: ?roomId=ROOM_abc123&userId=axel42&username=Axel
```

#### 2. Send Prediction
```json
{
  "action": "sendPrediction",
  "roomId": "ROOM#abc123",
  "matchId": "MATCH#DFL-MAT-111111",
  "prediction": {
    "homeScore": 2,
    "awayScore": 0
  },
  "predictionType": "pre-match"
}
```

#### 3. Send Reaction
```json
{
  "action": "sendReaction",
  "roomId": "ROOM#abc123",
  "emoji": "🔥",
  "eventId": "18902400000048"
}
```

#### 4. Send Match Event (from Python Emitter only)
```json
{
  "action": "sendMatchEvent",
  "type": "GOAL",
  "matchMinute": 3,
  "matchId": "DFL-MAT-111111",
  "timestamp": "2025-01-01T16:32:57.129+02:00",
  "emoji": "⚽",
  "title": "BUUUUT ! 1:0",
  "message": "Spieler Fünf marque à la 3'",
  "score": "1:0",
  "kpis": {
    "xG": 0.03,
    "playerSpeed": 18.5,
    "goalZone": 2,
    "pressure": 0.36
  },
  "triggersReaction": true,
  "triggersPrediction": false
}
```

### Server → Client Messages (Broadcast)

#### Match Event Broadcast
```json
{
  "type": "MATCH_EVENT",
  "event": {
    "type": "GOAL",
    "matchMinute": 3,
    "emoji": "⚽",
    "title": "BUUUUT ! 1:0",
    "message": "Spieler Fünf marque à la 3'",
    "score": "1:0",
    "kpis": { "xG": 0.03, "playerSpeed": 18.5 },
    "narrative": "⚡ Tir de folie à 18km/h, seul face au gardien — imparable !"
  }
}
```

#### Leaderboard Update Broadcast
```json
{
  "type": "LEADERBOARD_UPDATE",
  "leaderboard": [
    { "userId": "axel42", "username": "Axel", "points": 150, "rank": 1 },
    { "userId": "chloe99", "username": "Chloe", "points": 80, "rank": 2 }
  ]
}
```

#### Prediction Result Broadcast
```json
{
  "type": "PREDICTION_RESULT",
  "results": [
    {
      "userId": "axel42",
      "prediction": "2:0",
      "actual": "2:1",
      "pointsEarned": 30,
      "reason": "correct_winner"
    }
  ]
}
```

#### Reaction Broadcast
```json
{
  "type": "REACTION",
  "userId": "chloe99",
  "username": "Chloe",
  "emoji": "🔥",
  "totalReactions": { "⚽": 3, "😱": 7, "🔥": 12, "💀": 1 }
}
```

---

## POINTS SYSTEM

### Prediction Points (calculated on GOAL and FULLTIME events)
| Condition | Points |
|---|---|
| Exact score predicted | +100 |
| Correct winning team | +30 |
| Correct goal difference | +20 |
| Correct total goals | +10 |

### Interaction Points
| Action | Points |
|---|---|
| Submit a prediction | +5 |
| React to an event | +1 |
| First reaction in room | +5 (bonus) |

### Badge Triggers
| Badge | Condition |
|---|---|
| 🎯 Sniper | Predicted exact score |
| 🔥 In The Zone | 5+ reactions in a single match |
| 🏆 Champion | Finished #1 in a room |
| ⚡ First Blood | Submitted first prediction ever |
| 👁️ Assidu | Followed 3+ matches |
| 🤝 Squad Goals | Joined room with 5+ fans |

---

## EMITTER SPEED CONFIG

| Mode | SPEED_MULTIPLIER | MIN_DELAY | Full match duration |
|---|---|---|---|
| Demo (jury) | 60 | 0.2s | ~90 seconds |
| Test | 10 | 0.3s | ~9 minutes |
| Realistic | 5 | 0.5s | ~18 minutes |
| Real-time | 1 | 1.0s | ~90 minutes |

For the jury demo, use `SPEED_MULTIPLIER = 60` to replay the entire match in ~90 seconds.

---

## ERROR HANDLING & FALLBACKS

### WebSocket Disconnection
- Client auto-reconnects after 2s, 4s, 8s (exponential backoff, max 30s)
- Show "Reconnecting..." orange banner at top of Dashboard
- Buffer last 5 events locally to prevent data loss

### Bedrock Failure
- If AI narration fails, use template fallback:
  - GOAL: `"⚽ {player} ouvre le score à la {minute}' !"`
  - CARD: `"🟨 Carton pour {player} — tension sur le terrain !"`
  - HALFTIME: `"🔔 Pause ! Prédis la suite !"`

### DynamoDB Throttling
- Use exponential backoff on DynamoDB writes
- Batch reaction writes if > 10/second in same room

### Stale WebSocket Connections
- On `GoneException` from `postToConnection`, delete the connection from Players table
- Log the cleanup for monitoring
