import { describe, expect, it } from 'vitest';
import { AuthController } from './auth.controller.js';

describe('AuthController safeDeskReturn & redirect security', () => {
  const controller = new AuthController({} as any);

  it('allows safe local learner content paths like /blogs and /test-series', () => {
    expect(controller.safeDeskReturn('/blogs')).toBe('/blogs');
    expect(controller.safeDeskReturn('/blogs/upsc-civil-services-2025')).toBe('/blogs/upsc-civil-services-2025');
    expect(controller.safeDeskReturn('/blogs?category=exam-news#latest')).toBe('/blogs?category=exam-news#latest');
    expect(controller.safeDeskReturn('/test-series')).toBe('/test-series');
    expect(controller.safeDeskReturn('/test-series/cbt/attempt-123')).toBe('/test-series/cbt/attempt-123');
    expect(controller.safeDeskReturn('/categories')).toBe('/categories');
    expect(controller.safeDeskReturn('/bookmarks')).toBe('/bookmarks');
  });

  it('allows safe staff desk paths', () => {
    expect(controller.safeDeskReturn('/administrator')).toBe('/administrator');
    expect(controller.safeDeskReturn('/administrator/users')).toBe('/administrator/users');
    expect(controller.safeDeskReturn('/editor')).toBe('/editor');
  });

  it('rejects external open redirects and protocol-relative URLs', () => {
    expect(controller.safeDeskReturn('//evil.com')).toBeNull();
    expect(controller.safeDeskReturn('https://evil.com/blogs')).toBeNull();
    expect(controller.safeDeskReturn('http://evil.com')).toBeNull();
    expect(controller.safeDeskReturn('javascript:alert(1)')).toBeNull();
    expect(controller.safeDeskReturn('/\\evil.com')).toBeNull();
    expect(controller.safeDeskReturn('/foo://bar')).toBeNull();
    expect(controller.safeDeskReturn(undefined)).toBeNull();
    expect(controller.safeDeskReturn('')).toBeNull();
  });

  it('rejects loopback redirection into auth and api endpoints', () => {
    expect(controller.safeDeskReturn('/login')).toBeNull();
    expect(controller.safeDeskReturn('/login?redirect=/blogs')).toBeNull();
    expect(controller.safeDeskReturn('/signup')).toBeNull();
    expect(controller.safeDeskReturn('/logout')).toBeNull();
    expect(controller.safeDeskReturn('/auth/google')).toBeNull();
    expect(controller.safeDeskReturn('/api/v1/auth/login')).toBeNull();
  });

  it('correctly identifies staff-only routes', () => {
    expect(controller.isStaffPath('/administrator')).toBe(true);
    expect(controller.isStaffPath('/administrator/users')).toBe(true);
    expect(controller.isStaffPath('/editor')).toBe(true);
    expect(controller.isStaffPath('/blogs')).toBe(false);
    expect(controller.isStaffPath('/test-series')).toBe(false);
  });
});
