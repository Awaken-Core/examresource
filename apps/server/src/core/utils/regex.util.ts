/**
 * Safely escapes all regular expression metacharacters in a string to prevent
 * ReDoS (Regular Expression Denial of Service) and regex syntax injection.
 */
export function escapeRegex(text: string): string {
  if (!text) return '';
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

