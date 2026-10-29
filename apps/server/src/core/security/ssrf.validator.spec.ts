import { describe, expect, it } from 'vitest';
import { assertSafeRemoteUrl, isPrivateOrReservedIp } from './ssrf.validator.js';

describe('SSRF Validator', () => {
  it('correctly identifies private and reserved IP addresses', () => {
    // IPv4 private/reserved
    expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('127.0.1.1')).toBe(true);
    expect(isPrivateOrReservedIp('10.0.0.5')).toBe(true);
    expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('172.31.255.255')).toBe(true);
    expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true);
    expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true);
    expect(isPrivateOrReservedIp('0.0.0.0')).toBe(true);
    expect(isPrivateOrReservedIp('255.255.255.255')).toBe(true);

    // IPv6 private/reserved
    expect(isPrivateOrReservedIp('::1')).toBe(true);
    expect(isPrivateOrReservedIp('fe80::1')).toBe(true);
    expect(isPrivateOrReservedIp('fc00::1')).toBe(true);
    expect(isPrivateOrReservedIp('::ffff:127.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('::ffff:192.168.1.1')).toBe(true);

    // Public IPs
    expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false);
    expect(isPrivateOrReservedIp('1.1.1.1')).toBe(false);
    expect(isPrivateOrReservedIp('104.16.132.229')).toBe(false);
  });

  it('rejects forbidden schemes and internal hostnames', async () => {
    await expect(assertSafeRemoteUrl('file:///etc/passwd')).rejects.toThrow();
    await expect(assertSafeRemoteUrl('ftp://example.com/image.png')).rejects.toThrow();
    await expect(assertSafeRemoteUrl('javascript:alert(1)')).rejects.toThrow();
    await expect(assertSafeRemoteUrl('http://localhost/image.png')).rejects.toThrow();
    await expect(assertSafeRemoteUrl('http://test.localhost:8080/')).rejects.toThrow();
    await expect(assertSafeRemoteUrl('http://internal.service.local/')).rejects.toThrow();
    await expect(assertSafeRemoteUrl('http://127.0.0.1:3000/api')).rejects.toThrow();
    await expect(assertSafeRemoteUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow();
    await expect(assertSafeRemoteUrl('http://[::1]:80/')).rejects.toThrow();
  });

  it('rejects alternative integer/octal/hex IP notations', async () => {
    await expect(assertSafeRemoteUrl('http://2130706433/')).rejects.toThrow();
    await expect(assertSafeRemoteUrl('http://0177.0.0.1/')).rejects.toThrow();
    await expect(assertSafeRemoteUrl('http://0x7f000001/')).rejects.toThrow();
  });

  it('allows safe public URLs', async () => {
    const parsed = await assertSafeRemoteUrl('https://images.unsplash.com/photo-1546410531-bb4caa6b424d');
    expect(parsed.hostname).toBe('images.unsplash.com');
  });
});

