import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { verifyAuth, getOrgFromContext } from '../../lib/auth';
import { db } from '../../lib/db';
import { hasPermission } from '../../lib/rbac';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;
const INVITE_SECRET = process.env.INVITE_SECRET || 'change-me-in-production';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await verifyAuth(event);
    const org = await getOrgFromContext(user.orgId);

    if (!hasPermission(user, 'users', 'create')) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const { email, role } = JSON.parse(event.body || '{}');

    if (!email || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing email or role' }),
      };
    }

    // Validate role
    const validRoles = ['Admin', 'Manager', 'Member', 'Guest'];
    if (!validRoles.includes(role)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid role' }),
      };
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email, org.id);
    if (existingUser) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'User already exists' }),
      };
    }

    // Generate invite token
    const inviteToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Create Cognito user (temporary password)
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'false' },
        { Name: 'custom:orgId', Value: org.id },
      ],
      TemporaryPassword: tempPassword,
      MessageAction: 'SUPPRESS',
    });

    await cognitoClient.send(createUserCommand);

    // Create user record
    const newUser = await db.createUser({
      email,
      orgId: org.id,
      role: role as any,
      cognitoUserId: email,
      status: 'invited',
      inviteToken,
      inviteExpiresAt: expiresAt.toISOString(),
    });

    // Audit log
    await db.createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: 'user.invited',
      resourceType: 'user',
      resourceId: newUser.id,
      metadata: { email, role, invitedBy: user.email },
      ipAddress: event.requestContext.identity.sourceIp,
      userAgent: event.headers['user-agent'],
    });

    // TODO: Send invite email with token

    return {
      statusCode: 201,
      body: JSON.stringify({
        userId: newUser.id,
        email,
        role,
        inviteToken,
        expiresAt: expiresAt.toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('Invite error:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
}

