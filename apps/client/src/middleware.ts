import { defineMiddleware } from 'astro:middleware';
import { API_URL } from './lib/api';

function isProtectedPath(pathname: string) {
  return pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/editor' ||
    pathname.startsWith('/editor/');
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (!isProtectedPath(context.url.pathname)) return next();

  let profile: { role?: string };
  try {
    const response = await fetch(`${API_URL}/me`, {
      headers: { cookie: context.request.headers.get('cookie') ?? '' },
    });
    if (response.status === 401) {
      const loginUrl = new URL('/login', context.url);
      loginUrl.searchParams.set('returnTo', context.url.pathname + context.url.search);
      return Response.redirect(loginUrl, 302);
    }
    if (!response.ok) throw new Error(`Profile request failed with ${response.status}`);
    profile = await response.json();
  } catch {
    return new Response('Unable to verify access. Please try again later.', { status: 503 });
  }

  const isAdminRoute = context.url.pathname === '/admin' || context.url.pathname.startsWith('/admin/');
  const canAccess = isAdminRoute
    ? profile.role === 'admin'
    : profile.role === 'admin' || profile.role === 'editor';

  return canAccess ? next() : Response.redirect(new URL('/', context.url), 302);
});
