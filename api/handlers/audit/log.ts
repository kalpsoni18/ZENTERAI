import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAuth, getOrgFromContext } from '../../lib/auth';
import { db } from '../../lib/db';
import { hasPermission } from '../../lib/rbac';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await verifyAuth(event);
    const org = await getOrgFromContext(user.orgId);

    if (!hasPermission(user, 'audit', 'read')) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const startDate = event.queryStringParameters?.startDate;
    const endDate = event.queryStringParameters?.endDate;

    const logs = await db.queryAuditLogs(org.id, startDate, endDate);

    return {
      statusCode: 200,
      body: JSON.stringify({
        logs: logs.map(log => ({
          id: log.id,
          action: log.action,
          userId: log.userId,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          metadata: log.metadata,
          timestamp: log.timestamp,
        })),
        count: logs.length,
      }),
    };
  } catch (error: any) {
    console.error('Audit log error:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
}

