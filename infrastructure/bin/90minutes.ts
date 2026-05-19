#!/usr/bin/env node
/**
 * 90Minutes — CDK App Entry Point
 * Per aws-infrastructure.md: deploys to us-east-1 (sandbox SCP restriction)
 */

import * as cdk from 'aws-cdk-lib';
import { NinetyMinutesStack } from '../lib/90minutes-stack';

const app = new cdk.App();

new NinetyMinutesStack(app, 'NinetyMinutesStack', {
  env: {
    region: 'us-east-1', // Sandbox SCP restriction — us-east-1 only
  },
  description: '90Minutes — Real-time multiplayer football fan app (AWS World Sports Innovation Cup 2026)',
});
