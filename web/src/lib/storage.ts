import { api } from './api';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export async function uploadFile(
  file: File,
  parentPath: string = '/',
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  // Get presigned URLs
  const { uploadId, fileId, s3Key, parts, partSize } = await api.getUploadUrl(
    file.name,
    file.size,
    file.type,
    parentPath
  );

  // Upload each part
  const uploadPromises = parts.map(async (part: { partNumber: number; url: string }, index: number) => {
    const start = index * partSize;
    const end = Math.min(start + partSize, file.size);
    const blob = file.slice(start, end);

    const response = await fetch(part.url, {
      method: 'PUT',
      body: blob,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload part ${part.partNumber}`);
    }

    const etag = response.headers.get('ETag') || '';
    
    // Update progress
    if (onProgress) {
      onProgress({
        loaded: end,
        total: file.size,
        percentage: (end / file.size) * 100,
      });
    }

    return { PartNumber: part.partNumber, ETag: etag };
  });

  const uploadedParts = await Promise.all(uploadPromises);

  // Complete multipart upload
  await api.completeUpload(uploadId, fileId, uploadedParts);
}

