import { useState, useEffect, useCallback } from 'react';
import { safeGet, safeSet, safeRemove } from '../utils/safeLocal';
import { useAuth } from './useAuth';
import { getCredential, saveCredential, deleteCredential } from '../services/credentialsService';

export interface UseTokenResult {
  token: string;
  loading: boolean;
  saveToken: (tok: string) => Promise<void>;
  removeToken: () => Promise<void>;
}

/**
 * Provides a unified interface for reading and writing provider tokens.
 * Source of truth order:
 *   1. Supabase credential table (if user is logged in)
 *   2. localStorage (with safe fallbacks)
 */
export function useToken(providerId: string): UseTokenResult {
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let tok = '';
      if (user) {
        const rec = await getCredential(user.id, providerId);
        tok = rec?.credentials?.token || rec?.credentials?.apiKey || '';
      }
      if (!tok) tok = safeGet(`${providerId}_token`);
      if (!cancelled) {
        setToken(tok);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, providerId]);

  const saveToken = useCallback(async (tok: string) => {
    safeSet(`${providerId}_token`, tok);
    if (user) {
      await saveCredential(user.id, providerId, { token: tok });
    }
    setToken(tok);
  }, [user, providerId]);

  const removeToken = useCallback(async () => {
    safeRemove(`${providerId}_token`);
    if (user) {
      await deleteCredential(user.id, providerId);
    }
    setToken('');
  }, [user, providerId]);

  return { token, loading, saveToken, removeToken };
} 