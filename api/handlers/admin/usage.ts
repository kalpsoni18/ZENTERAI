import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAuth, getOrgFromContext } from '../../lib/auth';
import { db } from '../../lib/db';
import { hasPermission } from '../../lib/rbac';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await verifyAuth(event);
    const org = await getOrgFromContext(user.orgId);

    if (!hasPermission(user, 'org', 'read')) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    // Get all files for org
    const files = await db.listFiles(org.id, undefined, false);
    
    // Calculate storage used
    const storageUsedGB = files.reduce((total, file) => {
      return total + (file.size || 0) / (1024 * 1024 * 1024);
    }, 0);

    // Get users count
    const users = await db.listUsersByOrg(org.id);
    const activeUsers = users.filter(u => u.status === 'active');

    // Get recent activity (last 10)
    const auditLogs = await db.queryAuditLogs(org.id);
    const recentActivity = auditLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map(log => ({
        id: log.id,
        action: log.action,
        user: log.userId, // Would need to resolve to email
        timestamp: log.timestamp,
        resource: log.resourceType,
      }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        storageUsedGB: Math.round(storageUsedGB * 100) / 100,
        storageQuotaGB: org.settings.storageQuotaGB,
        filesCount: files.length,
        usersCount: activeUsers.length,
        recentActivity,
      }),
    };
  } catch (error: any) {
    console.error('Usage error:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
}

