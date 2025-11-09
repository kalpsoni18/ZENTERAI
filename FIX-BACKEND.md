# Fix Backend Connection Issues

## Problem
The frontend is running but can't connect to the backend API. You're seeing proxy errors like:
```
http proxy error: /api/admin/usage
AggregateError [EAGAIN]
```

## Solution

### Step 1: Stop Everything
```bash
# Kill any processes on ports 3000 and 3001
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
```

### Step 2: Start Backend First
In a new terminal:
```bash
cd api
npm run dev
```

You should see:
```
🚀 Local API server running on http://localhost:3001
```

### Step 3: Start Frontend
In another terminal:
```bash
cd web
npm run dev
```

You should see:
```
➜  Local:   http://localhost:3000/
```

### Step 4: Verify
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/health (should return `{"status":"ok","mode":"local"}`)

## Quick Fix Script

Or use the helper script:
```bash
./scripts/start-backend.sh
```

This will:
1. Create `.env.local` if needed
2. Install dependencies if needed
3. Start the backend server

## Troubleshooting

### Backend won't start
- Check if port 3001 is in use: `lsof -ti:3001`
- Check logs: `tail -f logs/api.log`
- Make sure `.env.local` exists in root directory

### Frontend can't connect
- Make sure backend is running on port 3001
- Check backend health: `curl http://localhost:3001/health`
- Check vite proxy config in `web/vite.config.ts`

### Port conflicts
- Frontend should be on port 3000
- Backend should be on port 3001
- If 3000 is in use, kill the process: `lsof -ti:3000 | xargs kill -9`

