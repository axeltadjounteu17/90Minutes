# Fan Squad — Coding Standards & Security

## GOLDEN RULES
Every line of code generated for Fan Squad MUST follow these principles:
1. **Secure by default** — Never trust user input, always validate, always sanitize
2. **Clean & readable** — Code is read 10x more than written. Clarity over cleverness
3. **Production-grade** — No shortcuts, no TODO hacks, no console.log in production
4. **Type-safe** — TypeScript strict mode everywhere, no `any` type unless absolutely necessary

---

## Security Standards

### Input Validation (CRITICAL)
```typescript
// ❌ NEVER DO THIS
const roomId = event.body.roomId;
db.get({ Key: { roomId } });

// ✅ ALWAYS DO THIS
import { z } from 'zod';

const PredictionSchema = z.object({
  roomId: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
});

const parsed = PredictionSchema.safeParse(JSON.parse(event.body));
if (!parsed.success) {
  return { statusCode: 400, body: 'Invalid input' };
}
```

### WebSocket Security
- Always validate `connectionId` exists before broadcasting
- Remove stale connections (handle `GoneException` from API Gateway)
- Rate-limit reactions: max 1 per second per user (use DynamoDB conditional write)
- Never expose internal IDs (DynamoDB keys) to the client

### Lambda Security
- Use least-privilege IAM policies (only the permissions each Lambda needs)
- Environment variables for sensitive values (table names, API URLs)
- Never hardcode AWS credentials
- Set Lambda timeout to 10s max (prevent runaway costs)
- Enable X-Ray tracing for debugging

### React Native Security
- Store tokens in SecureStore (not AsyncStorage)
- Never store passwords locally
- Validate all WebSocket messages before processing
- Sanitize any user-generated content before display (usernames, room names)

### DynamoDB Security
- Use conditional writes to prevent race conditions on points
- Use `UpdateExpression` with `ADD` for atomic point increments (never read-then-write)
```typescript
// ✅ Atomic point increment — race-condition safe
await dynamodb.update({
  TableName: PLAYERS_TABLE,
  Key: { roomPlayerId },
  UpdateExpression: 'ADD points :pts, reactions :one',
  ExpressionAttributeValues: { ':pts': 10, ':one': 1 },
});
```

---

## Code Quality Standards

### TypeScript Conventions
- **Strict mode**: `"strict": true` in all tsconfig.json
- **No `any`**: Use proper types or `unknown` with type guards
- **Interfaces over types** for object shapes
- **Enums** for fixed sets of values (event types, match status)

```typescript
// ✅ Proper enum for event types
enum MatchEventType {
  GOAL = 'GOAL',
  CARD = 'CARD',
  HALFTIME = 'HALFTIME',
  FULLTIME = 'FULLTIME',
  SUBSTITUTION = 'SUBSTITUTION',
  OFFSIDE = 'OFFSIDE',
}

// ✅ Proper interface for match event
interface MatchEvent {
  type: MatchEventType;
  matchMinute: number;
  matchId: string;
  timestamp: string;
  emoji: string;
  title: string;
  message: string;
  kpis?: EventKPIs;
  triggersReaction: boolean;
  triggersPrediction: boolean;
}

interface EventKPIs {
  xG: number;
  playerSpeed: number;
  goalZone: number;
  pressure: number;
  distanceToGoal: number;
}
```

### Naming Conventions
| Element | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `MatchDashboard.tsx` |
| Files (hooks) | camelCase with `use` | `useWebSocket.ts` |
| Files (utils) | camelCase | `formatScore.ts` |
| Files (Lambda) | camelCase | `matchEvent.js` |
| Variables | camelCase | `matchMinute` |
| Constants | UPPER_SNAKE_CASE | `MAX_PREDICTIONS` |
| Interfaces | PascalCase, prefix I only if needed | `MatchEvent` |
| Enums | PascalCase | `MatchStatus` |
| Components | PascalCase | `LeaderboardRow` |
| CSS classes | kebab-case or BEM | `match-card__score` |

### Error Handling
```typescript
// ✅ Every Lambda must have this pattern
export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // ... business logic
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error('[matchEvent] Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

// ✅ Every React component must handle loading/error states
function MatchDashboard() {
  const { data, error, isLoading } = useMatchData();
  
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  return <DashboardContent data={data} />;
}
```

### Comments
- Write comments for WHY, not WHAT
- JSDoc on all exported functions
- No commented-out code in production
```typescript
// ❌ Bad comment
// increment points by 100
points += 100;

// ✅ Good comment
// Award full points because user predicted the exact score
points += EXACT_PREDICTION_BONUS;
```

### Performance
- Memoize expensive components with `React.memo()`
- Use `useMemo` and `useCallback` for WebSocket handlers
- Debounce reaction buttons (300ms)
- Lazy load screens with `React.lazy()` / Expo Router lazy
- Keep Lambda cold start < 500ms (minimize imports)

---

## Python Standards (Emitter)
- Use type hints on all functions
- Use `dataclass` or `TypedDict` for structured data
- Handle XML parsing errors gracefully
- Use `logging` module instead of `print()` in production
- Validate XML structure before accessing attributes
