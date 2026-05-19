/**
 * 90Minutes — joinRoom Lambda
 * POST /rooms/join
 * Validates a 6-digit joinCode and returns the room details.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
const ROOMS_TABLE = process.env.ROOMS_TABLE_NAME || '90Minutes-Rooms';

const JOIN_CODE_REGEX = /^[0-9]{6}$/;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { joinCode, userId, fanName } = body;

    // Validate joinCode format
    if (!joinCode || !JOIN_CODE_REGEX.test(joinCode)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'INVALID_JOIN_CODE' }),
      };
    }

    if (!userId || !fanName) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'MISSING_FIELDS' }),
      };
    }

    // Query the joinCode-index GSI
    const result = await ddbClient.send(new QueryCommand({
      TableName: ROOMS_TABLE,
      IndexName: 'joinCode-index',
      KeyConditionExpression: 'joinCode = :jc',
      ExpressionAttributeValues: { ':jc': joinCode },
      Limit: 1,
    }));

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'ROOM_NOT_FOUND' }),
      };
    }

    const room = result.Items[0];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: room.roomId,
        joinCode: room.joinCode,
        ownerFanName: room.ownerFanName,
      }),
    };
  } catch (err) {
    console.error('joinRoom error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'INTERNAL_ERROR' }),
    };
  }
};
