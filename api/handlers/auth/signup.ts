import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { db } from '../../lib/db';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { email, password, orgName } = JSON.parse(event.body || '{}');

    if (!email || !password || !orgName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Create organization
    const org = await db.createOrg({
      name: orgName,
      settings: {
        storageQuotaGB: parseFloat(process.env.DEFAULT_STORAGE_QUOTA_GB || '200'),
        isolationMode: (process.env.STORAGE_ISOLATION_MODE || 'prefix') as 'prefix' | 'bucket',
        s3Prefix: `org-${Date.now()}`,
        encryptionMode: 'sse-kms',
        kmsKeyId: process.env.KMS_KEY_ID,
      },
      billing: {
        plan: 'starter',
        status: 'trialing',
      },
    });

    // Create Cognito user
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'custom:orgId', Value: org.id },
      ],
      MessageAction: 'SUPPRESS',
    });

    const cognitoUser = await cognitoClient.send(createUserCommand);

    // Set password
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    }));

    // Create user record
    const user = await db.createUser({
      email,
      orgId: org.id,
      role: 'Owner',
      cognitoUserId: cognitoUser.User?.Username || email,
      status: 'active',
    });

    // Audit log
    await db.createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: 'org.created',
      resourceType: 'org',
      resourceId: org.id,
      metadata: { orgName, email },
      ipAddress: event.requestContext.identity.sourceIp,
      userAgent: event.headers['user-agent'],
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        orgId: org.id,
        userId: user.id,
        email,
      }),
    };
  } catch (error: any) {
    console.error('Signup error:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
}

