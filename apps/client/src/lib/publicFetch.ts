export async function fetchPublicJson<T>(path: string): Promise<T | null> {
  const base = import.meta.env.PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) return null;
  try {
    const response = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
