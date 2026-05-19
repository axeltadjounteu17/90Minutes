/**
 * 90Minutes — startDemo Lambda (v3 — Real DFL Data)
 * POST /start-demo
 *
 * Replays the REAL Bundesliga match from Events_Anonym.xml.
 * FC Team (FCT) 5:0 Club (CLU) — Bundesliga Journée 1.
 *
 * 16 events spread over ~5 minutes (300s).
 * Each event includes real KPI data (xG, speed, distance) sent to
 * Amazon Nova Micro for ultra-realistic French narration.
 *
 * Lambda timeout MUST be >= 360s in CDK.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
const { QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

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

// ─────────────────────────────────────────────────────────────
// REAL DFL EVENTS — extracted from Events_Anonym.xml + KPI
// FC Team (FCT) 5:0 Club (CLU)
// Total pacing: ~300s (5 minutes)
// ─────────────────────────────────────────────────────────────
const DEMO_EVENTS = [
  // ── 1ère mi-temps ──
  {
    wait: 1000,
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
    wait: 11000,
    type: 'SHOT_BLOCKED',
    matchMinute: 2,
    message: 'S. Acht (FCT)',
    kpi: 'coup franc direct, xG=0.04, distance=23m, bloqué par S. Elf (CLU)',
  },
  {
    wait: 12000,
    type: 'GOAL',
    matchMinute: 3,
    score: '1:0',
    message: 'S. Fünf (FCT)',
    kpi: 'passe décisive de S. Neun, xG=0.03, vitesse=18.48km/h, solo dribble inside box, 0 défenseurs',
  },
  {
    wait: 14000,
    type: 'GOAL',
    matchMinute: 9,
    score: '2:0',
    message: 'S. Elf (FCT)',
    kpi: 'passe décisive directe de S. Sechs, xG=0.23, vitesse=23.78km/h, tir pied droit, 1 défenseur',
  },
  {
    wait: 12000,
    type: 'FOUL',
    matchMinute: 18,
    message: 'Penalty pour FC Team !',
    kpi: 'faute dans la surface, arbitre siffle penalty',
  },
  {
    wait: 11000,
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
    wait: 12000,
    type: 'GOAL',
    matchMinute: 24,
    score: '4:0',
    message: 'S. Sieben (FCT)',
    kpi: 'passe de S. Vier après coup franc, xG=0.03, déviation sur S. Zehn (CLU), vitesse=14.54km/h',
  },
  {
    wait: 12000,
    type: 'HALFTIME',
    matchMinute: 45,
    kpi: 'Score mi-temps: 4:0, domination totale de FC Team',
  },

  // ── 2ème mi-temps ──
  {
    wait: 14000,
    type: 'SUBSTITUTION',
    matchMinute: 46,
    message: 'CLU: Sieben→Sechzehn, Elf→Achtzehn, Acht→Neunzehn | FCT: Fünf→Sechzehn, Zwei→Achtzehn',
    kpi: '5 changements à la mi-temps, les deux coachs réajustent',
  },
  {
    wait: 14000,
    type: 'GOAL',
    matchMinute: 68,
    score: '5:0',
    message: 'S. Sechs (FCT)',
    kpi: 'passe de S. Acht, xG=0.12, CONTRE-ATTAQUE, déviation du gardien S. Eins (CLU), vitesse=13.62km/h',
  },
  {
    wait: 11000,
    type: 'SUBSTITUTION',
    matchMinute: 69,
    message: 'FCT: Achtzehn→Siebzehn, Sechs→Zwanzig',
    kpi: 'double changement tactique FCT',
  },
  {
    wait: 11000,
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
    wait: 10000,
    type: 'FULLTIME',
    matchMinute: 90,
    finalScore: '5:0',
    kpi: 'Victoire écrasante 5:0, FC Team domine la Journée 1 de Bundesliga',
  },
];

const NARRATED_TYPES = [
  'MATCH_START', 'GOAL', 'YELLOW_CARD', 'RED_CARD',
  'HALFTIME', 'FULLTIME', 'SUBSTITUTION', 'FOUL',
  'SHOT_BLOCKED', 'KICKOFF_2ND',
];

// ─────────────────────────────────────────────────────────────
// Nova narration — 2s timeout, fallback safe
// ─────────────────────────────────────────────────────────────
async function generateNarration(eventType, ctx) {
  const fb = FALLBACK[eventType] || '⚽ Action en cours.';
  try {
    const kpiInfo = ctx.kpi ? ` Données KPI: ${ctx.kpi}.` : '';
    const prompt = `Tu es un commentateur sportif enthousiaste français pour un match de Bundesliga. Génère UNE phrase de max 20 mots avec au moins 1 emoji pour cet événement: ${eventType}. Contexte: minute ${ctx.minute || '?'}, joueur: ${ctx.player || 'inconnu'}, score: ${ctx.score || '?'}.${kpiInfo} Réponds UNIQUEMENT avec la phrase, rien d'autre.`;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2000);

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

// ─────────────────────────────────────────────────────────────
// Broadcast to all WS connections in a room
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const cors = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = JSON.parse(event.body || '{}');
    const roomId = body.roomId;

    if (!roomId) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'MISSING_ROOM_ID' }) };
    }

    const roomResult = await ddb.send(new GetCommand({
      TableName: ROOMS_TABLE,
      Key: { roomId },
    }));
    if (!roomResult.Item) {
      return { statusCode: 404, headers: cors, body: JSON.stringify({ error: 'ROOM_NOT_FOUND' }) };
    }

    const wsEndpoint = process.env.WEBSOCKET_ENDPOINT;
    if (!wsEndpoint) {
      return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'WS_ENDPOINT_MISSING' }) };
    }
    const apiGw = new ApiGatewayManagementApiClient({ endpoint: wsEndpoint });
    const matchId = 'MATCH#DEMO-001';

    console.log(`[startDemo] ▶ Replay started for room ${roomId} — 16 events over ~5 min`);

    // ── Sequential replay with real pacing ──
    for (let i = 0; i < DEMO_EVENTS.length; i++) {
      const ev = DEMO_EVENTS[i];

      // Wait BEFORE sending this event
      await sleep(ev.wait);

      // Generate Nova narration
      let narration = null;
      if (NARRATED_TYPES.includes(ev.type)) {
        narration = await generateNarration(ev.type, {
          minute: ev.matchMinute,
          player: ev.message,
          score: ev.score || ev.finalScore,
          kpi: ev.kpi,
        });
      }

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

    // ── Final leaderboard refresh ──
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

    console.log(`[startDemo] ✅ Replay finished for room ${roomId}`);

    return { statusCode: 202, headers: cors, body: JSON.stringify({ status: 'completed', events: DEMO_EVENTS.length }) };
  } catch (err) {
    console.error('[startDemo] Error:', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'INTERNAL_ERROR', detail: String(err.message || err) }) };
  }
};
