/**
 * 90Minutes — Broadcast Lambda
 * Per aws-infrastructure.md:
 * - Sends a message to all connected WebSocket clients in a room
 * - Handles stale connections (GoneException cleanup)
 * - Can be triggered by DynamoDB Streams or direct invocation
 */

const { broadcastToRoom, wsResponse } = require('./utils');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const roomId = body.roomId;
    const message = body.message;

    if (!roomId || !message) {
      return wsResponse(400, 'Missing roomId or message');
    }

    console.log(`[broadcast] Broadcasting to room ${roomId}:`, message.type || 'unknown');

    await broadcastToRoom(roomId, message);

    return wsResponse(200, 'Broadcast sent');
  } catch (error) {
    console.error('[broadcast] Error:', error);
    return wsResponse(500, 'Internal server error');
  }
};
