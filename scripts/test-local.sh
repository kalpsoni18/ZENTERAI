#!/bin/bash
set -e

# One-click test script
echo "🎯 Zenterai One-Click Local Test"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if already running
if docker ps | grep -q "localstack"; then
    echo -e "${YELLOW}⚠️  Local environment is already running${NC}"
    echo -e "${BLUE}💡 To stop and clean up, run: ./scripts/stop-local.sh${NC}"
    exit 0
fi

# Start local environment
echo -e "${BLUE}🚀 Starting local test environment...${NC}"
./scripts/start-local.sh

# Wait a bit for services to be ready
sleep 3

# Check if api/src/local-server.ts exists
if [ ! -f "api/src/local-server.ts" ]; then
    echo -e "${YELLOW}⚠️  Backend server file not found. Creating it...${NC}"
    # The file should exist, but if not, we'll skip backend
fi

# Start backend in background
echo -e "${BLUE}🔧 Starting backend server...${NC}"
cd api
if [ -f "package.json" ]; then
    # Check if node_modules exist
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
        npm install
    fi
    npm run dev > ../logs/api.log 2>&1 &
    API_PID=$!
    echo -e "${GREEN}✓${NC} Backend server starting (PID: $API_PID)"
else
    echo -e "${RED}✗${NC} Backend package.json not found"
    API_PID=""
fi
cd ..

# Wait for backend to start
if [ ! -z "$API_PID" ]; then
    echo -e "${BLUE}⏳ Waiting for backend to start...${NC}"
    sleep 5
    # Check if backend is actually running
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend API is ready"
    else
        echo -e "${YELLOW}⚠️  Backend may not be ready yet. Check logs: tail -f logs/api.log${NC}"
    fi
fi

# Start frontend
echo -e "${BLUE}🎨 Starting frontend...${NC}"
cd web
if [ -f "package.json" ]; then
    # Check if node_modules exist
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
        npm install
    fi
    npm run dev > ../logs/web.log 2>&1 &
    WEB_PID=$!
    echo -e "${GREEN}✓${NC} Frontend starting (PID: $WEB_PID)"
else
    echo -e "${RED}✗${NC} Frontend package.json not found"
    WEB_PID=""
fi
cd ..

# Save PIDs for cleanup (only if they exist)
if [ ! -z "$API_PID" ]; then
    echo $API_PID > .test-pids
fi
if [ ! -z "$WEB_PID" ]; then
    echo $WEB_PID >> .test-pids
fi

echo ""
echo -e "${GREEN}✅ Local test environment is running!${NC}"
echo ""
echo -e "${BLUE}📋 Services:${NC}"
echo "  • Frontend: http://localhost:3000"
if [ ! -z "$API_PID" ]; then
    echo "  • Backend API: http://localhost:3001"
fi
echo "  • LocalStack: http://localhost:4566"
echo "  • DynamoDB Local: http://localhost:8000"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
if [ ! -z "$API_PID" ]; then
    echo "  • API logs: tail -f logs/api.log"
fi
if [ ! -z "$WEB_PID" ]; then
    echo "  • Web logs: tail -f logs/web.log"
fi
echo ""
echo -e "${BLUE}🔍 Check service status: ./scripts/check-services.sh${NC}"
echo ""
echo -e "${YELLOW}⚠️  Press Ctrl+C to stop all services${NC}"
echo -e "${BLUE}💡 To clean up completely, run: ./scripts/stop-local.sh${NC}"

# Wait for interrupt
trap "echo ''; echo '🛑 Stopping services...'; kill $API_PID $WEB_PID 2>/dev/null; exit" INT
wait

