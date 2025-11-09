import { APIGatewayProxyEvent } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { db, User, Org } from './db';

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'access',
  clientId: CLIENT_ID,
});

export interface AuthContext {
  userId: string;
  email: string;
  orgId: string;
  role: string;
  cognitoUserId: string;
}

export async function verifyAuth(event: APIGatewayProxyEvent): Promise<User> {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const payload = await verifier.verify(token);
    
    // Get user from database
    const cognitoUserId = payload.sub;
    const user = await findUserByCognitoId(cognitoUserId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'active') {
      throw new Error('User account is not active');
    }

    return user;
  } catch (error: any) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

async function findUserByCognitoId(cognitoUserId: string): Promise<User | null> {
  // Query DynamoDB - you'd need a GSI on cognitoUserId
  // For now, simplified version using scan (not recommended for production)
  const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
  const { Items } = await db.docClient.send(new ScanCommand({
    TableName: `${process.env.DYNAMODB_TABLE_PREFIX}-users`,
    FilterExpression: 'cognitoUserId = :cognitoUserId',
    ExpressionAttributeValues: {
      ':cognitoUserId': cognitoUserId,
    },
    Limit: 1,
  }));

  return Items?.[0] as User | null;
}

export async function getOrgFromContext(orgId: string): Promise<Org> {
  const org = await db.getOrg(orgId);
  if (!org) {
    throw new Error('Organization not found');
  }
  return org;
}

