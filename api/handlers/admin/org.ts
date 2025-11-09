import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAuth, getOrgFromContext } from '../../lib/auth';
import { db } from '../../lib/db';
import { hasPermission, requireRole } from '../../lib/rbac';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await verifyAuth(event);
    const org = await getOrgFromContext(user.orgId);

    if (event.httpMethod === 'GET') {
      if (!hasPermission(user, 'org', 'read')) {
        return {
          statusCode: 403,
          body: JSON.stringify({ error: 'Insufficient permissions' }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          id: org.id,
          name: org.name,
          domain: org.domain,
          settings: org.settings,
          billing: org.billing,
          createdAt: org.createdAt,
        }),
      };
    }

    if (event.httpMethod === 'PATCH') {
      requireRole(user, 'Owner', 'Admin');

      const updates = JSON.parse(event.body || '{}');
      
      // Update org settings
      if (updates.settings) {
        await db.updateOrg(org.id, {
          settings: { ...org.settings, ...updates.settings },
        });
      }

      // Update org name
      if (updates.name) {
        await db.updateOrg(org.id, {
          name: updates.name,
        });
      }

      // Audit log
      await db.createAuditLog({
        orgId: org.id,
        userId: user.id,
        action: 'org.settings.updated',
        resourceType: 'org',
        resourceId: org.id,
        metadata: { updates },
        ipAddress: event.requestContext.identity.sourceIp,
        userAgent: event.headers['user-agent'],
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Organization updated' }),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error: any) {
    console.error('Admin org error:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
}

