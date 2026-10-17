import { defineMiddleware } from 'astro:middleware';

// Authentication is checked in AdminLayout in the browser. The API session cookie
// is host-only to the API domain, so this frontend server cannot forward it when
// the production frontend and API use different hosts.
export const onRequest = defineMiddleware((_context, next) => next());
