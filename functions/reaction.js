/**
 * 90Minutes — sendReaction Lambda
 * Stores emoji reaction with rate-limiting (1 per second per user).
 * Awards +1 point (atomic ADD).
 * Broadcasts REACTION to the room.
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

const {
  ddb, UpdateCommand, PLAYERS_TABLE,
  broadcastToRoom, getAllPlayersInRoom, wsResponse,
} = require('./utils');

/** Valid reaction emojis */
const VALID_EMOJIS = ['⚽', '😱', '🔥', '💀'];

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const connectionId = event.requestContext.connectionId;

    const roomId = body.roomId;
    const emoji = body.emoji;

    // Input validation
    if (!roomId || !emoji) {
      return wsResponse(400, 'INVALID_REACTION');
    }

    if (!VALID_EMOJIS.includes(emoji)) {
      return wsResponse(400, 'INVALID_REACTION');
    }

    // Find player
    const players = await getAllPlayersInRoom(roomId);
    const player = players.find((p) => p.connectionId === connectionId);

    if (!player) {
      return wsResponse(404, 'Player not found');
    }

    // Rate-limit via ConditionExpression: lastReactionAt must be > 1000ms ago
    const now = Date.now();

    try {
      await ddb.send(new UpdateCommand({
        TableName: PLAYERS_TABLE,
        Key: { roomPlayerId: player.roomPlayerId },
        UpdateExpression: 'ADD points :one SET lastReactionAt = :now',
        ConditionExpression: 'attribute_not_exists(lastReactionAt) OR lastReactionAt < :threshold',
        ExpressionAttributeValues: {
          ':one': 1,
          ':now': now,
          ':threshold': now - 1000,
        },
      }));
    } catch (condErr) {
      if (condErr.name === 'ConditionalCheckFailedException') {
        return wsResponse(429, 'RATE_LIMITED');
      }
      throw condErr;
    }

    console.log(`[reaction] ${player.fanName || player.username} reacted ${emoji} in ${roomId}`);

    // Broadcast reaction to room
    await broadcastToRoom(roomId, {
      type: 'REACTION',
      userId: player.userId,
      emoji,
    });

    return wsResponse(200, 'Reaction stored');
  } catch (error) {
    console.error('[reaction] Error:', error);
    return wsResponse(500, 'Internal server error');
  }
};

// Export for testing
exports.VALID_EMOJIS = VALID_EMOJIS;
