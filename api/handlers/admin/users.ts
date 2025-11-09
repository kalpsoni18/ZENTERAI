import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAuth, getOrgFromContext } from '../../lib/auth';
import { db } from '../../lib/db';
import { hasPermission, canManageUser } from '../../lib/rbac';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await verifyAuth(event);
    const org = await getOrgFromContext(user.orgId);

    if (!hasPermission(user, 'users', 'read')) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    if (event.httpMethod === 'GET') {
      // List users
      const users = await db.listUsersByOrg(org.id);
      return {
        statusCode: 200,
        body: JSON.stringify({
          users: users.map(u => ({
            id: u.id,
            email: u.email,
            role: u.role,
            status: u.status,
            createdAt: u.createdAt,
            lastLoginAt: u.lastLoginAt,
          })),
        }),
      };
    }

    if (event.httpMethod === 'PATCH') {
      // Update user role
      const userId = event.pathParameters?.userId;
      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing userId' }),
        };
      }

      const { role } = JSON.parse(event.body || '{}');
      if (!role) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing role' }),
        };
      }

      const targetUser = await db.getUser(userId);
      if (!targetUser || targetUser.orgId !== org.id) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'User not found' }),
        };
      }

      if (!canManageUser(user, targetUser)) {
        return {
          statusCode: 403,
          body: JSON.stringify({ error: 'Cannot manage this user' }),
        };
      }

      await db.updateUser(userId, { role: role as any });

      // Audit log
      await db.createAuditLog({
        orgId: org.id,
        userId: user.id,
        action: 'user.role.updated',
        resourceType: 'user',
        resourceId: userId,
        metadata: { newRole: role, targetUser: targetUser.email },
        ipAddress: event.requestContext.identity.sourceIp,
        userAgent: event.headers['user-agent'],
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'User role updated' }),
      };
    }

    if (event.httpMethod === 'DELETE') {
      // Remove user
      const userId = event.pathParameters?.userId;
      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing userId' }),
        };
      }

      const targetUser = await db.getUser(userId);
      if (!targetUser || targetUser.orgId !== org.id) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'User not found' }),
        };
      }

      if (!canManageUser(user, targetUser)) {
        return {
          statusCode: 403,
          body: JSON.stringify({ error: 'Cannot remove this user' }),
        };
      }

      await db.updateUser(userId, { status: 'suspended' });

      // Audit log
      await db.createAuditLog({
        orgId: org.id,
        userId: user.id,
        action: 'user.removed',
        resourceType: 'user',
        resourceId: userId,
        metadata: { targetUser: targetUser.email },
        ipAddress: event.requestContext.identity.sourceIp,
        userAgent: event.headers['user-agent'],
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'User removed' }),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error: any) {
    console.error('Admin users error:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
}

