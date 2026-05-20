/**
 * 90Minutes — $connect Lambda
 * Per aws-infrastructure.md:
 * - Registers player connection in DynamoDB Players table
 * - Increments connected count in GameState
 * - Connection params via query string: roomId, userId, username
 */

const {
  ddb, PutCommand, UpdateCommand,
  GAMESTATE_TABLE, PLAYERS_TABLE, wsResponse,
} = require('./utils');

exports.handler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const qs = event.queryStringParameters || {};
    const roomId = qs.roomId || 'default-room';
    const userId = qs.userId || `guest_${connectionId.slice(-6)}`;
    const username = qs.username || `Fan_${connectionId.slice(-4)}`;
    const matchId = qs.matchId || 'MATCH#DFL-MAT-111111';

    const roomPlayerId = `${roomId}#user#${userId}#${connectionId}`;
    const now = Date.now();

    console.log(`[connect] ${username} (${userId}) joining room ${roomId}`);

    // Save player to Players table
    await ddb.send(new PutCommand({
      TableName: PLAYERS_TABLE,
      Item: {
        roomPlayerId,
        roomId,
        userId,
        username,
        connectionId,
        points: 0,
        reactions: 0,
        badges: [],
        joinedAt: now,
      },
    }));

    // Increment connected count in GameState (atomic ADD)
    await ddb.send(new UpdateCommand({
      TableName: GAMESTATE_TABLE,
      Key: { roomId, matchId },
      UpdateExpression: 'ADD connectedTotal :one SET updatedAt = :now',
      ExpressionAttributeValues: {
        ':one': 1,
        ':now': now,
      },
    }));

    console.log(`[connect] ${username} connected successfully`);
    return wsResponse(200, 'Connected');
  } catch (error) {
    console.error('[connect] Error:', error);
    return wsResponse(500, 'Internal server error');
  }
};
