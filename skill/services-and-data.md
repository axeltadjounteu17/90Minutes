# 90Minutes — AWS Services Map & Data Management

## COMPLETE AWS SERVICES MAP

### Services Used — What, Why, and How

```
┌─────────────────────────────────────────────────────────────────┐
│                     90MINUTES AWS ARCHITECTURE                   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   COGNITO    │  │  API GATEWAY │  │      BEDROCK          │  │
│  │  User Pool   │  │  WebSocket   │  │  Claude 3 Haiku       │  │
│  │  Auth flows  │  │  5 routes    │  │  AI Narration         │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘  │
│         │                 │                       │              │
│         │    ┌────────────▼────────────┐          │              │
│         │    │       LAMBDA x6         │◄─────────┘              │
│         │    │  connect, disconnect    │                         │
│         │    │  matchEvent, prediction │                         │
│         │    │  reaction, broadcast    │                         │
│         │    └────────────┬────────────┘                         │
│         │                 │                                      │
│         │    ┌────────────▼────────────┐                         │
│         │    │      DYNAMODB x2        │                         │
│         │    │  GameState + Players    │                         │
│         │    └────────────┬────────────┘                         │
│         │                 │                                      │
│         │    ┌────────────▼────────────┐                         │
│         │    │     CLOUDWATCH          │                         │
│         │    │  Logs + Monitoring      │                         │
│         │    └─────────────────────────┘                         │
│         │                                                        │
│  ┌──────▼───────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   AMPLIFY    │  │       S3         │  │   CLOUDFRONT     │  │
│  │  Hosting     │  │  Static assets   │  │   CDN delivery   │  │
│  └──────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 1. AWS Cognito — Authentication

| Property | Value |
|---|---|
| **Service** | Amazon Cognito User Pool |
| **Purpose** | User registration, login, token management |
| **Pool name** | `90Minutes-Users` |
| **Self sign-up** | Enabled |
| **Auth flow** | `USER_PASSWORD_AUTH` |
| **Required attrs** | email |
| **Optional attrs** | preferred_username (fan name) |
| **Password policy** | Min 8 chars, uppercase, lowercase, number |
| **MFA** | Disabled (hackathon simplicity) |
| **App client** | `90Minutes-AppClient` (no secret — mobile app) |
| **Token expiry** | Access: 1h, Refresh: 30d |

**Frontend usage:**
```typescript
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const userPool = new CognitoUserPool({
  UserPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID!,
  ClientId: process.env.EXPO_PUBLIC_CLIENT_ID!,
});
```

---

### 2. API Gateway — WebSocket Real-Time

| Property | Value |
|---|---|
| **Service** | Amazon API Gateway (WebSocket API) |
| **Purpose** | Bidirectional real-time communication |
| **Protocol** | WSS (TLS encrypted) |
| **Stage** | `prod` |
| **URL format** | `wss://XXXXXXXX.execute-api.eu-central-1.amazonaws.com/prod` |

**Routes:**
| Route | Direction | Lambda | Description |
|---|---|---|---|
| `$connect` | Client→Server | `connect` | Register new WebSocket connection |
| `$disconnect` | Client→Server | `disconnect` | Clean up on disconnect |
| `sendMatchEvent` | Emitter→Server | `matchEvent` | Push DFL event from Python |
| `sendPrediction` | Client→Server | `prediction` | Submit score prediction |
| `sendReaction` | Client→Server | `reaction` | Submit emoji reaction |

**Connection params (query string on connect):**
```
wss://xxx.execute-api.../prod?roomId=ROOM_demo&userId=axel42&username=Axel
```

---

### 3. AWS Lambda — Serverless Logic

| Function | Runtime | Memory | Timeout | Purpose |
|---|---|---|---|---|
| `connect` | Node.js 20 | 128 MB | 5s | Save connectionId + userId to Players table |
| `disconnect` | Node.js 20 | 128 MB | 5s | Remove connection, decrement player count |
| `matchEvent` | Node.js 20 | 256 MB | 10s | Process DFL event, update score, call Bedrock, broadcast |
| `prediction` | Node.js 20 | 128 MB | 5s | Validate & store prediction, award participation points |
| `reaction` | Node.js 20 | 128 MB | 5s | Store reaction, +1 point, broadcast totals |
| `broadcast` | Node.js 20 | 128 MB | 10s | Send message to all connections in a room |

**IAM Permissions per Lambda:**
| Lambda | DynamoDB | API GW Manage | Bedrock |
|---|---|---|---|
| connect | Read/Write Players, Read/Write GameState | ❌ | ❌ |
| disconnect | Read/Write Players, Read/Write GameState | ❌ | ❌ |
| matchEvent | Read/Write both tables | ✅ ManageConnections | ✅ InvokeModel |
| prediction | Read/Write Players | ✅ ManageConnections | ❌ |
| reaction | Read/Write Players | ✅ ManageConnections | ❌ |
| broadcast | Read Players | ✅ ManageConnections | ❌ |

