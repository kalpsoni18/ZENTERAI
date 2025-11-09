import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { verifyAuth, getOrgFromContext } from '../../lib/auth';
import { db } from '../../lib/db';
import { hasPermission } from '../../lib/rbac';
import { getS3Key, getS3Bucket } from '../../lib/storage';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const PART_SIZE = 5 * 1024 * 1024; // 5MB

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await verifyAuth(event);
    const org = await getOrgFromContext(user.orgId);

    if (!hasPermission(user, 'files', 'create')) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const { fileName, fileSize, contentType, parentPath } = JSON.parse(event.body || '{}');

    if (!fileName || !fileSize || !contentType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Calculate number of parts
    const partCount = Math.ceil(fileSize / PART_SIZE);

    // Generate S3 key based on org isolation mode
    const s3Key = getS3Key(org, fileName, parentPath);
    const bucket = getS3Bucket(org);

    // Create multipart upload
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: s3Key,
      ContentType: contentType,
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: org.settings.kmsKeyId || process.env.KMS_KEY_ID,
      Metadata: {
        orgId: org.id,
        userId: user.id,
        fileName,
      },
    });

    const { UploadId } = await s3Client.send(createCommand);

    // Generate presigned URLs for each part
    const parts = [];
    for (let partNumber = 1; partNumber <= partCount; partNumber++) {
      const uploadPartCommand = new UploadPartCommand({
        Bucket: bucket,
        Key: s3Key,
        PartNumber: partNumber,
        UploadId,
      });

      const presignedUrl = await getSignedUrl(s3Client, uploadPartCommand, { expiresIn: 3600 });
      parts.push({ partNumber, url: presignedUrl });
    }

    // Create file record
    const file = await db.createFile({
      orgId: org.id,
      name: fileName,
      path: parentPath || '/',
      type: 'file',
      size: fileSize,
      contentType,
      s3Key,
      createdBy: user.id,
    });

    // Audit log
    await db.createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: 'file.upload.initiated',
      resourceType: 'file',
      resourceId: file.id,
      metadata: { fileName, fileSize, contentType },
      ipAddress: event.requestContext.identity.sourceIp,
      userAgent: event.headers['user-agent'],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        uploadId: UploadId,
        fileId: file.id,
        s3Key,
        parts,
        partSize: PART_SIZE,
      }),
    };
  } catch (error: any) {
    console.error('Upload sign error:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
}

