/**
 * Basic check that a string looks like a valid email (local@domain.tld).
 * Not exhaustive vs RFC 5322; suitable for client-side UX before API calls.
 */
export function isValidEmail(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}
