# 🚀 Quick Start - Local Testing

## One-Click Test Run (No AWS Required!)

### Start Everything
```bash
./test.sh
```
or
```bash
./scripts/test-local.sh
```

This will:
- ✅ Start LocalStack (S3 emulation)
- ✅ Start DynamoDB Local
- ✅ Create local tables
- ✅ Start backend API (mock mode)
- ✅ Start frontend dev server

**Access:**
- 🌐 Frontend: http://localhost:3000
- 🔧 Backend: http://localhost:3001

### Stop and Clean Up (One-Click Revert)
```bash
./scripts/stop-local.sh
```

This will:
- ✅ Stop all Docker containers
- ✅ Remove all local data
- ✅ Clean up everything
- ✅ Ready for fresh start

## What You Get

### ✅ Works Locally (No AWS)
- Full UI testing
- All pages and components
- Mock API responses
- File upload UI (mock)
- Team management UI
- Dashboard with mock data
- Settings UI

### ❌ Doesn't Work Locally
- Real file uploads (mocked)
- Real authentication (auto-logged in)
- Real Stripe payments (mocked)
- Real SSO (mocked)

## Manual Steps (If Needed)

### Start Docker Services Only
```bash
./scripts/start-local.sh
```

### Start Backend Only
```bash
cd api
npm install  # First time only
npm run dev
```

### Start Frontend Only
```bash
cd web
npm install  # First time only
npm run dev
```

## Troubleshooting

### Port Already in Use?
```bash
# Kill processes on ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:4566 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

### Docker Not Running?
Start Docker Desktop first, then retry.

### Clean Slate
```bash
./scripts/stop-local.sh
rm -rf node_modules web/node_modules api/node_modules
./scripts/test-local.sh
```

## After Testing

When you're done testing:
1. Run `./scripts/stop-local.sh` to clean up
2. All local data is removed
3. Ready for production deployment (see DEPLOYMENT.md)

