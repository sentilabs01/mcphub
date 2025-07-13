// Utility helpers to fetch and refresh Google OAuth access-tokens
import { safeSet, safeGet } from '../utils/safeLocal';
import { backendBase } from '../utils/backendBase';

/**
 * Hit backend endpoint that exchanges/refreshes the Google OAuth token that
 * Supabase keeps (provider_token). Returns a short-lived access_token plus
 * expires_in (seconds).
 */
export async function fetchGoogleAccessToken(): Promise<string> {
  const res = await fetch(`${backendBase}/api/google/token`, { credentials: 'include' });
  if (!res.ok) {
    // Graceful fallback – try existing cached token before throwing
    const cached = safeGet('google_access_token') || safeGet('google_token');
    if (cached) return cached;
    throw new Error('Failed to fetch Google access token');
  }
  const { access_token, expires_in } = await res.json();
  // Cache token + expiry (epoch ms) in localStorage so we can reuse across tabs
  safeSet('google_access_token', access_token);
  const exp = Date.now() + (Number(expires_in || 0) * 1000);
  localStorage.setItem('google_access_token_exp', exp.toString());
  return access_token;
}

/**
 * Ensure we always return a valid (non-expired) Google access token.
 * Refreshes automatically when missing or <60s from expiry.
 */
export async function getValidGoogleToken(): Promise<string> {
  const token = safeGet('google_access_token');
  const exp = Number(localStorage.getItem('google_access_token_exp') || '0');
  if (token && Date.now() < exp - 60000) {
    // still valid (with 1-min buffer)
    return token;
  }
  // Otherwise refresh via backend
  return fetchGoogleAccessToken();
}

export {} 