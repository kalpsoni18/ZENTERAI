import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_PREFIX = process.env.DYNAMODB_TABLE_PREFIX || 'zenterai';

export interface Org {
  id: string;
  name: string;
  domain?: string;
  createdAt: string;
  settings: {
    storageQuotaGB: number;
    isolationMode: 'prefix' | 'bucket';
    s3Prefix?: string;
    s3Bucket?: string;
    encryptionMode: 'sse-kms' | 'zero-knowledge';
    kmsKeyId?: string;
  };
  billing: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    plan: string;
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
  };
}

export interface User {
  id: string;
  email: string;
  orgId: string;
  role: 'Owner' | 'Admin' | 'Manager' | 'Member' | 'Guest';
  cognitoUserId: string;
  createdAt: string;
  lastLoginAt?: string;
  status: 'active' | 'invited' | 'suspended';
  inviteToken?: string;
  inviteExpiresAt?: string;
}

export interface File {
  id: string;
  orgId: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  contentType?: string;
  s3Key: string;
  parentId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  isDeleted: boolean;
  deletedAt?: string;
  metadata?: Record<string, any>;
}

export interface Share {
  id: string;
  fileId: string;
  orgId: string;
  type: 'role' | 'user' | 'link';
  targetRole?: string;
  targetUserId?: string;
  shareToken?: string;
  permissions: string[];
  expiresAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  orgId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export class DB {
  public docClient = docClient;

  // Org operations
  async createOrg(org: Omit<Org, 'id' | 'createdAt'>): Promise<Org> {
    const id = uuidv4();
    const item: Org = {
      ...org,
      id,
      createdAt: new Date().toISOString(),
    };
    await docClient.send(new PutCommand({
      TableName: `${TABLE_PREFIX}-orgs`,
      Item: item,
    }));
    return item;
  }

  async getOrg(orgId: string): Promise<Org | null> {
    const { Item } = await docClient.send(new GetCommand({
      TableName: `${TABLE_PREFIX}-orgs`,
      Key: { id: orgId },
    }));
    return Item as Org | null;
  }

  async updateOrg(orgId: string, updates: Partial<Org>): Promise<void> {
    const updateExpr: string[] = [];
    const exprNames: Record<string, string> = {};
    const exprValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const nameKey = `#${key}`;
        const valueKey = `:${key}`;
        updateExpr.push(`${nameKey} = ${valueKey}`);
        exprNames[nameKey] = key;
        exprValues[valueKey] = value;
      }
    });

    await docClient.send(new UpdateCommand({
      TableName: `${TABLE_PREFIX}-orgs`,
      Key: { id: orgId },
      UpdateExpression: `SET ${updateExpr.join(', ')}`,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
    }));
  }

  // User operations
  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const id = uuidv4();
    const item: User = {
      ...user,
      id,
      createdAt: new Date().toISOString(),
    };
    await docClient.send(new PutCommand({
      TableName: `${TABLE_PREFIX}-users`,
      Item: item,
    }));
    return item;
  }

  async getUser(userId: string): Promise<User | null> {
    const { Item } = await docClient.send(new GetCommand({
      TableName: `${TABLE_PREFIX}-users`,
      Key: { id: userId },
    }));
    return Item as User | null;
  }

  async getUserByEmail(email: string, orgId: string): Promise<User | null> {
    const { Items } = await docClient.send(new QueryCommand({
      TableName: `${TABLE_PREFIX}-users`,
      IndexName: 'orgId-email-index',
      KeyConditionExpression: 'orgId = :orgId AND email = :email',
      ExpressionAttributeValues: {
        ':orgId': orgId,
        ':email': email,
      },
      Limit: 1,
    }));
    return Items?.[0] as User | null;
  }

  async listUsersByOrg(orgId: string): Promise<User[]> {
    const { Items } = await docClient.send(new QueryCommand({
      TableName: `${TABLE_PREFIX}-users`,
      IndexName: 'orgId-index',
      KeyConditionExpression: 'orgId = :orgId',
      ExpressionAttributeValues: {
        ':orgId': orgId,
      },
    }));
    return (Items || []) as User[];
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const updateExpr: string[] = [];
    const exprNames: Record<string, string> = {};
    const exprValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const nameKey = `#${key}`;
        const valueKey = `:${key}`;
        updateExpr.push(`${nameKey} = ${valueKey}`);
        exprNames[nameKey] = key;
        exprValues[valueKey] = value;
      }
    });

    await docClient.send(new UpdateCommand({
      TableName: `${TABLE_PREFIX}-users`,
      Key: { id: userId },
      UpdateExpression: `SET ${updateExpr.join(', ')}`,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
    }));
  }

  // File operations
  async createFile(file: Omit<File, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<File> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const item: File = {
      ...file,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
      isDeleted: false,
    };
    await docClient.send(new PutCommand({
      TableName: `${TABLE_PREFIX}-files`,
      Item: item,
    }));
    return item;
  }

  async getFile(fileId: string): Promise<File | null> {
    const { Item } = await docClient.send(new GetCommand({
      TableName: `${TABLE_PREFIX}-files`,
      Key: { id: fileId },
    }));
    return Item as File | null;
  }

  async listFiles(orgId: string, parentId?: string, includeDeleted = false): Promise<File[]> {
    const params: any = {
      TableName: `${TABLE_PREFIX}-files`,
      IndexName: 'orgId-parentId-index',
      KeyConditionExpression: 'orgId = :orgId',
      ExpressionAttributeValues: {
        ':orgId': orgId,
      },
    };

    if (parentId) {
      params.KeyConditionExpression += ' AND parentId = :parentId';
      params.ExpressionAttributeValues[':parentId'] = parentId;
    } else {
      params.FilterExpression = 'attribute_not_exists(parentId)';
    }

    if (!includeDeleted) {
      params.FilterExpression = (params.FilterExpression || '') + ' AND isDeleted = :isDeleted';
      params.ExpressionAttributeValues[':isDeleted'] = false;
    }

    const { Items } = await docClient.send(new QueryCommand(params));
    return (Items || []) as File[];
  }

  async deleteFile(fileId: string): Promise<void> {
    await docClient.send(new UpdateCommand({
      TableName: `${TABLE_PREFIX}-files`,
      Key: { id: fileId },
      UpdateExpression: 'SET isDeleted = :isDeleted, deletedAt = :deletedAt',
      ExpressionAttributeValues: {
        ':isDeleted': true,
        ':deletedAt': new Date().toISOString(),
      },
    }));
  }

  // Share operations
  async createShare(share: Omit<Share, 'id' | 'createdAt'>): Promise<Share> {
    const id = uuidv4();
    const item: Share = {
      ...share,
      id,
      createdAt: new Date().toISOString(),
    };
    await docClient.send(new PutCommand({
      TableName: `${TABLE_PREFIX}-shares`,
      Item: item,
    }));
    return item;
  }

  // Audit operations
  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const id = uuidv4();
    const item: AuditLog = {
      ...log,
      id,
      timestamp: new Date().toISOString(),
    };
    await docClient.send(new PutCommand({
      TableName: `${TABLE_PREFIX}-audit`,
      Item: item,
    }));
    return item;
  }

  async queryAuditLogs(orgId: string, startDate?: string, endDate?: string): Promise<AuditLog[]> {
    const params: any = {
      TableName: `${TABLE_PREFIX}-audit`,
      IndexName: 'orgId-timestamp-index',
      KeyConditionExpression: 'orgId = :orgId',
      ExpressionAttributeValues: {
        ':orgId': orgId,
      },
    };

    if (startDate) {
      params.KeyConditionExpression += ' AND #timestamp >= :startDate';
      params.ExpressionAttributeNames = { '#timestamp': 'timestamp' };
      params.ExpressionAttributeValues[':startDate'] = startDate;
    }

    if (endDate) {
      params.KeyConditionExpression += ' AND #timestamp <= :endDate';
      if (!params.ExpressionAttributeNames) params.ExpressionAttributeNames = {};
      params.ExpressionAttributeNames['#timestamp'] = 'timestamp';
      params.ExpressionAttributeValues[':endDate'] = endDate;
    }

    const { Items } = await docClient.send(new QueryCommand(params));
    return (Items || []) as AuditLog[];
  }
}

export const db = new DB();

