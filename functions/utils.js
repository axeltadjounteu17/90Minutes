/**
 * 90Minutes — Shared utility functions
 * Used by multiple Lambda handlers for scoring, narration, and broadcasting.
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
const { DynamoDBDocumentClient, QueryCommand, DeleteCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────

const BLOCKLIST = ['Bayern', 'Hamburg', 'München', 'Neuer', 'Müller'];

const GAMESTATE_TABLE = process.env.GAMESTATE_TABLE_NAME || '90Minutes-GameState';
const PLAYERS_TABLE = process.env.PLAYERS_TABLE_NAME || '90Minutes-Players';
const ROOMS_TABLE = process.env.ROOMS_TABLE_NAME || '90Minutes-Rooms';

const FALLBACK_NARRATIONS = {
  GOAL: '⚽ But marqué ! Le stade explose !',
  YELLOW_CARD: '🟡 Carton jaune ! Tension sur le terrain.',
  RED_CARD: '🔴 Carton rouge ! Expulsion directe !',
  HALFTIME: '⏱️ Mi-temps sifflée. Pause tactique.',
  FULLTIME: '🏁 Coup de sifflet final !',
  SUBSTITUTION: '🔄 Changement en cours.',
  OFFSIDE: '🚩 Hors-jeu signalé.',
};

// ─────────────────────────────────────────
// DynamoDB client (shared)
// ─────────────────────────────────────────

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

// ─────────────────────────────────────────
// calculatePredictionPoints
// ─────────────────────────────────────────

/**
 * Calculate points awarded for a prediction based on actual match score.
 * @param {{ home: number, away: number }} prediction - The predicted score
 * @param {{ home: number, away: number }} actualScore - The actual match score
 * @returns {number} Points: 100 (exact), 30 (correct winner), 20 (correct goal diff), 10 (correct total goals), 0 otherwise
 */
function calculatePredictionPoints(prediction, actualScore) {
  if (!prediction || !actualScore) return 0;

  const pH = prediction.home;
  const pA = prediction.away;
  const aH = actualScore.home;
  const aA = actualScore.away;

  // Exact score match
  if (pH === aH && pA === aA) return 100;

  // Correct winner (sign of goal difference matches)
  const predDiff = pH - pA;
  const actualDiff = aH - aA;
  if (
    (predDiff > 0 && actualDiff > 0) ||
    (predDiff < 0 && actualDiff < 0) ||
    (predDiff === 0 && actualDiff === 0)
  ) {
    return 30;
  }

  // Correct goal difference (same magnitude)
  if (predDiff === actualDiff) return 20;

  // Correct total goals
  if (pH + pA === aH + aA) return 10;

  return 0;
}

// ─────────────────────────────────────────
// generateNovaNarrative
// ─────────────────────────────────────────

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

/**
 * Generate a short narrative for a match event using Amazon Nova Micro.
 * Falls back to a static narration on timeout or invalid response.
 * @param {string} eventType - One of GOAL, YELLOW_CARD, RED_CARD, HALFTIME, FULLTIME, SUBSTITUTION, OFFSIDE
 * @param {object} eventData - Additional context (minute, player, team, etc.)
 * @returns {Promise<string>} A short narrative (≤15 words, ≥1 emoji)
 */
async function generateNovaNarrative(eventType, eventData) {
  const fallback = FALLBACK_NARRATIONS[eventType] || '⚽ Action en cours...';

  try {
    const prompt = `Tu es un commentateur sportif enthousiaste. Génère UNE phrase de max 15 mots avec au moins 1 emoji pour cet événement football: ${eventType}. Contexte: minute ${eventData.minute || '?'}, joueur: ${eventData.player || 'inconnu'}. Réponds UNIQUEMENT avec la phrase, rien d'autre.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const command = new InvokeModelCommand({
      modelId: 'amazon.nova-micro-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [{ role: 'user', content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 60, temperature: 0.8 },
      }),
    });

    const response = await bedrockClient.send(command, { abortSignal: controller.signal });
    clearTimeout(timeout);

    const body = JSON.parse(new TextDecoder().decode(response.body));
    const text = body.output?.message?.content?.[0]?.text || '';

    // Validate: ≤15 words and ≥1 emoji
    const words = text.trim().split(/\s+/);
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/u;

    if (words.length > 15 || !emojiRegex.test(text)) {
      return fallback;
    }

    return text.trim();
  } catch (err) {
    // Timeout or any other error → fallback
    return fallback;
  }
}

// ─────────────────────────────────────────
// broadcastToRoom
// ─────────────────────────────────────────

/**
 * Broadcast a payload to all WebSocket connections in a room.
 * Anonymizes by checking payload against BLOCKLIST before sending.
 * Removes stale connections on GoneException.
 * @param {string} roomId - The room to broadcast to
 * @param {object} payload - The message payload
 */
async function broadcastToRoom(roomId, payload) {
  // Anonymization check
  const serialized = JSON.stringify(payload);
  for (const term of BLOCKLIST) {
    if (serialized.includes(term)) {
      console.log('ANONYMIZATION_VIOLATION', { roomId, term });
      return; // Silent return — do not broadcast
    }
  }

  const wsEndpoint = process.env.WEBSOCKET_ENDPOINT;

  if (!wsEndpoint) {
    console.error('WEBSOCKET_ENDPOINT not set');
    return;
  }

  const apiGwClient = new ApiGatewayManagementApiClient({ endpoint: wsEndpoint });

  // Get all connections for this room
  const players = await getAllPlayersInRoom(roomId);

  const sendPromises = players.map(async (player) => {
    try {
      await apiGwClient.send(new PostToConnectionCommand({
        ConnectionId: player.connectionId,
        Data: Buffer.from(JSON.stringify(payload)),
      }));
    } catch (err) {
      if (err.statusCode === 410 || err.name === 'GoneException') {
        // Connection is stale — remove from Players table
        await ddb.send(new DeleteCommand({
          TableName: PLAYERS_TABLE,
          Key: { roomPlayerId: player.roomPlayerId },
        }));
      }
    }
  });

  await Promise.all(sendPromises);
}

/**
 * Get all players in a room via the roomId-index GSI.
 */
async function getAllPlayersInRoom(roomId) {
  const result = await ddb.send(new QueryCommand({
    TableName: PLAYERS_TABLE,
    IndexName: 'roomId-index',
    KeyConditionExpression: 'roomId = :rid',
    ExpressionAttributeValues: { ':rid': roomId },
  }));
  return result.Items || [];
}

/**
 * Standard WebSocket response helper.
 */
function wsResponse(statusCode, message) {
  return {
    statusCode,
    body: JSON.stringify({ message }),
  };
}

module.exports = {
  // Shared DDB client and commands
  ddb,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
  // Table names
  GAMESTATE_TABLE,
  PLAYERS_TABLE,
  ROOMS_TABLE,
  // Helpers
  calculatePredictionPoints,
  generateNovaNarrative,
  broadcastToRoom,
  getAllPlayersInRoom,
  wsResponse,
  // Constants
  BLOCKLIST,
  FALLBACK_NARRATIONS,
};
