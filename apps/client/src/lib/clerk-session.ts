/**
 * Clerk session helpers for browser scripts.
 *
 * Clerk's development handshake can report `loaded: true` before the cookie
 * session is attached. Treating that as "logged out" bounced signed-in users
 * to /login, which then errored with "You're already signed in."
 */

export async function getReadyClerk(timeoutMs = 12_000): Promise<any | null> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const clerk = (window as Window & { Clerk?: any }).Clerk;
    if (clerk) {
      if (!clerk.loaded && typeof clerk.load === 'function') {
        try {
          await clerk.load();
        } catch {
          /* keep polling */
        }
      }
      if (clerk.loaded) return clerk;
    }
    await sleep(150);
  }
  return (window as Window & { Clerk?: any }).Clerk ?? null;
}

/** Wait through Clerk's handshake, then return a session JWT or null. */
export async function waitForClerkToken(timeoutMs = 12_000): Promise<string | null> {
  const clerk = await getReadyClerk(Math.min(timeoutMs, 8_000));
  if (!clerk) return null;

  const started = Date.now();
  let loadedWithoutSessionAt: number | null = null;

  while (Date.now() - started < timeoutMs) {
    const session = clerk.session;
    if (session) {
      const token = await session.getToken?.().catch(() => null);
      if (token) return token;
    }

    if (clerk.loaded && !clerk.session && !clerk.user) {
      if (!loadedWithoutSessionAt) loadedWithoutSessionAt = Date.now();
      // Handshake usually finishes well under 2s. Only decide "logged out"
      // after it has stayed empty for several seconds.
      if (Date.now() - loadedWithoutSessionAt > 5_000) return null;
    } else {
      loadedWithoutSessionAt = null;
    }

    await sleep(150);
  }

  return null;
}

export type MeUser = {
  id: string;
  clerkUserId: string;
  name: string;
  email: string;
  role: 'student' | 'editor' | 'admin';
};

export async function fetchCurrentUser(
  apiUrl: string,
  token: string,
): Promise<{ user: MeUser | null; status: number; message: string }> {
  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      let message = `Could not verify your account (${res.status}).`;
      try {
        const body = (await res.json()) as { message?: string };
        if (body?.message) message = body.message;
      } catch {
        /* ignore */
      }
      return { user: null, status: res.status, message };
    }
    return { user: (await res.json()) as MeUser, status: res.status, message: '' };
  } catch {
    return {
      user: null,
      status: 0,
      message: 'Cannot reach the API. Make sure the server is running on port 5000.',
    };
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
