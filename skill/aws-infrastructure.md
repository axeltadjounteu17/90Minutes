# Fan Squad — AWS Infrastructure Spec

## Overview
All backend infrastructure is deployed via AWS CDK (TypeScript). The stack is named `FanSquadStack`.

## AWS Services Used

### 1. API Gateway WebSocket
- **Purpose**: Real-time bidirectional communication between app and backend
- **Stage**: `prod`
- **Routes**:
  | Route Key | Lambda Handler | Description |
  |---|---|---|
  | `$connect` | `connect.js` | Registers player connection in DynamoDB |
  | `$disconnect` | `disconnect.js` | Removes connection, updates player count |
  | `sendMatchEvent` | `matchEvent.js` | Receives DFL events from Python emitter |
  | `sendPrediction` | `prediction.js` | Registers fan score prediction |
  | `sendReaction` | `reaction.js` | Registers fan emoji reaction |

### 2. DynamoDB Tables

#### Table: `FanSquad-GameState`
- **Purpose**: Stores match state for each room
- **Partition Key**: `roomId` (String) — e.g. `"ROOM#abc123"`
- **Sort Key**: `matchId` (String) — e.g. `"MATCH#DFL-MAT-111111"`
- **Attributes**:
  ```
  currentScore    : String    — "2:1"
  matchMinute     : Number    — 67
  matchStatus     : String    — "waiting" | "live" | "halftime" | "finished"
  homeTeam        : String    — "FC Team"
  homeCode        : String    — "FCT"
  guestTeam       : String    — "Club"
  guestCode       : String    — "CLU"
  lastEvent       : Map       — { type, emoji, title, message, kpis, narrative }
  eventFeed       : List      — last 10 events
  connectedTotal  : Number    — 5
  updatedAt       : Number    — timestamp ms
  ```

#### Table: `FanSquad-Players`
- **Purpose**: Stores player state within a room
- **Partition Key**: `roomPlayerId` (String) — e.g. `"ROOM#abc123#user#axel42"`
- **GSI**: `roomId-index` on `roomId` attribute (for querying all players in a room)
- **Attributes**:
  ```
  roomId          : String    — "ROOM#abc123" (GSI partition key)
  userId          : String    — "axel42"
  username        : String    — "Axel"
  connectionId    : String    — WebSocket connection ID
  prediction      : Map       — { homeScore: 2, awayScore: 0 }
  halfPrediction  : Map       — { homeScore: 1, awayScore: 0 }
  points          : Number    — 150
  reactions       : Number    — 7
  badges          : List      — ["first_blood", "in_the_zone"]
  joinedAt        : Number    — timestamp ms
  ```

### 3. AWS Cognito
- **UserPool**: `FanSquad-Users`
- **Self sign-up**: Enabled
- **Auth flow**: USER_PASSWORD_AUTH
- **Required attributes**: email
- **App Client**: `FanSquad-AppClient` (no secret for mobile)

### 4. AWS Bedrock
- **Model**: `anthropic.claude-3-haiku-20240307-v1:0`
- **Region**: `us-east-1`
- **Usage**: Generate 15-word casual narrations for GOAL events
- **Fallback**: If Bedrock fails, use static template text

## Lambda Function Patterns

### All Lambdas must:
- Use Node.js 20 runtime
- Have read/write access to both DynamoDB tables
- Log to CloudWatch
- Return proper WebSocket response format: `{ statusCode: 200, body: 'OK' }`
- Handle errors gracefully with try/catch

### matchEvent Lambda specifically must:
- Have `execute-api:ManageConnections` permission (to broadcast via WebSocket)
- Call Bedrock for GOAL events
- Update GameState table
- Calculate prediction points on GOAL events
- Broadcast enriched event to all connected clients

### broadcast Lambda must:
- Have `execute-api:ManageConnections` permission
- Query all connectionIds from Players table by roomId
- Use `ApiGatewayManagementApi.postToConnection()` for each client
- Handle stale connections (delete if GoneException)

## CDK Output Variables
After `cdk deploy`, these outputs must be available:
- `WebSocketURL` — wss://xxx.execute-api.us-east-1.amazonaws.com/prod
- `UserPoolId` — Cognito User Pool ID
- `UserPoolClientId` — Cognito App Client ID
- `GameStateTableName` — DynamoDB table name
- `PlayersTableName` — DynamoDB table name

## Deploy Command
```bash
cd infrastructure
cdk deploy --outputs-file ../app/src/constants/aws-outputs.json
```
