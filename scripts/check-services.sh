#!/bin/bash
# Quick script to check if services are running

echo "🔍 Checking Zenterai Services Status"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Docker
echo -n "Docker: "
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check LocalStack
echo -n "LocalStack: "
if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running on port 4566${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check DynamoDB Local
echo -n "DynamoDB Local: "
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running on port 8000${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check Backend API
echo -n "Backend API: "
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running on port 3001${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check Frontend
echo -n "Frontend: "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running on port 3000${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check Docker containers
echo ""
echo "Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "localstack|dynamodb|NAME" || echo "No containers running"

