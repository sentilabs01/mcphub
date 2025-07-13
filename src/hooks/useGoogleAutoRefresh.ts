import { useEffect } from 'react';
import { fetchGoogleAccessToken } from '../services/googleToken';

/**
 * Keeps the cached Google access_token fresh by renewing it 2 minutes before expiry.
 * Safe to call multiple times (only one interval runs per component lifecycle).
 */
export function useGoogleAutoRefresh() {
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const schedule = async () => {
      const exp = Number(localStorage.getItem('google_access_token_exp') || '0');
      // If expired or missing, refresh immediately
      if (!exp || Date.now() > exp - 60_000) {
        try {
          await fetchGoogleAccessToken();
        } catch (err) {
          console.warn('[GoogleRefresh] Failed to refresh token', (err as any).message);
        }
      }
      // Compute next run (2 min before expiry, min 1 min)
      const nextExp = Number(localStorage.getItem('google_access_token_exp') || '0');
      const delay = Math.max(nextExp - Date.now() - 120_000, 60_000);
      timer = setTimeout(schedule, delay);
    };

    schedule();
    return () => clearTimeout(timer);
  }, []);
} 