/** Normalize published-tests API payloads (legacy array or paginated object). */
export function normalizeTestsPayload(payload: unknown): {
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
} {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: 1,
      limit: payload.length || 20,
      totalPages: 1,
      hasMore: false,
    };
  }

  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>;
    const items = Array.isArray(body.data) ? body.data : [];
    const total = typeof body.total === 'number' ? body.total : items.length;
    const page = typeof body.page === 'number' ? body.page : 1;
    const limit = typeof body.limit === 'number' ? body.limit : items.length || 20;
    const totalPages =
      typeof body.totalPages === 'number'
        ? body.totalPages
        : Math.max(1, Math.ceil(total / Math.max(1, limit)));
    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  return { items: [], total: 0, page: 1, limit: 20, totalPages: 0, hasMore: false };
}

export const TESTS_API_PAGE_SIZE = 20;
