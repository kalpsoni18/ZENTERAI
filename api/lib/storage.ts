import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Org } from './db';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export function getS3Key(org: Org, fileName: string, path: string = '/'): string {
  if (org.settings.isolationMode === 'bucket') {
    return fileName;
  }
  const prefix = org.settings.s3Prefix || `org-${org.id}`;
  const cleanPath = path === '/' ? '' : path.replace(/^\//, '').replace(/\/$/, '');
  return cleanPath ? `${prefix}/${cleanPath}/${fileName}` : `${prefix}/${fileName}`;
}

export function getS3Bucket(org: Org): string {
  if (org.settings.isolationMode === 'bucket') {
    return org.settings.s3Bucket || `${BUCKET_NAME}-org-${org.id}`;
  }
  return BUCKET_NAME;
}

export async function getPresignedUrl(org: Org, s3Key: string, operation: 'get' | 'put' | 'delete'): Promise<string> {
  const bucket = getS3Bucket(org);
  
  let command;
  switch (operation) {
    case 'get':
      command = new GetObjectCommand({ Bucket: bucket, Key: s3Key });
      break;
    case 'put':
      command = new PutObjectCommand({ Bucket: bucket, Key: s3Key });
      break;
    case 'delete':
      command = new DeleteObjectCommand({ Bucket: bucket, Key: s3Key });
      break;
  }

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

