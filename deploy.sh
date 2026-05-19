#!/bin/bash
# 90Minutes — Full Deployment Script
# Run this after configuring AWS CLI (aws configure)
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Prerequisites:
#   - AWS CLI configured (aws configure)
#   - Node.js installed
#   - npm install done in infrastructure/ and functions/

set -e

echo "🚀 90Minutes — Deploying to AWS..."
echo ""

# 1. Install Lambda dependencies
echo "📦 Installing Lambda dependencies..."
cd functions
npm install
cd ..

# 2. Deploy CDK stack
echo "☁️  Deploying CDK stack to us-east-1..."
cd infrastructure
npm install
npx cdk bootstrap --region us-east-1 2>/dev/null || true
npx cdk deploy --require-approval never --outputs-file ../app/src/constants/aws-outputs.json
cd ..

# 3. Extract outputs
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 CDK Outputs saved to: app/src/constants/aws-outputs.json"
echo ""
cat app/src/constants/aws-outputs.json
echo ""
echo ""
echo "📝 Next steps:"
echo "   1. Copy the WebSocket URL to emitter/.env"
echo "   2. Copy Cognito IDs to app/.env"
echo "   3. Run: python emitter/emitter.py --local  (to test)"
echo "   4. Run: cd app && npx expo start --web     (to launch app)"
