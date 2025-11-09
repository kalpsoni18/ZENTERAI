import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAuth, getOrgFromContext } from '../../lib/auth';
import { db } from '../../lib/db';
import { hasPermission } from '../../lib/rbac';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await verifyAuth(event);
    const org = await getOrgFromContext(user.orgId);

    if (!hasPermission(user, 'files', 'delete')) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const fileId = event.pathParameters?.fileId;
    if (!fileId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing fileId' }),
      };
    }

    // Get file
    const file = await db.getFile(fileId);
    if (!file || file.orgId !== org.id) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'File not found' }),
      };
    }

    // Soft delete
    await db.deleteFile(fileId);

    // Audit log
    await db.createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: 'file.deleted',
      resourceType: 'file',
      resourceId: fileId,
      metadata: { fileName: file.name },
      ipAddress: event.requestContext.identity.sourceIp,
      userAgent: event.headers['user-agent'],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'File deleted successfully' }),
    };
  } catch (error: any) {
    console.error('Delete file error:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
}

