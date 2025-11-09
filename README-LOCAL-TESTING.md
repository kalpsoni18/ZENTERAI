# Local Testing Guide

## Quick Start (One-Click)

### Start Local Test Environment

```bash
./scripts/test-local.sh
```

This will:
1. ✅ Start LocalStack (S3, DynamoDB emulation)
2. ✅ Start DynamoDB Local
3. ✅ Create local tables and buckets
4. ✅ Start backend API server (mock mode)
5. ✅ Start frontend dev server

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- LocalStack: http://localhost:4566
- DynamoDB Local: http://localhost:8000

### Stop and Clean Up (One-Click Revert)

```bash
./scripts/stop-local.sh
```

This will:
1. ✅ Stop all Docker containers
2. ✅ Remove all local data
3. ✅ Clean up volumes
4. ✅ Remove test files

## Manual Steps

### Option 1: Start Everything Separately

```bash
# 1. Start Docker services
./scripts/start-local.sh

# 2. Start backend (in separate terminal)
cd api
npm run dev

# 3. Start frontend (in separate terminal)
cd web
npm run dev
```

### Option 2: Just Start Docker Services

```bash
# Start only Docker services
docker-compose up -d

# Stop Docker services
docker-compose down -v
```

## What Gets Created Locally

### Docker Services
- **LocalStack**: Emulates S3, Lambda, IAM, STS
- **DynamoDB Local**: Local DynamoDB instance

### Local Files
- `.env.local`: Local environment variables (no AWS credentials needed)
- `localstack-data/`: LocalStack data directory
- `dynamodb-data/`: DynamoDB Local data directory
- `logs/`: Application logs

### Local Resources
- S3 Bucket: `zenterai-local-storage`
- DynamoDB Tables:
  - `zenterai-local-orgs`
  - `zenterai-local-users`
  - `zenterai-local-files`
  - `zenterai-local-shares`
  - `zenterai-local-audit`

## Mock Mode

When running locally, the API server runs in **mock mode**:
- ✅ No AWS credentials required
- ✅ No real AWS services called
- ✅ Mock authentication (auto-logged in as test user)
- ✅ Mock data responses
- ✅ All endpoints work for testing UI

## Testing Features

### What Works Locally
- ✅ Frontend UI (all pages)
- ✅ File upload UI (mock)
- ✅ Team management UI
- ✅ Dashboard UI
- ✅ Settings UI
- ✅ All API endpoints (mocked responses)

### What Doesn't Work Locally
- ❌ Real file uploads to S3
- ❌ Real authentication (uses mock user)
- ❌ Real Stripe payments
- ❌ Real SSO

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001
lsof -i :4566
lsof -i :8000

# Kill the process or change ports in docker-compose.yml
```

### Docker Not Running
```bash
# Start Docker Desktop or Docker daemon
# Then retry
./scripts/start-local.sh
```

### Clean Slate
```bash
# Stop everything
./scripts/stop-local.sh

# Remove node_modules (optional)
rm -rf web/node_modules api/node_modules

# Start fresh
./scripts/start-local.sh
```

## Environment Variables

Local testing uses `.env.local` which:
- ✅ Doesn't require AWS credentials
- ✅ Uses local endpoints
- ✅ Uses mock/test values
- ✅ Safe to commit (if you want)

## Next Steps After Testing

1. **Stop local environment**: `./scripts/stop-local.sh`
2. **Deploy to AWS**: Follow `DEPLOYMENT.md`
3. **Configure real AWS credentials**: Update `.env` (not `.env.local`)

