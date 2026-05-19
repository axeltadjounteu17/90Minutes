/**
 * 90Minutes — sendMatchEvent Lambda
 * Receives DFL events from Python emitter via WebSocket.
 * - Updates GameState table (score, minute, status, lastEvent)
 * - For narrative events: calls Bedrock Nova Micro for AI narration
 * - For GOAL/FULLTIME: checks predictions and awards points
 * - Broadcasts enriched event to all connected clients
 *
 * Requirements: 6.1, 6.2, 9.5
 */

const {
  ddb, UpdateCommand, GAMESTATE_TABLE, PLAYERS_TABLE,
  broadcastToRoom, getAllPlayersInRoom, calculatePredictionPoints,
  generateNovaNarrative, wsResponse,
} = require('./utils');

/** Event types that trigger Nova narration */
const NARRATIVE_EVENTS = ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'HALFTIME', 'FULLTIME'];

/** Event types that trigger prediction scoring */
const SCORING_EVENTS = ['GOAL', 'FULLTIME'];

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const roomId = body.roomId || 'default-room';
    const matchId = body.matchId || 'MATCH#DFL-MAT-111111';
    const eventType = body.type;

    console.log(`[matchEvent] Received ${eventType} at minute ${body.matchMinute}`);

    // Determine match status based on event type
    let matchStatus = 'live';
    if (eventType === 'HALFTIME') matchStatus = 'halftime';
    else if (eventType === 'FULLTIME') matchStatus = 'finished';
    else if (eventType === 'MATCH_START') matchStatus = 'live';

    // Update GameState in DynamoDB
    const updateExpr = [
      'SET matchStatus = :status',
      'matchMinute = :minute',
      'lastEvent = :lastEvent',
      'updatedAt = :now',
    ];
    const exprValues = {
      ':status': matchStatus,
      ':minute': body.matchMinute || 0,
      ':lastEvent': {
        type: eventType,
        emoji: body.emoji || '',
        title: body.title || '',
        message: body.message || '',
        kpis: body.kpis || null,
      },
      ':now': Date.now(),
    };

    // Update score if present
    if (body.score) {
      updateExpr.push('currentScore = :score');
      exprValues[':score'] = body.score;
    }
    if (body.finalScore) {
      updateExpr.push('currentScore = :finalScore');
      exprValues[':finalScore'] = body.finalScore;
    }

    // Handle MATCH_START — set initial match info
    if (eventType === 'MATCH_START' && body.matchInfo) {
      updateExpr.push(
        'homeTeam = :homeTeam',
        'homeCode = :homeCode',
        'guestTeam = :guestTeam',
        'guestCode = :guestCode',
        'currentScore = :initScore',
      );
      exprValues[':homeTeam'] = body.matchInfo.homeTeam;
      exprValues[':homeCode'] = body.matchInfo.homeCode;
      exprValues[':guestTeam'] = body.matchInfo.guestTeam;
      exprValues[':guestCode'] = body.matchInfo.guestCode;
      exprValues[':initScore'] = '0:0';
    }

    await ddb.send(new UpdateCommand({
      TableName: GAMESTATE_TABLE,
      Key: { roomId, matchId },
      UpdateExpression: updateExpr.join(', '),
      ExpressionAttributeValues: exprValues,
    }));

    // Generate Nova narration for narrative event types
    let narrative = null;
    if (NARRATIVE_EVENTS.includes(eventType)) {
      narrative = await generateNovaNarrative(eventType, {
        minute: body.matchMinute,
        player: body.message || body.title || 'inconnu',
        score: body.score,
      });
    }

    // For GOAL/FULLTIME: score predictions and award points
    if (SCORING_EVENTS.includes(eventType) && body.score) {
      await awardPredictionPoints(roomId, body.score);
    }

    // Build broadcast message
    const broadcastMsg = {
      type: 'MATCH_EVENT',
      event: {
        ...body,
        narrative,
      },
    };

    await broadcastToRoom(roomId, broadcastMsg);

    // For GOAL and FULLTIME: also broadcast updated leaderboard
    if (SCORING_EVENTS.includes(eventType)) {
      const players = await getAllPlayersInRoom(roomId);
      const leaderboard = players
        .map((p) => ({
          userId: p.userId,
          fanName: p.fanName || p.username,
          points: p.points || 0,
        }))
        .sort((a, b) => b.points - a.points)
        .map((p, i) => ({ ...p, rank: i + 1 }));

      await broadcastToRoom(roomId, {
        type: 'LEADERBOARD_UPDATE',
        leaderboard,
      });
    }

    console.log(`[matchEvent] ${eventType} processed and broadcast`);
    return wsResponse(200, 'OK');
  } catch (error) {
    console.error('[matchEvent] Error:', error);
    return wsResponse(500, 'Internal server error');
  }
};

/**
 * Award prediction points to players who predicted the current score.
 * Uses atomic ADD operation.
 */
async function awardPredictionPoints(roomId, currentScore) {
  if (!currentScore) return;

  // Parse score string "X:Y" into object
  let actualScore;
  if (typeof currentScore === 'string') {
    const parts = currentScore.split(':');
    actualScore = { home: parseInt(parts[0], 10), away: parseInt(parts[1], 10) };
  } else {
    actualScore = currentScore;
  }

  if (isNaN(actualScore.home) || isNaN(actualScore.away)) return;

  try {
    const players = await getAllPlayersInRoom(roomId);

    for (const player of players) {
      if (!player.prediction) continue;

      const prediction = {
        home: player.prediction.homeScore,
        away: player.prediction.awayScore,
      };

      const points = calculatePredictionPoints(prediction, actualScore);
      if (points > 0) {
        await ddb.send(new UpdateCommand({
          TableName: PLAYERS_TABLE,
          Key: { roomPlayerId: player.roomPlayerId },
          UpdateExpression: 'ADD points :pts',
          ExpressionAttributeValues: { ':pts': points },
        }));

        console.log(`[matchEvent] Awarded ${points} pts to ${player.fanName || player.username}`);
      }
    }
  } catch (error) {
    console.error('[matchEvent] Error awarding prediction points:', error.message);
  }
}
