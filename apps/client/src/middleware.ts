import { clerkMiddleware } from '@clerk/astro/server';
import { API_URL } from './lib/api';

function isProtectedPath(pathname: string) {
  return pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/editor' ||
    pathname.startsWith('/editor/');
}

export const onRequest = clerkMiddleware(async (auth, context, next) => {
  if (!isProtectedPath(context.url.pathname)) {
    return next();
  }

  const { userId, getToken, redirectToSignIn } = await auth();
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: context.url.href });
  }

  const token = await getToken();
  if (!token) {
    return Response.redirect(new URL('/', context.url), 302);
  }

  const apiUrl = API_URL;
  let profile: { role?: string };
  try {
    const response = await fetch(`${apiUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return Response.redirect(new URL('/', context.url), 302);
    }
    profile = await response.json();
  } catch {
    return new Response('Unable to verify access. Please try again later.', {
      status: 503,
    });
  }

  // The admin dashboard is reserved for administrators. Editors may use the
  // article editor directly, but cannot open the management dashboard.
  const isAdminRoute =
    context.url.pathname === '/admin' || context.url.pathname.startsWith('/admin/');
  const canAccess = isAdminRoute
    ? profile.role === 'admin'
    : profile.role === 'admin' || profile.role === 'editor';

  if (!canAccess) {
    return Response.redirect(new URL('/', context.url), 302);
  }

  return next();
});
