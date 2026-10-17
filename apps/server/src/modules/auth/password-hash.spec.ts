import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password-hash.js';

describe('Worker-compatible password hashing', () => {
  it('hashes and verifies a password without native Node modules', async () => {
    const hash = await hashPassword('correct horse battery staple');

    expect(hash).toMatch(/^pbkdf2-sha256\$600000\$/);
    await expect(verifyPassword(hash, 'correct horse battery staple')).resolves.toBe(true);
    await expect(verifyPassword(hash, 'wrong password')).resolves.toBe(false);
  });

  it('rejects unsupported legacy hash formats', async () => {
    await expect(verifyPassword('$argon2id$legacy', 'password')).resolves.toBe(false);
  });
});
