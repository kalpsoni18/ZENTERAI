#!/bin/bash
# Start backend server manually

cd "$(dirname "$0")/.."

echo "🔧 Starting Backend API Server..."

# Check if .env.local exists in root
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local..."
    cat > .env.local <<EOF
# Local Development Environment
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=000000000000
LOCAL_MODE=true
API_BASE_URL=http://localhost:3001
WEB_BASE_URL=http://localhost:3000
PORT=3001
EOF
fi

# Check if node_modules exist
if [ ! -d "api/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd api && npm install && cd ..
fi

# Start backend
cd api
echo "🚀 Starting backend on http://localhost:3001"
npm run dev

