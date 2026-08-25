/**
 * Clear client-side login material (localStorage + common SBH cookies).
 * Safe to call from logout and from 401 handlers (SBH2 / SBH3 frontends).
 */
export function clearClientAuthStorage() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem('userToken');
    localStorage.removeItem('username');
  } catch (e) {
    // ignore quota / private-mode errors
  }

  if (typeof document === 'undefined') {
    return;
  }

  const names = ['login_token', 'refresh_token'];
  const hostname = window.location.hostname;
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=${hostname}`;
  }
}
