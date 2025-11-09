#!/bin/bash
set -e

echo "🛑 Stopping Zenterai Local Test Environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Stop Docker services
echo -e "${BLUE}🐳 Stopping Docker services...${NC}"
docker-compose down -v

# Remove local data directories
echo -e "${BLUE}🧹 Cleaning up local data...${NC}"
rm -rf localstack-data
rm -rf dynamodb-data

# Remove local environment file (optional - comment out if you want to keep it)
# rm -f .env.local

echo -e "${GREEN}✅ Local environment stopped and cleaned up!${NC}"
echo ""
echo -e "${BLUE}💡 All local data has been removed.${NC}"
echo -e "${BLUE}💡 Docker volumes have been removed.${NC}"
echo -e "${BLUE}💡 You can now start fresh with ./scripts/start-local.sh${NC}"

