/**
 * 90Minutes — createRoom Lambda
 * POST /rooms
 * Creates a new room with a unique 6-digit join code and 24h TTL.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));
const ROOMS_TABLE = process.env.ROOMS_TABLE_NAME || '90Minutes-Rooms';

/**
 * Generate a random 6-digit code (000000–999999)
 */
function generateJoinCode() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}

/**
 * Check if a joinCode already exists in the table via GSI
 */
async function isJoinCodeTaken(joinCode) {
  const result = await ddbClient.send(new QueryCommand({
    TableName: ROOMS_TABLE,
    IndexName: 'joinCode-index',
    KeyConditionExpression: 'joinCode = :jc',
    ExpressionAttributeValues: { ':jc': joinCode },
    Limit: 1,
  }));
  return (result.Items && result.Items.length > 0);
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { ownerUserId, ownerFanName } = body;

    if (!ownerUserId || !ownerFanName) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'MISSING_FIELDS' }),
      };
    }

    // Generate unique joinCode with up to 10 attempts
    let joinCode = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateJoinCode();
      const taken = await isJoinCodeTaken(candidate);
      if (!taken) {
        joinCode = candidate;
        break;
      }
    }

    if (!joinCode) {
      return {
        statusCode: 503,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'ROOM_CODE_EXHAUSTED' }),
      };
    }

    const roomId = crypto.randomUUID();
    const createdAt = Date.now();
    const ttl = Math.floor(createdAt / 1000) + 86400; // 24h from now

    await ddbClient.send(new PutCommand({
      TableName: ROOMS_TABLE,
      Item: {
        roomId,
        joinCode,
        ownerUserId,
        ownerFanName,
        createdAt,
        ttl,
      },
    }));

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, joinCode }),
    };
  } catch (err) {
    console.error('createRoom error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'INTERNAL_ERROR' }),
    };
  }
};

// Export for testing
exports.generateJoinCode = generateJoinCode;
exports.isJoinCodeTaken = isJoinCodeTaken;
