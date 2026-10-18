import { BadRequestException, ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import type { Metadata } from 'sharp';
import { env } from '../../core/config/env.js';
import type { CurrentUser } from '../auth/auth.service.js';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_COMPRESSED_BYTES = 100 * 1024; // 102,400 bytes strict limit
const imageExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const STATIC_PASSES = [
  { maxWidth: 1600, maxHeight: 1600, quality: 82 },
  { maxWidth: 1400, maxHeight: 1400, quality: 72 },
  { maxWidth: 1200, maxHeight: 1200, quality: 60 },
  { maxWidth: 1000, maxHeight: 1000, quality: 50 },
  { maxWidth: 800, maxHeight: 800, quality: 40 },
  { maxWidth: 640, maxHeight: 640, quality: 32 },
];

const ANIMATED_PASSES = [
  { maxWidth: 800, maxHeight: 800, quality: 70 },
  { maxWidth: 640, maxHeight: 640, quality: 55 },
  { maxWidth: 480, maxHeight: 480, quality: 42 },
  { maxWidth: 360, maxHeight: 360, quality: 30 },
];

@Injectable()
export class MediaService {
  private readonly client = this.createClient();

  async uploadCompressedImage(
    user: CurrentUser,
    file: { buffer: Buffer; originalname?: string; size: number; mimetype?: string },
  ) {
    if (user.role === 'student') {
      throw new ForbiddenException('Editor access is required to upload images.');
    }
    if (!this.client || !env.R2_BUCKET || !env.R2_PUBLIC_BASE_URL) {
      throw new ServiceUnavailableException('Media storage is not configured.');
    }
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('No image file provided.');
    }

    // 1. Validate actual file content (do not trust client MIME type or filename)
    let metadata: Metadata;
    try {
      metadata = await sharp(file.buffer).metadata();
    } catch {
      throw new BadRequestException('The uploaded file is corrupt or not a recognized image.');
    }

    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif', 'tiff'];
    if (!metadata.format || !supportedFormats.includes(metadata.format.toLowerCase())) {
      throw new BadRequestException(
        `Unsupported image format (${metadata.format || 'unknown'}). Supported formats: JPEG, PNG, WebP, GIF, and AVIF.`,
      );
    }

    // 2. Handle animated images deliberately
    const isAnimated = Boolean(metadata.pages && metadata.pages > 1);

    // 3. Bounded compression passes with strict byte limit condition (< 100 KB)
    const passes = isAnimated ? ANIMATED_PASSES : STATIC_PASSES;
    let finalBuffer: Buffer | null = null;

    for (const pass of passes) {
      let pipeline = sharp(file.buffer, isAnimated ? { animated: true } : {});

      const origW = metadata.width ?? 0;
      const origH = isAnimated
        ? (metadata.pageHeight ?? (metadata.height ? Math.round(metadata.height / (metadata.pages || 1)) : 0))
        : (metadata.height ?? 0);

      if (origW > pass.maxWidth || origH > pass.maxHeight) {
        pipeline = pipeline.resize({
          width: pass.maxWidth,
          height: isAnimated ? undefined : pass.maxHeight,
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Preserve transparency (no .flatten())
      const candidateBuffer = await pipeline
        .webp({
          quality: pass.quality,
          effort: 6,
          alphaQuality: 85,
        })
        .toBuffer();

      // Final condition: strictly under 100 KB
      if (candidateBuffer.length < MAX_COMPRESSED_BYTES) {
        finalBuffer = candidateBuffer;
        break;
      }
    }

    // If all bounded passes fail, reject instead of uploading oversized image
    if (!finalBuffer || finalBuffer.length >= MAX_COMPRESSED_BYTES) {
      if (isAnimated) {
        throw new BadRequestException(
          'Animated image could not be compressed under 100 KB. Please reduce the dimensions, resolution, or frame count.',
        );
      }
      throw new BadRequestException(
        'Image could not be compressed under 100 KB while maintaining acceptable visual quality. Please choose a smaller image.',
      );
    }

    // 4. Upload compressed WebP directly to Cloudflare R2
    const key = `blog-images/${user.id}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.webp`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: finalBuffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
        ContentDisposition: 'inline',
      }),
    );

    const publicUrl = `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
    return {
      publicUrl,
      uploadUrl: publicUrl,
      key,
      originalSize: file.size,
      compressedSize: finalBuffer.length,
      format: 'webp',
    };
  }

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
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        ContentType: contentType,
      }),
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
