import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { db } from '../../lib/db';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing email or password' }),
      };
    }

    // Authenticate with Cognito
    const authCommand = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const authResult = await cognitoClient.send(authCommand);

    if (!authResult.AuthenticationResult) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid credentials' }),
      };
    }

    // Get user from database - simplified, would need proper query
    const users = await db.listUsersByOrg(''); // This needs orgId, simplified for now
    const user = users.find(u => u.email === email);

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Update last login
    await db.updateUser(user.id, {
      lastLoginAt: new Date().toISOString(),
    });

    // Audit log
    await db.createAuditLog({
      orgId: user.orgId,
      userId: user.id,
      action: 'auth.login',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: event.requestContext.identity.sourceIp,
      userAgent: event.headers['user-agent'],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        accessToken: authResult.AuthenticationResult.AccessToken,
        idToken: authResult.AuthenticationResult.IdToken,
        refreshToken: authResult.AuthenticationResult.RefreshToken,
        expiresIn: authResult.AuthenticationResult.ExpiresIn,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
        },
      }),
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
}

