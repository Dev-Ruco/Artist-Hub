import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) { setSession(data.session); setLoading(false); }
    }).catch(() => { if (mounted) setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, current) => {
      if (mounted) { setSession(current); setLoading(false); }
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    loading,
    async signIn(email, password) {
      if (!supabase) return 'O registo só está disponível quando o serviço de contas estiver ligado.';
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message || null;
    },
    async signUp(email, password, displayName) {
      if (!supabase) return 'O registo só está disponível quando o serviço de contas estiver ligado.';
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: displayName.trim() } },
      });
      return error?.message || null;
    },
    async resetPassword(email) {
      if (!supabase) return 'A recuperação de acesso não está disponível em demonstração.';
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return error?.message || null;
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut();
    },
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth requer AuthProvider');
  return value;
}
