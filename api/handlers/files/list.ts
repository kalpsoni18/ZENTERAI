import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAuth, getOrgFromContext } from '../../lib/auth';
import { db } from '../../lib/db';
import { hasPermission } from '../../lib/rbac';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await verifyAuth(event);
    const org = await getOrgFromContext(user.orgId);

    if (!hasPermission(user, 'files', 'read')) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const path = event.queryStringParameters?.path || '/';
    const limit = parseInt(event.queryStringParameters?.limit || '100');

    // Get parent folder ID if path is not root
    let parentId: string | undefined;
    if (path !== '/') {
      // Find folder by path
      const pathParts = path.split('/').filter(p => p);
      // TODO: Implement path resolution
    }

    const files = await db.listFiles(org.id, parentId, false);

    // Filter based on user permissions and shares
    // TODO: Implement share filtering

    return {
      statusCode: 200,
      body: JSON.stringify({
        files: files.map(f => ({
          id: f.id,
          name: f.name,
          path: f.path,
          type: f.type,
          size: f.size,
          contentType: f.contentType,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
          version: f.version,
        })),
        count: files.length,
      }),
    };
  } catch (error: any) {
    console.error('List files error:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
}

