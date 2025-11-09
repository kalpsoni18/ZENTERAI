#!/bin/bash
set -e

echo "🚀 Starting Zenterai Local Test Environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create local environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local <<EOF
# Local Development Environment
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=000000000000

# LocalStack endpoints
AWS_ENDPOINT_URL=http://localhost:4566
DYNAMODB_ENDPOINT=http://localhost:8000

# Cognito (mocked)
COGNITO_USER_POOL_ID=local-pool
COGNITO_CLIENT_ID=local-client
COGNITO_IDENTITY_POOL_ID=local-identity

# S3 (LocalStack)
S3_BUCKET_NAME=zenterai-local-storage
S3_BUCKET_REGION=us-east-1

# DynamoDB
DYNAMODB_TABLE_PREFIX=zenterai-local

# KMS (mocked)
KMS_KEY_ID=local-key

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_local
STRIPE_WEBHOOK_SECRET=whsec_local
STRIPE_PUBLISHABLE_KEY=pk_test_local

# API
API_BASE_URL=http://localhost:3001
WEB_BASE_URL=http://localhost:3000

# Storage
STORAGE_ISOLATION_MODE=prefix
DEFAULT_STORAGE_QUOTA_GB=200

# Audit
AUDIT_LOG_S3_PREFIX=audit-logs/
AUDIT_RETENTION_DAYS=2555

# Local mode
LOCAL_MODE=true
EOF
    echo -e "${GREEN}✓${NC} Created .env.local"
fi

# Clean up any existing containers
echo -e "${BLUE}🧹 Cleaning up existing containers...${NC}"
docker-compose down -v 2>/dev/null || true

# Remove old localstack data if it exists
if [ -d "localstack-data" ]; then
    echo -e "${BLUE}🧹 Removing old LocalStack data...${NC}"
    rm -rf localstack-data
fi

# Start Docker services
echo -e "${BLUE}🐳 Starting Docker services (LocalStack + DynamoDB)...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
echo "   (This may take 30-60 seconds)"

# Wait for LocalStack to be healthy
for i in {1..60}; do
    if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} LocalStack is ready"
        break
    fi
    sleep 1
    if [ $((i % 10)) -eq 0 ]; then
        echo "   Still waiting for LocalStack... ($i seconds)"
    fi
done

# Wait for DynamoDB Local to be ready
for i in {1..30}; do
    if curl -s http://localhost:8000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} DynamoDB Local is ready"
        break
    fi
    sleep 1
done

# Create S3 bucket in LocalStack
echo -e "${BLUE}📦 Creating S3 bucket in LocalStack...${NC}"
aws --endpoint-url=http://localhost:4566 s3 mb s3://zenterai-local-storage 2>/dev/null || echo "Bucket may already exist"

# Create DynamoDB tables locally
echo -e "${BLUE}🗄️  Creating DynamoDB tables...${NC}"
cd api

# Create tables using AWS CLI with local endpoint
aws dynamodb create-table \
    --endpoint-url=http://localhost:8000 \
    --table-name zenterai-local-orgs \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table may already exist"

aws dynamodb create-table \
    --endpoint-url=http://localhost:8000 \
    --table-name zenterai-local-users \
    --attribute-definitions AttributeName=id,AttributeType=S AttributeName=orgId,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes IndexName=orgId-index,KeySchema=[{AttributeName=orgId,KeyType=HASH}],Projection={ProjectionType=ALL} \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table may already exist"

aws dynamodb create-table \
    --endpoint-url=http://localhost:8000 \
    --table-name zenterai-local-files \
    --attribute-definitions AttributeName=id,AttributeType=S AttributeName=orgId,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes IndexName=orgId-parentId-index,KeySchema=[{AttributeName=orgId,KeyType=HASH}],Projection={ProjectionType=ALL} \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table may already exist"

aws dynamodb create-table \
    --endpoint-url=http://localhost:8000 \
    --table-name zenterai-local-shares \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table may already exist"

aws dynamodb create-table \
    --endpoint-url=http://localhost:8000 \
    --table-name zenterai-local-audit \
    --attribute-definitions AttributeName=id,AttributeType=S AttributeName=orgId,AttributeType=S AttributeName=timestamp,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes IndexName=orgId-timestamp-index,KeySchema=[{AttributeName=orgId,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL} \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "Table may already exist"

cd ..

# Install dependencies if needed
if [ ! -d "web/node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    cd web && npm install && cd ..
fi

if [ ! -d "api/node_modules" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    cd api && npm install && cd ..
fi

# Start local API server (if you have a local server script)
echo -e "${GREEN}✅ Local environment is ready!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "  1. Start frontend: cd web && npm run dev"
echo "  2. Start backend: cd api && npm run dev (if you have a dev script)"
echo "  3. Access frontend: http://localhost:3000"
echo ""
echo -e "${BLUE}🛑 To stop and clean up, run: ./scripts/stop-local.sh${NC}"

