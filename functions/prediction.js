/**
 * 90Minutes — sendPrediction Lambda
 * Validates and stores fan score prediction.
 * Awards +5 participation points on FIRST submission only (idempotent).
 * Broadcasts PREDICTION_RECEIVED to the room.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

const {
  ddb, UpdateCommand, PLAYERS_TABLE,
  broadcastToRoom, getAllPlayersInRoom, wsResponse,
} = require('./utils');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const connectionId = event.requestContext.connectionId;

    const roomId = body.roomId;
    const prediction = body.prediction;
    const predictionType = body.predictionType || 'pre-match';

    // Input validation
    if (!roomId || !prediction) {
      console.warn('[prediction] Invalid input — missing roomId or prediction');
      return wsResponse(400, 'INVALID_PREDICTION');
    }

    const homeScore = prediction.homeScore;
    const awayScore = prediction.awayScore;

    // Validate: must be integers in [0, 99]
    if (
      !Number.isInteger(homeScore) || !Number.isInteger(awayScore) ||
      homeScore < 0 || homeScore > 99 ||
      awayScore < 0 || awayScore > 99
    ) {
      console.warn('[prediction] Invalid score values', { homeScore, awayScore });
      return wsResponse(400, 'INVALID_PREDICTION');
    }

    console.log(`[prediction] ${predictionType} prediction: ${homeScore}:${awayScore} in room ${roomId}`);

    // Find the player by connectionId
    const players = await getAllPlayersInRoom(roomId);
    const player = players.find((p) => p.connectionId === connectionId);

    if (!player) {
      console.warn('[prediction] Player not found for connection', connectionId);
      return wsResponse(404, 'Player not found');
    }

    // Store prediction with idempotent points award
    // Use attribute_not_exists(prediction) condition to only add 5 points on first submission
    const predField = predictionType === 'halftime' ? 'halfPrediction' : 'prediction';

    try {
      await ddb.send(new UpdateCommand({
        TableName: PLAYERS_TABLE,
        Key: { roomPlayerId: player.roomPlayerId },
        UpdateExpression: `SET ${predField} = :pred, predictionType = :pt ADD points :pts`,
        ConditionExpression: `attribute_not_exists(${predField})`,
        ExpressionAttributeValues: {
          ':pred': { homeScore, awayScore },
          ':pt': predictionType,
          ':pts': 5,
        },
      }));
      console.log(`[prediction] First submission for ${player.fanName || player.username}, +5 pts`);
    } catch (condErr) {
      if (condErr.name === 'ConditionalCheckFailedException') {
        // Already submitted — update prediction without adding points
        await ddb.send(new UpdateCommand({
          TableName: PLAYERS_TABLE,
          Key: { roomPlayerId: player.roomPlayerId },
          UpdateExpression: `SET ${predField} = :pred, predictionType = :pt`,
          ExpressionAttributeValues: {
            ':pred': { homeScore, awayScore },
            ':pt': predictionType,
          },
        }));
        console.log(`[prediction] Re-submission for ${player.fanName || player.username}, no extra pts`);
      } else {
        throw condErr;
      }
    }

    // Broadcast PREDICTION_RECEIVED to the room
    await broadcastToRoom(roomId, {
      type: 'PREDICTION_RECEIVED',
      userId: player.userId,
      fanName: player.fanName || player.username,
      predictionType,
    });

    return wsResponse(200, 'Prediction stored');
  } catch (error) {
    console.error('[prediction] Error:', error);
    return wsResponse(500, 'Internal server error');
  }
};
