/**
 * 90Minutes — getLeaderboard Lambda
 * GET /leaderboard?roomId=xxx
 * Returns sorted leaderboard for a room (points desc, joinedAt asc).
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
const PLAYERS_TABLE = process.env.PLAYERS_TABLE_NAME || '90Minutes-Players';

exports.handler = async (event) => {
  try {
    const roomId = event.queryStringParameters?.roomId;

    if (!roomId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'MISSING_ROOM_ID' }),
      };
    }

    const result = await ddbClient.send(new QueryCommand({
      TableName: PLAYERS_TABLE,
      IndexName: 'roomId-index',
      KeyConditionExpression: 'roomId = :rid',
      ExpressionAttributeValues: { ':rid': roomId },
    }));

    const players = result.Items || [];

    // Sort: points descending, then joinedAt ascending (tie-breaker)
    const leaderboard = players
      .map(p => ({
        fanName: p.fanName,
        points: p.points || 0,
        joinedAt: p.joinedAt || 0,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.joinedAt - b.joinedAt;
      });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaderboard }),
    };
  } catch (err) {
    console.error('getLeaderboard error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'INTERNAL_ERROR' }),
    };
  }
};
