import { describe, expect, it, vi, beforeEach } from 'vitest';
import sharp from 'sharp';
import { MediaService } from './media.service.js';
import type { CurrentUser } from '../auth/auth.service.js';

describe('MediaService image compression', () => {
  let service: MediaService;
  const mockUser: CurrentUser = {
    id: 'user-123',
    name: 'Admin User',
    email: 'admin@example.com',
    phone: null,
    role: 'admin',
    emailVerified: true,
  };

  beforeEach(() => {
    service = new MediaService();
    // Mock the S3 send method
    (service as any).client = {
      send: vi.fn().mockResolvedValue({ $metadata: { httpStatusCode: 200 } }),
    };
  });

  it('should compress a large image to WebP under 100 KB and preserve transparency', async () => {
    // Generate a transparent high-res PNG image
    const svg = `
      <svg width="2400" height="1800" xmlns="http://www.w3.org/2000/svg">
        <rect width="2400" height="1800" fill="none" />
        <circle cx="1200" cy="900" r="600" fill="rgba(255, 99, 71, 0.6)" />
        <rect x="400" y="300" width="800" height="600" fill="rgba(30, 144, 255, 0.7)" />
      </svg>
    `;
    const largePngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    expect(largePngBuffer.length).toBeGreaterThan(5000);

    const result = await service.uploadCompressedImage(mockUser, {
      buffer: largePngBuffer,
      originalname: 'test-diagram.png',
      size: largePngBuffer.length,
      mimetype: 'image/png',
    });

    expect(result.format).toBe('webp');
    expect(result.compressedSize).toBeLessThan(102400); // Strict byte limit: < 100 KB
    expect(result.publicUrl).toContain('.webp');

    // Verify S3 send was called with the compressed buffer and WebP ContentType
    const sendMock = (service as any).client.send;
    expect(sendMock).toHaveBeenCalledTimes(1);
    const putCommand = sendMock.mock.calls[0][0];
    expect(putCommand.input.ContentType).toBe('image/webp');
    expect(putCommand.input.Body.length).toBeLessThan(102400);

    // Verify the output buffer retains alpha channel
    const outputMeta = await sharp(putCommand.input.Body).metadata();
    expect(outputMeta.format).toBe('webp');
    expect(outputMeta.hasAlpha).toBe(true);
  });

  it('should reject non-image or corrupt buffers', async () => {
    const corruptBuffer = Buffer.from('this is not an image file');

    await expect(
      service.uploadCompressedImage(mockUser, {
        buffer: corruptBuffer,
        originalname: 'fake.png',
        size: corruptBuffer.length,
        mimetype: 'image/png',
      }),
    ).rejects.toThrow('The uploaded file is corrupt or not a recognized image.');
  });

  it('should reject empty buffers', async () => {
    await expect(
      service.uploadCompressedImage(mockUser, {
        buffer: Buffer.alloc(0),
        originalname: 'empty.png',
        size: 0,
        mimetype: 'image/png',
      }),
    ).rejects.toThrow('No image file provided.');
  });

  it('should block SSRF attempts to private and metadata IPs in uploadFromUrl', async () => {
    await expect(
      service.uploadFromUrl(mockUser, 'http://169.254.169.254/latest/meta-data/'),
    ).rejects.toThrow();

    await expect(
      service.uploadFromUrl(mockUser, 'http://127.0.0.1:27017'),
    ).rejects.toThrow();

    await expect(
      service.uploadFromUrl(mockUser, 'http://localhost:3000'),
    ).rejects.toThrow();
  });
});
