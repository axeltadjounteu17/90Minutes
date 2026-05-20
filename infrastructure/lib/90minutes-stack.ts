/**
 * 90Minutes — AWS CDK Stack
 * Per aws-infrastructure.md and services-and-data.md:
 * - 2 DynamoDB tables (GameState + Players)
 * - 1 WebSocket API Gateway (5 routes)
 * - 6 Lambda functions (Node.js 20)
 * - 1 Cognito User Pool
 * - Bedrock permissions for matchEvent Lambda
 *
 * Region: us-east-1 (sandbox SCP restriction)
 */

import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { WebSocketLambdaIntegration, HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export class NinetyMinutesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ─────────────────────────────────────────
    // DYNAMODB TABLES
    // ─────────────────────────────────────────

    const gameStateTable = new dynamodb.Table(this, 'GameStateTable', {
      tableName: '90Minutes-GameState',
      partitionKey: { name: 'roomId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'matchId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const playersTable = new dynamodb.Table(this, 'PlayersTable', {
      tableName: '90Minutes-Players',
      partitionKey: { name: 'roomPlayerId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // GSI for querying all players in a room
    playersTable.addGlobalSecondaryIndex({
      indexName: 'roomId-index',
      partitionKey: { name: 'roomId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const roomsTable = new dynamodb.Table(this, 'RoomsTable', {
      tableName: '90Minutes-Rooms',
      partitionKey: { name: 'roomId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // GSI for looking up rooms by joinCode
    roomsTable.addGlobalSecondaryIndex({
      indexName: 'joinCode-index',
      partitionKey: { name: 'joinCode', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });


    // ─────────────────────────────────────────
    // COGNITO USER POOL
    // ─────────────────────────────────────────

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: '90Minutes-Users',
      selfSignUpEnabled: true,
      signInAliases: { username: true, email: true },
      autoVerify: { email: false }, // Simplified for hackathon
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: '90Minutes-AppClient',
      generateSecret: false, // No secret for mobile app
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      accessTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // ─────────────────────────────────────────
    // LAMBDA FUNCTIONS
    // ─────────────────────────────────────────

    const commonEnv: Record<string, string> = {
      GAMESTATE_TABLE_NAME: gameStateTable.tableName,
      PLAYERS_TABLE_NAME: playersTable.tableName,
    };

    /** Helper to create a Lambda with standard config */
    const createLambda = (
      name: string,
      handler: string,
      memoryMB: number = 128,
      timeoutSec: number = 5,
    ): lambda.Function => {
      return new lambda.Function(this, name, {
        functionName: `90Minutes-${name}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler,
        code: lambda.Code.fromAsset('../functions'),
        environment: { ...commonEnv },
        memorySize: memoryMB,
        timeout: cdk.Duration.seconds(timeoutSec),
      });
    };

    const connectFn = createLambda('Connect', 'connect.handler');
    const disconnectFn = createLambda('Disconnect', 'disconnect.handler');
    const matchEventFn = createLambda('MatchEvent', 'matchEvent.handler', 256, 10);
    const predictionFn = createLambda('Prediction', 'prediction.handler');
    const reactionFn = createLambda('Reaction', 'reaction.handler');
    const broadcastFn = createLambda('Broadcast', 'broadcast.handler', 128, 10);
    const createRoomFn = createLambda('CreateRoom', 'createRoom.handler');
    const joinRoomFn = createLambda('JoinRoom', 'joinRoom.handler');
    const getLeaderboardFn = createLambda('GetLeaderboard', 'getLeaderboard.handler');
    const startDemoFn = createLambda('StartDemo', 'startDemo.handler', 256, 360);

    // Add ROOMS_TABLE_NAME env var to Lambdas that need it
    const roomLambdas = [createRoomFn, joinRoomFn, startDemoFn, matchEventFn];
    for (const fn of roomLambdas) {
      fn.addEnvironment('ROOMS_TABLE_NAME', roomsTable.tableName);
    }

    // startDemo needs to invoke matchEvent Lambda
    startDemoFn.addEnvironment('MATCH_EVENT_FN_NAME', matchEventFn.functionName);
    matchEventFn.grantInvoke(startDemoFn);
    
    // Allow startDemo to invoke itself asynchronously without causing circular dependency
    startDemoFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: ['*'],
    }));

    // DynamoDB permissions — all Lambdas get read/write on both tables
    const allLambdas = [connectFn, disconnectFn, matchEventFn, predictionFn, reactionFn, broadcastFn, createRoomFn, joinRoomFn, getLeaderboardFn, startDemoFn];
    for (const fn of allLambdas) {
      gameStateTable.grantReadWriteData(fn);
      playersTable.grantReadWriteData(fn);
      roomsTable.grantReadWriteData(fn);
    }

    // Bedrock permissions scoped to amazon.nova-micro-v1:0
    const bedrockPolicy = new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: ['arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-micro-v1:0'],
    });
    matchEventFn.addToRolePolicy(bedrockPolicy);
    startDemoFn.addToRolePolicy(bedrockPolicy);


    // ─────────────────────────────────────────
    // API GATEWAY WEBSOCKET
    // ─────────────────────────────────────────

    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'WebSocketApi', {
      apiName: '90Minutes-WebSocket',
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration('ConnectIntegration', connectFn),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration('DisconnectIntegration', disconnectFn),
      },
    });

    const webSocketStage = new apigatewayv2.WebSocketStage(this, 'WebSocketStage', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    // Custom routes
    webSocketApi.addRoute('sendMatchEvent', {
      integration: new WebSocketLambdaIntegration('MatchEventIntegration', matchEventFn),
    });

    webSocketApi.addRoute('sendPrediction', {
      integration: new WebSocketLambdaIntegration('PredictionIntegration', predictionFn),
    });

    webSocketApi.addRoute('sendReaction', {
      integration: new WebSocketLambdaIntegration('ReactionIntegration', reactionFn),
    });

    // WebSocket manage connections permission (for broadcasting)
    const wsCallbackUrl = `https://${webSocketApi.apiId}.execute-api.${cdk.Stack.of(this).region}.amazonaws.com/${webSocketStage.stageName}`;

    // Lambdas that need to broadcast via WebSocket
    const broadcastLambdas = [matchEventFn, predictionFn, reactionFn, broadcastFn, startDemoFn];
    for (const fn of broadcastLambdas) {
      webSocketApi.grantManageConnections(fn);
      fn.addEnvironment('WEBSOCKET_ENDPOINT', wsCallbackUrl);
    }

    // ─────────────────────────────────────────
    // HTTP API (REST endpoints for rooms, leaderboard, demo)
    // ─────────────────────────────────────────

    const httpApi = new apigatewayv2.HttpApi(this, 'HttpApi', {
      apiName: '90Minutes-HttpApi',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    httpApi.addRoutes({
      path: '/rooms',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration('CreateRoomIntegration', createRoomFn),
    });

    httpApi.addRoutes({
      path: '/rooms/join',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration('JoinRoomIntegration', joinRoomFn),
    });

    httpApi.addRoutes({
      path: '/leaderboard',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('GetLeaderboardIntegration', getLeaderboardFn),
    });

    httpApi.addRoutes({
      path: '/start-demo',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new HttpLambdaIntegration('StartDemoIntegration', startDemoFn),
    });

    // ─────────────────────────────────────────
    // CLOUDFRONT CDN
    // ─────────────────────────────────────────

    const webBucket = s3.Bucket.fromBucketName(this, 'WebBucket', '90minutes-app-1778260936');

    const distribution = new cloudfront.Distribution(this, 'WebDistribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin(`${webBucket.bucketName}.s3-website-${cdk.Stack.of(this).region}.amazonaws.com`, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
      comment: '90Minutes Web App CDN',
    });

    // ─────────────────────────────────────────
    // CLOUDWATCH MONITORING
    // ─────────────────────────────────────────

    const dashboard = new cloudwatch.Dashboard(this, 'MonitoringDashboard', {
      dashboardName: '90Minutes-Monitoring',
    });

    // Lambda errors widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [startDemoFn, matchEventFn, predictionFn, reactionFn].map(
          (fn) => fn.metricErrors({ period: cdk.Duration.minutes(1) })
        ),
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration (ms)',
        left: [startDemoFn, matchEventFn, predictionFn].map(
          (fn) => fn.metricDuration({ period: cdk.Duration.minutes(1) })
        ),
        width: 12,
      }),
    );

    // Invocations + DynamoDB
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: allLambdas.map(
          (fn) => fn.metricInvocations({ period: cdk.Duration.minutes(5) })
        ),
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Units',
        left: [
          gameStateTable.metricConsumedReadCapacityUnits(),
          gameStateTable.metricConsumedWriteCapacityUnits(),
          playersTable.metricConsumedReadCapacityUnits(),
          playersTable.metricConsumedWriteCapacityUnits(),
        ],
        width: 12,
      }),
    );

    // Alarm on StartDemo errors (most critical function)
    new cloudwatch.Alarm(this, 'StartDemoErrorAlarm', {
      metric: startDemoFn.metricErrors({ period: cdk.Duration.minutes(5) }),
      threshold: 3,
      evaluationPeriods: 1,
      alarmDescription: 'StartDemo Lambda has 3+ errors in 5 minutes',
    });

    // ─────────────────────────────────────────
    // CDK OUTPUTS
    // Per aws-infrastructure.md: these values are needed by the app and emitter
    // ─────────────────────────────────────────

    new cdk.CfnOutput(this, 'WebSocketURL', {
      value: webSocketStage.url,
      description: 'WebSocket URL for the app and Python emitter',
    });

    new cdk.CfnOutput(this, 'WebSocketCallbackURL', {
      value: wsCallbackUrl,
      description: 'WebSocket callback URL for Lambda broadcasting',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito App Client ID',
    });

    new cdk.CfnOutput(this, 'GameStateTableName', {
      value: gameStateTable.tableName,
      description: 'DynamoDB GameState table name',
    });

    new cdk.CfnOutput(this, 'PlayersTableName', {
      value: playersTable.tableName,
      description: 'DynamoDB Players table name',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: cdk.Stack.of(this).region,
      description: 'AWS Region',
    });

    new cdk.CfnOutput(this, 'HttpApiEndpoint', {
      value: httpApi.apiEndpoint,
      description: 'HTTP API endpoint for rooms, leaderboard, and demo',
    });

    new cdk.CfnOutput(this, 'RoomsTableName', {
      value: roomsTable.tableName,
      description: 'DynamoDB Rooms table name',
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront CDN URL (HTTPS)',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID for cache invalidation',
    });
  }
}

