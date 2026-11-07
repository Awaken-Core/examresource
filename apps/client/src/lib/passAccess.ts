/**
 * Client-Side Pass Access Cache
 *
 * Provides instant (<1ms) optimistic authorization state for Test Series & All-Access Passes.
 * Eliminates the 2-5 second delay, test lock flashing, and two-column layout shift on page visit.
 *
 * SECURITY NOTE:
 * This client-side cache is strictly for INSTANT PRESENTATION & OPTIMISTIC RENDERING.
 * Even if a user manually edits localStorage, the NestJS server strictly enforces pass validity
 * directly against the MongoDB database (`test_series_passes`) in `TestSeriesAccessService.assertCanStart()`
 * whenever a user attempts to start or submit any exam (`POST /api/v1/exams/:id/start`).
 * Unauthorized requests are immediately blocked with HTTP 402 PAYMENT_REQUIRED on the backend.
 */

import { getCachedCurrentUser } from './api';

export interface CachedSeriesAccess {
  hasActivePass: boolean;
  passType?: 'series' | 'all' | null;
  expiresAt: string | null;
  sectionTrials?: {
    full?: { used: boolean; attemptId?: string; examId?: string };
    subject?: { used: boolean; attemptId?: string; examId?: string };
    chapter?: { used: boolean; attemptId?: string; examId?: string };
    pyq?: { used: boolean; attemptId?: string; examId?: string };
  };
  freeTestId: string | null;
  seriesIdOrSlug?: string;
  cachedAt: number;
}

const PASS_CACHE_PREFIX = 'gp_pass_';
const GLOBAL_PASS_KEY = 'gp_global_pass_active';

export function getCachedSeriesAccess(seriesIdOrSlug?: string): CachedSeriesAccess | null {
  if (typeof window === 'undefined') return null;
  try {
    const user = getCachedCurrentUser();
    if (!user?.id) return null;

    // 1. Check if user has a valid All-Access Pass (applies to ALL test series)
    const globalRaw = localStorage.getItem(`${GLOBAL_PASS_KEY}_${user.id}`);
    if (globalRaw) {
      const globalData = JSON.parse(globalRaw) as CachedSeriesAccess;
      const isExpired = globalData.expiresAt && new Date(globalData.expiresAt).getTime() <= Date.now();
      if (!isExpired && globalData.hasActivePass && globalData.passType === 'all') {
        return globalData;
      }
    }

    // 2. Check if user has a series-specific pass cached
    if (seriesIdOrSlug) {
      const specificRaw = localStorage.getItem(`${PASS_CACHE_PREFIX}${user.id}_${seriesIdOrSlug.toLowerCase()}`);
      if (specificRaw) {
        const specificData = JSON.parse(specificRaw) as CachedSeriesAccess;
        const isExpired = specificData.expiresAt && new Date(specificData.expiresAt).getTime() <= Date.now();
        if (!isExpired) {
          return specificData;
        }
      }
    }
  } catch {
    // Non-fatal if localStorage is restricted
  }
  return null;
}

export function setCachedSeriesAccess(seriesIdOrSlug: string, access: Partial<CachedSeriesAccess>): void {
  if (typeof window === 'undefined') return;
  try {
    const user = getCachedCurrentUser();
    if (!user?.id) return;

    const payload: CachedSeriesAccess = {
      hasActivePass: Boolean(access.hasActivePass),
      passType: access.passType ?? null,
      expiresAt: access.expiresAt ?? null,
      sectionTrials: access.sectionTrials,
      freeTestId: access.freeTestId ?? null,
      seriesIdOrSlug,
      cachedAt: Date.now(),
    };

    if (seriesIdOrSlug) {
      localStorage.setItem(`${PASS_CACHE_PREFIX}${user.id}_${seriesIdOrSlug.toLowerCase()}`, JSON.stringify(payload));
    }

    // If it's an All-Access Pass, cache it globally for this user
    if (payload.hasActivePass && payload.passType === 'all') {
      localStorage.setItem(`${GLOBAL_PASS_KEY}_${user.id}`, JSON.stringify(payload));
    }
  } catch {
    // Non-fatal
  }
}

export function clearCachedPassAccess(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(PASS_CACHE_PREFIX) || key.startsWith(GLOBAL_PASS_KEY))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Non-fatal
  }
}

