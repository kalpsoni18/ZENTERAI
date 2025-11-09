import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Load local environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Try to load .env.local from api directory first, then root
const envPath = join(__dirname, '../.env.local');
const rootEnvPath = join(__dirname, '../../.env.local');
if (existsSync(envPath)) {
  config({ path: envPath });
} else if (existsSync(rootEnvPath)) {
  config({ path: rootEnvPath });
} else {
  console.warn('⚠️  .env.local not found, using defaults');
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mock authentication middleware for local testing
const mockAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // In local mode, create a mock user
  (req as any).user = {
    id: 'local-user-1',
    email: 'test@example.com',
    orgId: 'local-org-1',
    role: 'Owner',
    cognitoUserId: 'local-cognito-user',
    status: 'active',
  };
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'local' });
});

// Mock auth endpoints
app.post('/api/auth/signup', mockAuth, async (req, res) => {
  res.json({
    orgId: 'local-org-1',
    userId: 'local-user-1',
    email: req.body.email,
  });
});

app.post('/api/auth/login', mockAuth, async (req, res) => {
  res.json({
    accessToken: 'mock-token',
    idToken: 'mock-id-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    user: {
      id: 'local-user-1',
      email: req.body.email,
      role: 'Owner',
      orgId: 'local-org-1',
    },
  });
});

app.post('/api/auth/invite', mockAuth, async (req, res) => {
  res.json({
    userId: 'local-user-2',
    email: req.body.email,
    role: req.body.role,
    inviteToken: 'mock-invite-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
});

// Mock file endpoints
app.get('/api/files', mockAuth, async (req, res) => {
  res.json({
    files: [],
    count: 0,
  });
});

app.post('/api/files/folder', mockAuth, async (req, res) => {
  res.json({
    id: 'local-folder-1',
    name: req.body.name,
    path: req.body.parentPath,
    type: 'folder',
    createdAt: new Date().toISOString(),
  });
});

app.delete('/api/files/:fileId', mockAuth, async (req, res) => {
  res.json({ message: 'File deleted successfully' });
});

app.post('/api/files/:fileId/share', mockAuth, async (req, res) => {
  res.json({
    shareId: 'local-share-1',
    shareToken: 'mock-share-token',
    expiresAt: req.body.expiresAt,
  });
});

// Mock upload endpoint
app.post('/api/upload/sign', mockAuth, async (req, res) => {
  res.json({
    uploadId: 'mock-upload-id',
    fileId: 'local-file-1',
    s3Key: `org-local-org-1/${req.body.fileName}`,
    parts: [
      { partNumber: 1, url: 'http://localhost:4566/mock-presigned-url' },
    ],
    partSize: 5 * 1024 * 1024,
  });
});

app.post('/api/upload/complete', mockAuth, async (req, res) => {
  res.json({ message: 'Upload completed' });
});

// Mock admin endpoints
app.get('/api/admin/users', mockAuth, async (req, res) => {
  res.json({
    users: [
      {
        id: 'local-user-1',
        email: 'test@example.com',
        role: 'Owner',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ],
  });
});

app.patch('/api/admin/users/:userId', mockAuth, async (req, res) => {
  res.json({ message: 'User role updated' });
});

app.delete('/api/admin/users/:userId', mockAuth, async (req, res) => {
  res.json({ message: 'User removed' });
});

app.get('/api/admin/org', mockAuth, async (req, res) => {
  res.json({
    id: 'local-org-1',
    name: 'Test Organization',
    domain: 'example.com',
    settings: {
      storageQuotaGB: 200,
      isolationMode: 'prefix',
      s3Prefix: 'org-local-org-1',
      encryptionMode: 'sse-kms',
    },
    billing: {
      plan: 'starter',
      status: 'trialing',
    },
    createdAt: new Date().toISOString(),
  });
});

app.patch('/api/admin/org', mockAuth, async (req, res) => {
  res.json({ message: 'Organization updated' });
});

app.get('/api/admin/usage', mockAuth, async (req, res) => {
  res.json({
    storageUsedGB: 0,
    storageQuotaGB: 200,
    filesCount: 0,
    usersCount: 1,
    recentActivity: [],
  });
});

// Mock billing endpoints
app.get('/api/billing', mockAuth, async (req, res) => {
  res.json({
    plan: 'starter',
    status: 'trialing',
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
});

app.post('/api/billing/checkout', mockAuth, async (req, res) => {
  res.json({
    sessionId: 'mock-checkout-session',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`📝 Local mode: No AWS credentials required`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

