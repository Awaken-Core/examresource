import { BadRequestException, ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { env } from '../../core/config/env.js';
import type { CurrentUser } from '../clerk-auth/clerk-auth.service.js';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const imageExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class MediaService {
  private readonly client = this.createClient();

  async listMedia(user: CurrentUser, prefix = 'blog-images/') {
    if (user.role === 'student') {
      throw new ForbiddenException('Editor access is required to access media library.');
    }
    if (!this.client || !env.R2_BUCKET || !env.R2_PUBLIC_BASE_URL) {
      throw new ServiceUnavailableException('Media storage is not configured.');
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: env.R2_BUCKET,
        Prefix: prefix,
        MaxKeys: 100,
      });
      const response = await this.client.send(command);
      const baseUrl = env.R2_PUBLIC_BASE_URL.replace(/\/$/, '');

      const items = (response.Contents || [])
        .filter((item) => item.Key && !item.Key.endsWith('/'))
        .sort((a, b) => (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0))
        .map((item) => {
          const key = item.Key!;
          const filename = key.split('/').pop() || key;
          return {
            key,
            url: `${baseUrl}/${key}`,
            filename,
            size: item.Size ?? 0,
            lastModified: item.LastModified?.toISOString() ?? new Date().toISOString(),
          };
        });

      return { items };
    } catch (error: any) {
      throw new ServiceUnavailableException(error.message || 'Failed to list media items from storage.');
    }
  }

  async createImageUploadUrl(
    user: CurrentUser,
    input: { contentType?: unknown; size?: unknown },
  ) {
    if (user.role === 'student') {
      throw new ForbiddenException('Editor access is required to upload images.');
    }
    if (!this.client || !env.R2_BUCKET || !env.R2_PUBLIC_BASE_URL) {
      throw new ServiceUnavailableException('Image uploads are not configured.');
    }

    const contentType = typeof input.contentType === 'string' ? input.contentType.toLowerCase() : '';
    const size = typeof input.size === 'number' ? input.size : Number.NaN;
    const extension = imageExtensions[contentType];
    if (!extension) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and GIF images are supported.');
    }
    if (!Number.isInteger(size) || size < 1 || size > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException('Image size must be between 1 byte and 10 MB.');
    }

    const key = `blog-images/${user.id}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, ContentType: contentType }),
      { expiresIn: 300 },
    );

    return {
      uploadUrl,
      publicUrl: `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`,
      key,
      expiresIn: 300,
    };
  }

  private createClient() {
    if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
      return null;
    }
    return new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
}
