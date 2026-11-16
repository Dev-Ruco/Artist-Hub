import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { apiConfigurada, pedirApi, type SessaoApi } from '../lib/api';
import { guardarSessao, lerSessao, eliminarSessao } from '../lib/armazenamentoSessao';
import { BRAND_ARTIST_SLUG } from '../config/brand';

/** O ecrã utiliza somente estes campos, quer a sessão venha da API ou do legado. */
type SessaoUtilizador = {
  access_token: string;
  user: { id: string; email?: string; user_metadata: Record<string, unknown> };
};
type SessaoAplicacao = SessaoUtilizador | Session;

type SessaoGuardada = {
  tokenAcesso: string;
  tokenRenovacao: string;
  expiraAte: number;
  identificadorUtilizador: string;
  correio: string;
  nome: string;
};

type ContextoAutenticacao = {
  session: SessaoAplicacao | null;
  loading: boolean;
  signIn: (correio: string, palavraPasse: string) => Promise<string | null>;
  signUp: (correio: string, palavraPasse: string, nome: string) => Promise<string | null>;
  resetPassword: (correio: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};
const Contexto = createContext<ContextoAutenticacao | undefined>(undefined);

function construirSessao(dados: SessaoGuardada): SessaoUtilizador {
  return {
    access_token: dados.tokenAcesso,
    user: {
      id: dados.identificadorUtilizador,
      email: dados.correio,
      user_metadata: { full_name: dados.nome },
    },
  };
}

function converterResposta(dados: SessaoApi): SessaoGuardada {
  if (!dados.tokenAcesso || !dados.tokenRenovacao || !dados.identificadorUtilizador) {
    throw new Error('A API não devolveu uma sessão válida.');
  }
  return {
    tokenAcesso: dados.tokenAcesso,
    tokenRenovacao: dados.tokenRenovacao,
    expiraAte: Date.now() + Math.max(60, dados.expiraEm || 3600) * 1000,
    identificadorUtilizador: dados.identificadorUtilizador,
    correio: dados.correio || '',
    nome: dados.nome || '',
  };
}

function textoErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Não foi possível concluir o pedido.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessaoAplicacao | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase) || apiConfigurada);

  async function memorizar(dados: SessaoApi) {
    const guardada = converterResposta(dados);
    await guardarSessao(JSON.stringify(guardada));
    setSession(construirSessao(guardada));
  }

  useEffect(() => {
    let montado = true;
    if (apiConfigurada) {
      async function restaurar() {
        try {
          const valor = await lerSessao();
          if (!valor || !montado) return;
          const guardada = JSON.parse(valor) as SessaoGuardada;
          if (guardada.expiraAte <= Date.now() + 60_000) {
            const nova = await pedirApi<SessaoApi>('/contas/renovar', {
              metodo: 'POST', corpo: { tokenRenovacao: guardada.tokenRenovacao },
            });
            const novaGuardada = converterResposta(nova);
            await guardarSessao(JSON.stringify(novaGuardada));
            if (montado) setSession(construirSessao(novaGuardada));
          } else {
            setSession(construirSessao(guardada));
          }
        } catch {
          await eliminarSessao().catch(() => undefined);
          if (montado) setSession(null);
        } finally {
          if (montado) setLoading(false);
        }
      }
      void restaurar();
      return () => { montado = false; };
    }
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      if (montado) { setSession(data.session); setLoading(false); }
    }).catch(() => { if (montado) setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_evento, actual) => {
      if (montado) { setSession(actual); setLoading(false); }
    });
    return () => { montado = false; listener.subscription.unsubscribe(); };
  }, []);

  // Renova credenciais por iniciativa da app, sem enviar a palavra-passe.
  useEffect(() => {
    if (!apiConfigurada || !session) return;
    let emCurso = false;
    const renovarSeNecessario = async () => {
      if (emCurso) return;
      emCurso = true;
      try {
        const valor = await lerSessao();
        if (!valor) return;
        const guardada = JSON.parse(valor) as SessaoGuardada;
        if (guardada.expiraAte > Date.now() + 120_000) return;
        const novos = await pedirApi<SessaoApi>('/contas/renovar', {
          metodo: 'POST', corpo: { tokenRenovacao: guardada.tokenRenovacao },
        });
        await memorizar(novos);
      } catch {
        await eliminarSessao().catch(() => undefined);
        setSession(null);
      } finally {
        emCurso = false;
      }
    };
    const intervalo = setInterval(() => { void renovarSeNecessario(); }, 60_000);
    const escuta = Platform.OS !== 'web' ? AppState.addEventListener('change', estado => {
      if (estado === 'active') void renovarSeNecessario();
    }) : null;
    return () => { clearInterval(intervalo); escuta?.remove(); };
  }, [session?.access_token]);

  const valor = useMemo<ContextoAutenticacao>(() => ({
    session, loading,
    async signIn(correio, palavraPasse) {
      try {
        if (apiConfigurada) {
          const dados = await pedirApi<SessaoApi>('/contas/entrar', {
            metodo: 'POST', corpo: { correio, palavraPasse },
          });
          await memorizar(dados);
          return null;
        }
        if (!supabase) return 'O serviço de contas ainda não está configurado.';
        const { error } = await supabase.auth.signInWithPassword({
          email: correio, password: palavraPasse,
        });
        return error?.message || null;
      } catch (erro) { return textoErro(erro); }
    },
    async signUp(correio, palavraPasse, nome) {
      try {
        if (apiConfigurada) {
          const dados = await pedirApi<{ registoAceite: boolean } & Partial<SessaoApi>>(
            '/contas/registar', { metodo: 'POST', corpo: { correio, palavraPasse, nome: nome.trim() } });
          if (dados.tokenAcesso && dados.tokenRenovacao) await memorizar(dados as SessaoApi);
          return null;
        }
        if (!supabase) return 'O registo ainda não está configurado.';
        const { error } = await supabase.auth.signUp({
          email: correio, password: palavraPasse,
          options: { data: { full_name: nome.trim(), artist_app: BRAND_ARTIST_SLUG } },
        });
        return error?.message || null;
      } catch (erro) { return textoErro(erro); }
    },
    async resetPassword(correio) {
      try {
        if (apiConfigurada) {
          await pedirApi('/contas/recuperar', {
            metodo: 'POST', corpo: { correio },
          });
          return null;
        }
        if (!supabase) return 'A recuperação ainda não está configurada.';
        const { error } = await supabase.auth.resetPasswordForEmail(correio);
        return error?.message || null;
      } catch (erro) { return textoErro(erro); }
    },
    async signOut() {
      if (apiConfigurada) {
        const actual = session?.access_token;
        if (actual) {
          await pedirApi('/contas/sair', { metodo: 'POST', token: actual }).catch(() => undefined);
        }
        await eliminarSessao().catch(() => undefined);
        setSession(null);
        return;
      }
      if (supabase) await supabase.auth.signOut();
    },
  }), [session, loading]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useAuth requer AuthProvider');
  return contexto;
}
