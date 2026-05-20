/**
 * 90Minutes — startDemo Lambda (v4 — Asynchronous & Real DFL Data)
 * POST /start-demo
 *
 * Replays the REAL Bundesliga match from Events_Anonym.xml.
 * FC Team (FCT) 5:0 Club (CLU) — Bundesliga Journée 1.
 *
 * Runs asynchronously via Lambda self-invocation to bypass API Gateway 29-second timeout.
 * Paced at ~6 seconds per event for a realistic live demo experience.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
const { QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
const lambdaClient = new LambdaClient({ region: 'us-east-1' });

const ROOMS_TABLE = process.env.ROOMS_TABLE_NAME || '90Minutes-Rooms';
const PLAYERS_TABLE = process.env.PLAYERS_TABLE_NAME || '90Minutes-Players';
const GAMESTATE_TABLE = process.env.GAMESTATE_TABLE_NAME || '90Minutes-GameState';

const FALLBACK = {
  GOAL: '⚽ But ! Le stade explose !',
  YELLOW_CARD: '🟡 Carton jaune ! Tension sur le terrain.',
  RED_CARD: '🔴 Rouge ! Expulsion directe !',
  HALFTIME: '⏱️ Mi-temps. Pause tactique.',
  FULLTIME: '🏁 Coup de sifflet final !',
  SUBSTITUTION: '🔄 Changement effectué.',
  MATCH_START: '⚽ Coup d\'envoi ! C\'est parti !',
  FOUL: '⚠️ Faute sifflée.',
  SHOT_BLOCKED: '🛡️ Tir bloqué par la défense !',
  KICKOFF_2ND: '⚽ La seconde mi-temps commence !',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Paced at ~6 seconds per event for a great demo experience where users can react and make predictions.
const DEMO_EVENTS = [
  {
    wait: 500,
    type: 'MATCH_START',
    matchMinute: 0,
    matchInfo: {
      homeTeam: 'FC Team', homeCode: 'FCT',
      guestTeam: 'Club', guestCode: 'CLU',
    },
    kpi: 'Bundesliga J1, Muster Stadion, 75000 spectateurs, sold out',
  },
  {
    wait: 10000,
    type: 'YELLOW_CARD',
    matchMinute: 1,
    message: 'S. Sieben (CLU)',
    kpi: 'faute sur S. Acht, tacle dangereux',
  },
  {
    wait: 10000,
    type: 'SHOT_BLOCKED',
    matchMinute: 2,
    message: 'S. Acht (FCT)',
    kpi: 'coup franc direct, xG=0.04, distance=23m, bloqué par S. Elf (CLU)',
  },
  {
    wait: 10000,
    type: 'GOAL',
    matchMinute: 3,
    score: '1:0',
    message: 'S. Fünf (FCT)',
    kpi: 'passe décisive de S. Neun, xG=0.03, vitesse=18.48km/h, solo dribble inside box, 0 défenseurs',
  },
  {
    wait: 10000,
    type: 'GOAL',
    matchMinute: 9,
    score: '2:0',
    message: 'S. Elf (FCT)',
    kpi: 'passe décisive directe de S. Sechs, xG=0.23, vitesse=23.78km/h, tir pied droit, 1 défenseur',
  },
  {
    wait: 10000,
    type: 'FOUL',
    matchMinute: 18,
    message: 'Penalty pour FC Team !',
    kpi: 'faute dans la surface, arbitre siffle penalty',
  },
  {
    wait: 10000,
    type: 'GOAL',
    matchMinute: 21,
    score: '3:0',
    message: 'S. Sechs (FCT)',
    kpi: 'PENALTY transformé, xG=0.77, pied droit, targeted shot, pas de pression',
  },
  {
    wait: 10000,
    type: 'YELLOW_CARD',
    matchMinute: 22,
    message: 'S. Zwei (FCT)',
    kpi: 'carton après avantage, faute tactique',
  },
  {
    wait: 10000,
    type: 'GOAL',
    matchMinute: 24,
    score: '4:0',
    message: 'S. Sieben (FCT)',
    kpi: 'passe de S. Vier après coup franc, xG=0.03, déviation sur S. Zehn (CLU), vitesse=14.54km/h',
  },
  {
    wait: 10000,
    type: 'HALFTIME',
    matchMinute: 45,
    kpi: 'Score mi-temps: 4:0, domination totale de FC Team',
  },
  {
    wait: 10000,
    type: 'SUBSTITUTION',
    matchMinute: 46,
    message: 'CLU: Sieben→Sechzehn, Elf→Achtzehn, Acht→Neunzehn | FCT: Fünf→Sechzehn, Zwei→Achtzehn',
    kpi: '5 changements à la mi-temps, les deux coachs réajustent',
  },
  {
    wait: 10000,
    type: 'GOAL',
    matchMinute: 68,
    score: '5:0',
    message: 'S. Sechs (FCT)',
    kpi: 'passe de S. Acht, xG=0.12, CONTRE-ATTAQUE, déviation du gardien S. Eins (CLU), vitesse=13.62km/h',
  },
  {
    wait: 10000,
    type: 'SUBSTITUTION',
    matchMinute: 69,
    message: 'FCT: Achtzehn→Siebzehn, Sechs→Zwanzig',
    kpi: 'double changement tactique FCT',
  },
  {
    wait: 10000,
    type: 'SUBSTITUTION',
    matchMinute: 78,
    message: 'CLU: Drei→Siebzehn, Fünf→Zwanzig | FCT: Sieben→Neunzehn',
    kpi: '3 changements, dernières rotations',
  },
  {
    wait: 10000,
    type: 'YELLOW_CARD',
    matchMinute: 86,
    message: 'S. Neun (CLU)',
    kpi: 'faute d\'anti-jeu en fin de match',
  },
  {
    wait: 8000,
    type: 'FULLTIME',
    matchMinute: 90,
    finalScore: '5:0',
    kpi: 'Victoire écrasante 5:0, FC Team domine la Journée 1 de Bundesliga',
  },
];

const DEFAULT_MATCH_ID = 'MATCH#DFL-MAT-111111';

const NARRATED_TYPES = [
  'MATCH_START', 'GOAL', 'YELLOW_CARD', 'RED_CARD',
  'HALFTIME', 'FULLTIME', 'SUBSTITUTION', 'FOUL',
  'SHOT_BLOCKED', 'KICKOFF_2ND',
];

// Nova narration — 2.5s timeout
async function generateNarration(eventType, ctx) {
  const fb = FALLBACK[eventType] || '⚽ Action en cours.';
  try {
    const kpiInfo = ctx.kpi ? ` Données KPI: ${ctx.kpi}.` : '';
    const prompt = `Tu es un commentateur sportif enthousiaste français pour un match de Bundesliga. Génère UNE phrase de max 20 mots avec au moins 1 emoji pour cet événement: ${eventType}. Contexte: minute ${ctx.minute || '?'}, joueur: ${ctx.player || 'inconnu'}, score: ${ctx.score || '?'}.${kpiInfo} Réponds UNIQUEMENT avec la phrase, rien d'autre.`;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);

    const cmd = new InvokeModelCommand({
      modelId: 'amazon.nova-micro-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [{ role: 'user', content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 80, temperature: 0.8 },
      }),
    });

    const res = await bedrockClient.send(cmd, { abortSignal: controller.signal });
    clearTimeout(t);

    const parsed = JSON.parse(new TextDecoder().decode(res.body));
    const text = (parsed.output?.message?.content?.[0]?.text || '').trim();
    return text || fb;
  } catch (e) {
    console.warn('[startDemo] Nova fallback for', eventType, e.message);
    return fb;
  }
}

// Broadcast to all WS connections in a room
async function broadcast(roomId, payload, apiGw) {
  const result = await ddb.send(new QueryCommand({
    TableName: PLAYERS_TABLE,
    IndexName: 'roomId-index',
    KeyConditionExpression: 'roomId = :rid',
    ExpressionAttributeValues: { ':rid': roomId },
  }));
  const players = result.Items || [];
  console.log(`[startDemo] Broadcasting ${payload.type} (min ${payload.matchMinute}) to ${players.length} players`);

  await Promise.all(players.map(async (p) => {
    try {
      await apiGw.send(new PostToConnectionCommand({
        ConnectionId: p.connectionId,
        Data: Buffer.from(JSON.stringify(payload)),
      }));
    } catch (err) {
      if (err.statusCode === 410 || err.name === 'GoneException') {
        await ddb.send(new DeleteCommand({
          TableName: PLAYERS_TABLE,
          Key: { roomPlayerId: p.roomPlayerId },
        }));
      } else {
        console.warn('[startDemo] post err', err.message);
      }
    }
  }));
}

// Replay logic executed in the background
async function runReplaySimulation(roomId) {
  const wsEndpoint = process.env.WEBSOCKET_ENDPOINT;
  if (!wsEndpoint) {
    console.error('[startDemo] WS_ENDPOINT_MISSING');
    return;
  }
  const apiGw = new ApiGatewayManagementApiClient({ endpoint: wsEndpoint });
  const matchId = DEFAULT_MATCH_ID;

  console.log(`[startDemo] [Replay Loop] Starting loop for room ${roomId}`);

  // 1. Pre-generate all narrations in parallel at start to avoid synchronous Bedrock overhead in the loop
  console.log('[startDemo] [Replay Loop] Pre-generating AI commentaries in parallel...');
  const narrationPromises = DEMO_EVENTS.map(async (ev) => {
    if (NARRATED_TYPES.includes(ev.type)) {
      return generateNarration(ev.type, {
        minute: ev.matchMinute,
        player: ev.message,
        score: ev.score || ev.finalScore,
        kpi: ev.kpi,
      });
    }
    return null;
  });
  const narrations = await Promise.all(narrationPromises);
  console.log('[startDemo] [Replay Loop] AI commentaries pre-generated successfully.');

  // 2. Sequential replay with 6s pacing
  for (let i = 0; i < DEMO_EVENTS.length; i++) {
    const ev = DEMO_EVENTS[i];

    // Wait BEFORE sending this event
    await sleep(ev.wait);

    // Use pre-generated narration
    const narration = narrations[i];

    // Update GameState in DynamoDB
    try {
      const expr = ['SET matchStatus = :s', 'matchMinute = :m', 'updatedAt = :now'];
      const vals = {
        ':s': ev.type === 'HALFTIME' ? 'halftime' : (ev.type === 'FULLTIME' ? 'finished' : 'live'),
        ':m': ev.matchMinute || 0,
        ':now': Date.now(),
      };
      if (ev.score) { expr.push('currentScore = :sc'); vals[':sc'] = ev.score; }
      if (ev.finalScore) { expr.push('currentScore = :fs'); vals[':fs'] = ev.finalScore; }
      if (ev.matchInfo) {
        expr.push('homeTeam = :ht', 'guestTeam = :gt');
        vals[':ht'] = ev.matchInfo.homeTeam;
        vals[':gt'] = ev.matchInfo.guestTeam;
      }
      await ddb.send(new UpdateCommand({
        TableName: GAMESTATE_TABLE,
        Key: { roomId, matchId },
        UpdateExpression: expr.join(', '),
        ExpressionAttributeValues: vals,
      }));
    } catch (e) {
      console.warn('[startDemo] state update warn', e.message);
    }

    // Broadcast event to all connected clients
    const payload = {
      type: ev.type,
      matchMinute: ev.matchMinute,
      score: ev.score,
      finalScore: ev.finalScore,
      message: ev.message,
      matchInfo: ev.matchInfo,
      narration,
      kpi: ev.kpi,
      eventIndex: i + 1,
      totalEvents: DEMO_EVENTS.length,
    };
    await broadcast(roomId, payload, apiGw);

    console.log(`[startDemo] ✓ Event ${i + 1}/${DEMO_EVENTS.length}: ${ev.type} (min ${ev.matchMinute})`);
  }

  // 3. Final leaderboard refresh
  try {
    const lb = await ddb.send(new QueryCommand({
      TableName: PLAYERS_TABLE,
      IndexName: 'roomId-index',
      KeyConditionExpression: 'roomId = :rid',
      ExpressionAttributeValues: { ':rid': roomId },
    }));
    const sorted = (lb.Items || [])
      .map((p) => ({ fanName: p.fanName || p.username, points: p.points || 0 }))
      .sort((a, b) => b.points - a.points);
    await broadcast(roomId, { type: 'LEADERBOARD_UPDATE', leaderboard: sorted }, apiGw);
  } catch (e) {
    console.warn('[startDemo] lb refresh warn', e.message);
  }

  console.log(`[startDemo] ✅ [Replay Loop] Replay finished for room ${roomId}`);
}

// Handler
exports.handler = async (event, context) => {
  const cors = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Check if this is the asynchronous self-invocation
    if (event.isAsyncReplay) {
      const { roomId } = event;
      await runReplaySimulation(roomId);
      return { statusCode: 200, body: 'Done' };
    }

    // Otherwise, this is the HTTP POST request from API Gateway
    const body = JSON.parse(event.body || '{}');
    const roomId = body.roomId;

    if (!roomId) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'MISSING_ROOM_ID' }) };
    }

    // Verify room exists and check if match is already live
    const roomResult = await ddb.send(new GetCommand({
      TableName: ROOMS_TABLE,
      Key: { roomId },
    }));
    if (!roomResult.Item) {
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'ROOM_NOT_FOUND' }) };
    }

    const gameState = await ddb.send(new GetCommand({
      TableName: GAMESTATE_TABLE,
      Key: { roomId, matchId: DEFAULT_MATCH_ID },
    }));

    if (gameState.Item && gameState.Item.matchStatus === 'live') {
      return { 
        statusCode: 400, 
        headers: cors, 
        body: JSON.stringify({ error: 'ALREADY_LIVE', message: 'A demo is already running in this room.' }) 
      };
    }

    const matchId = 'MATCH#DEMO-001';

    // Verify game state to prevent multiple parallel loops (Lock)
    const gameStateResult = await ddb.send(new GetCommand({
      TableName: GAMESTATE_TABLE,
      Key: { roomId, matchId },
    }));
    
    if (gameStateResult.Item) {
      const status = gameStateResult.Item.matchStatus;
      if (status === 'live' || status === 'halftime') {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'ALREADY_STARTED' }) };
      }
    }

    // Trigger self asynchronously using SDK
    const functionName = context.functionName;
    const payload = JSON.stringify({
      isAsyncReplay: true,
      roomId: roomId
    });

    console.log(`[startDemo] Triggering async self-invocation for room ${roomId} on function ${functionName}`);

    await lambdaClient.send(new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'Event', // Async invocation
      Payload: Buffer.from(payload)
    }));

    // Return 202 immediately to API Gateway, preventing any timeout
    return {
      statusCode: 202,
      headers: cors,
      body: JSON.stringify({ status: 'started', message: 'Demo simulation started asynchronously.' })
    };
  } catch (err) {
    console.error('[startDemo] Error:', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'INTERNAL_ERROR', detail: String(err.message || err) }) };
  }
};
