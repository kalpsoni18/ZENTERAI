#!/bin/bash
# One-click test script - alias for scripts/test-local.sh

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "🐳 Docker is installed but not running."
    echo "📥 Starting Docker Desktop..."
    open -a Docker 2>/dev/null || echo "Please start Docker Desktop manually"
    echo ""
    echo "⏳ Waiting for Docker to start..."
    echo "   (This may take 30-60 seconds)"
    
    # Wait for Docker to be ready (max 60 seconds)
    for i in {1..60}; do
        if docker info > /dev/null 2>&1; then
            echo "✅ Docker is now running!"
            break
        fi
        sleep 1
        if [ $((i % 10)) -eq 0 ]; then
            echo "   Still waiting... ($i seconds)"
        fi
    done
    
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker did not start. Please start Docker Desktop manually and try again."
        exit 1
    fi
fi

exec ./scripts/test-local.sh

