import axios from 'axios';
import getConfig from 'next/config';

import { clearClientAuthStorage } from './clearAuth';
import { logoutUser } from '../redux/actions';

const { publicRuntimeConfig } = getConfig();

let interceptorId = null;
let handlingExpiredAuth = false;

/**
 * On 401 with a stored/sent token: clear login state and send the user to /login.
 * Skips failed /login and /register posts so bad credentials do not trigger this path.
 */
export function setupAxiosAuthInterceptor(store) {
  if (typeof window === 'undefined') {
    return;
  }

  if (interceptorId !== null) {
    axios.interceptors.response.eject(interceptorId);
    interceptorId = null;
  }

  interceptorId = axios.interceptors.response.use(
    response => response,
    error => {
      handleUnauthorized(store, error);
      return Promise.reject(error);
    }
  );
}

function handleUnauthorized(store, error) {
  if (!error.response || error.response.status !== 401) {
    return;
  }
  if (handlingExpiredAuth) {
    return;
  }

  const config = error.config || {};
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();

  if (
    (url.includes('/login') && method === 'post') ||
    (url.includes('/register') && method === 'post')
  ) {
    return;
  }

  const headers = config.headers || {};
  const authHeader =
    headers['X-authorization'];
  let storedToken = '';
  try {
    storedToken =
      localStorage.getItem('userToken') || store.getState()?.user?.token || '';
  } catch (e) {
    storedToken = store.getState()?.user?.token || '';
  }

  if (!authHeader && !storedToken) {
    return;
  }

  handlingExpiredAuth = true;
  try {
    clearClientAuthStorage();
    store.dispatch(logoutUser());

    const path = window.location.pathname || '/';
    if (!path.startsWith('/login')) {
      const next = encodeURIComponent(
        `${window.location.pathname}${window.location.search || ''}`
      );
      window.location.href = `/login?next=${next}`;
    }
  } finally {
    setTimeout(() => {
      handlingExpiredAuth = false;
    }, 2000);
  }
}

/**
 * Verify a persisted token with GET /profile (SBH2 and SBH3).
 * Clears stale login so the UI does not stay "logged in" after expiry.
 */
export async function validateStoredSession(store) {
  if (typeof window === 'undefined') {
    return;
  }

  let token = '';
  try {
    token =
      store.getState()?.user?.token || localStorage.getItem('userToken') || '';
  } catch (e) {
    token = store.getState()?.user?.token || '';
  }

  if (!token) {
    return;
  }

  try {
    await axios.get(`${publicRuntimeConfig.backend}/profile`, {
      headers: {
        Accept: 'text/plain',
        'X-authorization': token
      }
    });
  } catch (error) {
    if (error.response?.status === 401) {
      // Interceptor also handles this; ensure state is cleared on /login too.
      clearClientAuthStorage();
      store.dispatch(logoutUser());
    }
  }
}
