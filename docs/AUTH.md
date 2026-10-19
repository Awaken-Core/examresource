# Authentication & Session Security (AUTH.md)

This document describes the native authentication and session architecture in **GovtPariksha / ExamResource**.

> [!NOTE]
> Clerk was previously evaluated and removed. The system now uses a high-performance, self-hosted session architecture with Argon2id password hashing and Google OAuth 2.0.

---

## 🔐 Architecture Overview

The authentication backend lives in `apps/server/src/modules/auth/` and enforces the following security properties:
- **No Bearer Tokens in Browser Memory**: Avoids storing sensitive JWTs in `localStorage` or `sessionStorage` where they are vulnerable to XSS.
- **Opaque Session Tokens**: The client holds an opaque cryptographic token inside an `HttpOnly` cookie.
- **SHA-256 Token Storage**: The server stores only the SHA-256 hash of the session token in MongoDB (`session.schema.ts`).
- **Argon2id Password Hashing**: Passwords are saved with high-entropy salt and memory-hard Argon2id.
- **CSRF Protection**: Mutations require an `X-CSRF-Protection: 1` header and validate the `Origin` header against `CLIENT_URL`.

---

## 🍪 Cookie Configuration

In production (`NODE_ENV=production`), the session cookie is configured as:

```typescript
res.cookie('__Host-sid', rawToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: sessionTtlDays * 24 * 60 * 60 * 1000,
});
```

Using the `__Host-` cookie prefix guarantees that the browser rejects the cookie unless:
1. It is served over HTTPS (`Secure`).
2. It has `Path=/`.
3. It does not specify a `Domain` attribute (preventing subdomain hijacking).

---

## 📡 API Endpoints

All auth routes are prefixed under `/api/v1/auth`:

| Endpoint | Method | Purpose | Protection |
|---|---|---|---|
| `/auth/register` | `POST` | Register a new user | Public / Rate Limited |
| `/auth/login` | `POST` | Authenticate with email & password | Sets `__Host-sid` cookie |
| `/auth/logout` | `POST` | Revoke session & clear cookie | Authenticated |
| `/auth/google` | `GET` | Redirect to Google OAuth consent | Public |
| `/auth/google/callback` | `GET` | Google OAuth redirect callback | Public |
| `/auth/me` | `GET` | Retrieve current authenticated user profile | Authenticated |
| `/auth/forgot-password`| `POST` | Send single-use password reset token | Public |
| `/auth/reset-password` | `POST` | Consume reset token & update password | Single-use token |

---

## 🌐 Google OAuth 2.0 Integration

1. The frontend initiates sign-in by opening or redirecting to `/api/v1/auth/google`.
2. The user consents on Google's authentication page.
3. Google redirects to `/api/v1/auth/google/callback?code=...`.
4. The server exchanges the authorization code for an ID token using `google-auth-library`.
5. The server verifies the token signature, issuer, and audience against `GOOGLE_CLIENT_ID`.
6. The user is matched or created by Google email, an active session is created in MongoDB, and the `__Host-sid` cookie is set before redirecting the user to `CLIENT_URL/admin`.
