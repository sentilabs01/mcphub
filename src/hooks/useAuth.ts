import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // Persist Google provider token for Drive/Gmail helpers on first load
      if (session?.provider_token) {
        try {
          localStorage.setItem('googleToken', session.provider_token);
        } catch {
          /* localStorage may be unavailable */
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.provider_token) {
        try {
          localStorage.setItem('googleToken', session.provider_token);
        } catch {}
      }
    });

    // Refresh Google provider_token ~2 min before expiry
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = (sess: Session | null) => {
      if (!sess?.expires_at) return;
      const msUntilRefresh = (sess.expires_at * 1000) - Date.now() - 2 * 60 * 1000; // 2 min before
      if (msUntilRefresh <= 0) return;
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (!error && data.session) {
            setSession(data.session);
            // Keep Google provider token in localStorage for drive/gmail helpers
            if (data.session.provider_token)
              localStorage.setItem('googleToken', data.session.provider_token);
          }
        } catch {
          /* refresh failed – user will be prompted on next request */
        } finally {
          const { data: latest } = await supabase.auth.getSession();
          scheduleRefresh(latest.session);
        }
      }, msUntilRefresh);
    };

    scheduleRefresh(session);

    return () => {
      subscription.unsubscribe();
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // full Gmail + Drive scopes
        scopes:
          'https://mail.google.com/ https://www.googleapis.com/auth/drive',
        // force a fresh consent + refresh-token
        queryParams: { access_type: 'offline', prompt: 'consent' },
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  };
};

export { AuthContext };