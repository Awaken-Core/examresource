import { describe, expect, it } from 'vitest';
import { normalizeTestsPayload } from '../src/lib/testList';

describe('normalizeTestsPayload', () => {
  it('accepts legacy array payloads', () => {
    const parsed = normalizeTestsPayload([{ id: '1' }, { id: '2' }]);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.total).toBe(2);
    expect(parsed.hasMore).toBe(false);
  });

  it('accepts paginated object payloads', () => {
    const parsed = normalizeTestsPayload({
      data: [{ id: 'a' }],
      total: 45,
      page: 1,
      limit: 20,
      totalPages: 3,
    });
    expect(parsed.items).toHaveLength(1);
    expect(parsed.total).toBe(45);
    expect(parsed.hasMore).toBe(true);
  });

  it('handles empty / invalid payloads safely', () => {
    expect(normalizeTestsPayload(null).items).toEqual([]);
    expect(normalizeTestsPayload(undefined).total).toBe(0);
    expect(normalizeTestsPayload({}).items).toEqual([]);
  });
});
