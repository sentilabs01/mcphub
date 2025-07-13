import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { safeSet } from '../utils/safeLocal';

/**
 * Subscribes to the `user_credentials` table for the currently signed-in user and
 * keeps relevant tokens in `localStorage` up-to-date in real-time.
 *
 * This eliminates the need for manual page refreshes when a user adds or updates
 * API keys from a different tab or device and is a first concrete step towards
 * the "deep Supabase integration" milestone outlined in the strategic plan.
 *
 * The hook is intentionally lightweight – it only writes to localStorage so that
 * existing components relying on `safeGet()` continue to work without changes.
 */
export function useSupabaseCredentialSync(userId?: string | null): void {
  useEffect(() => {
    if (!userId) return;

    // Helper: fetch all current credentials once and cache them locally
    const fetchAndCacheAll = async () => {
      const { data, error } = await supabase
        .from('user_integration_accounts')
        .select('provider, credentials')
        .eq('user_id', userId);

      if (error) {
        // When running locally without the migration that adds the integration accounts
        // table, Supabase returns Postgres error code 42P01 (undefined_table).
        // Treat that as benign and skip syncing in local dev.
        if ((error as any).code === '42P01') {
          console.info('[CredSync] user_credentials table is absent in this environment – skipping sync');
          return;
        }
        console.warn('[CredSync] Failed to fetch user_credentials:', error.message);
        return;
      }

      data?.forEach((row: any) => {
        cacheCredential(row.provider, row.credentials);
      });
    };

    // Helper: writes a single credential object to localStorage using a common mapping
    const cacheCredential = (provider: string, credentials: Record<string, any>) => {
      if (!credentials) return;
      // Common patterns across providers – we extend as needed
      const TOKEN_KEYS = ['token', 'access_token', 'api_key', 'pat'];
      const token = TOKEN_KEYS.map(k => credentials[k]).find(Boolean);
      if (typeof token === 'string' && token.trim()) {
        safeSet(`${provider}_token`, token.trim());
      }
      // Provider-specific extras (Make.com, etc.)
      if (provider === 'make_com' && credentials.zone) {
        safeSet('makeZone', credentials.zone);
      }
    };

    // Initial fetch
    fetchAndCacheAll();

    // Start realtime channel for subsequent changes
    const channel = supabase.channel(`cred-sync-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_integration_accounts', filter: `user_id=eq.${userId}` },
        payload => {
          const newRow: any = payload.new || payload.old;
          if (newRow) {
            cacheCredential(newRow.provider, newRow.credentials);
          }
        },
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.info('[CredSync] Realtime subscription active');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
} 