export const API_URL = (
  import.meta.env.PUBLIC_API_URL || 'http://localhost:5000/api/v1'
).replace(/\/$/, '');

export function isClientAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      localStorage.getItem('auth_active') === '1' ||
      document.documentElement.getAttribute('data-authenticated') === 'true' ||
      document.cookie.includes('logged_in=1') ||
      window.location.search.includes('login=success')
    );
  } catch {
    return false;
  }
}