---

### 4. Amazon DynamoDB — Database

| Property | Value |
|---|---|
| **Tables** | 2 (GameState + Players) |
| **Billing** | On-demand (PAY_PER_REQUEST) — no capacity planning needed |
| **Region** | us-east-1 (N. Virginia) — SANDBOX RESTRICTION |
| **Encryption** | AWS-managed (default) |
| **Point-in-time recovery** | Disabled (hackathon) |

---

### 5. Amazon Bedrock — AI Narration

| Property | Value |
|---|---|
| **Model** | `anthropic.claude-3-haiku-20240307-v1:0` |
| **Region** | eu-central-1 |
| **Max tokens** | 100 |
| **Temperature** | 0.8 (creative but focused) |
| **Usage** | Generate casual 15-word narrations on GOAL events |
| **Cost est.** | ~$0.001 per narration (negligible) |
| **Fallback** | Static template if Bedrock times out (2s timeout) |

---

### 6. AWS CloudWatch — Monitoring

| What | Where |
|---|---|
| Lambda logs | `/aws/lambda/90Minutes-*` |
| API Gateway logs | `/aws/apigateway/90Minutes-WebSocket` |
| Key metrics | Lambda invocations, errors, duration |
| Alarms | Not configured (hackathon) |

---

### 7. AWS Amplify / S3 / CloudFront (Optional for Web demo)

| Service | Purpose |
|---|---|
| S3 | Host Expo web build static files |
| CloudFront | CDN for fast delivery to jury |
| Amplify | Alternative: one-click deploy from git |

---

## DATA FLOW — END TO END

```
1. STARTUP
   User opens app → Cognito authentication → JWT token
   → App connects to WebSocket with token + roomId + userId

2. MATCH START
   Python emitter reads XML → sends MATCH_START to WebSocket
   → Lambda:matchEvent creates GameState entry in DynamoDB
   → Broadcasts match info to all connected clients

3. DURING MATCH (for each event)
   Emitter sends event (GOAL/CARD/etc.) → Lambda:matchEvent
   → Updates GameState (score, minute, status)
   → IF GOAL: calls Bedrock for narration
   → IF GOAL: checks predictions, awards points
   → Broadcasts enriched event to all clients via WebSocket
   → App renders event in feed with animation

4. FAN INTERACTIONS
   Fan taps Predict → Client sends prediction via WebSocket
   → Lambda:prediction validates + stores in Players table
   → Awards +5 participation points
   → Broadcasts updated leaderboard

   Fan taps Reaction → Client sends emoji via WebSocket
   → Lambda:reaction increments reaction count + points
   → Broadcasts room reaction totals

5. MATCH END
   Emitter sends FULLTIME → Lambda:matchEvent
   → Calculates final prediction scores for ALL players
   → Awards bonus points (exact score, correct winner, etc.)
   → Broadcasts final leaderboard + results
   → Updates GameState status to "finished"
```

---

## DATA LIFECYCLE

| Data | Created when | Updated when | Deleted when |
|---|---|---|---|
| GameState | Room is created | Every match event | Never (archive) |
| Player entry | Fan joins room | Prediction, reaction, points | Fan disconnects (connectionId cleared) |
| Connection | WebSocket $connect | Never | WebSocket $disconnect or stale |
| Prediction | Fan submits | Never (immutable once locked) | Never |
| Points | First action | Every scored action | Never |

---

## ENVIRONMENT VARIABLES

### Lambda Environment
```
GAMESTATE_TABLE_NAME=90Minutes-GameState
PLAYERS_TABLE_NAME=90Minutes-Players
WEBSOCKET_ENDPOINT=https://XXXXXXXX.execute-api.us-east-1.amazonaws.com/prod
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

### Expo App Environment (.env)
```
EXPO_PUBLIC_WS_URL=wss://XXXXXXXX.execute-api.us-east-1.amazonaws.com/prod
EXPO_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXX
EXPO_PUBLIC_CLIENT_ID=XXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_API_REGION=us-east-1
```

### Python Emitter Environment
```
WEBSOCKET_URL=wss://XXXXXXXX.execute-api.us-east-1.amazonaws.com/prod
SPEED_MULTIPLIER=60
DATA_DIR=./data
```

---

## RULES

1. **All table names from env vars** — never hardcode in Lambda code
2. **WebSocket URL from env var** — changes on each `cdk deploy`
3. **Bedrock has a 2s timeout** — if it fails, use fallback template
4. **Atomic DynamoDB writes** — use `ADD` for points, never read-then-write
5. **Clean up stale connections** — on GoneException, delete from Players table
6. **Log everything** — every Lambda logs: input, action, result, errors
7. **Cost awareness** — On-demand DynamoDB + 128MB Lambdas = minimal cost
