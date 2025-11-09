import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { verifyAuth, getOrgFromContext } from '../../lib/auth';
import { db } from '../../lib/db';
import { hasPermission } from '../../lib/rbac';
import { v4 as uuidv4 } from 'uuid';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await verifyAuth(event);
    const org = await getOrgFromContext(user.orgId);

    if (!hasPermission(user, 'shares', 'create')) {
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

    const { role, email, expiresAt, permissions } = JSON.parse(event.body || '{}');

    // Get file
    const file = await db.getFile(fileId);
    if (!file || file.orgId !== org.id) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'File not found' }),
      };
    }

    // Determine share type
    let shareType: 'role' | 'user' | 'link' = 'link';
    let targetRole: string | undefined;
    let targetUserId: string | undefined;
    let shareToken: string | undefined;

    if (role) {
      shareType = 'role';
      targetRole = role;
    } else if (email) {
      shareType = 'user';
      const targetUser = await db.getUserByEmail(email, org.id);
      if (!targetUser) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'User not found' }),
        };
      }
      targetUserId = targetUser.id;
    } else {
      shareToken = uuidv4();
    }

    // Create share
    const share = await db.createShare({
      fileId,
      orgId: org.id,
      type: shareType,
      targetRole,
      targetUserId,
      shareToken,
      permissions: permissions || ['read'],
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      createdBy: user.id,
    });

    // Audit log
    await db.createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: 'file.shared',
      resourceType: 'share',
      resourceId: share.id,
      metadata: { fileId, shareType, targetRole, targetUserId },
      ipAddress: event.requestContext.identity.sourceIp,
      userAgent: event.headers['user-agent'],
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        shareId: share.id,
        shareToken: share.shareToken,
        expiresAt: share.expiresAt,
      }),
    };
  } catch (error: any) {
    console.error('Share file error:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
}

