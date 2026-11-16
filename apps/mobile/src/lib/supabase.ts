import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { apiConfigurada } from './api';

// A app Mr. Bow usa este Supabase self-hosted por omissão.
// A variável de ambiente pode substituir o URL em futuros deployments.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || 'https://supabase.datacenterhub.tech';
// As instalações self-hosted aceitam a chave pública "anon" (JWT).
// Nunca colocar service_role ou outros segredos num EXPO_PUBLIC_*.
const key = (
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  ''
).trim();
const placeholders = ['COLOCAR_CHAVE_PUBLICAVEL', 'SUA_CHAVE_ANON', 'YOUR_ANON_KEY'];
export const isDemoMode = !apiConfigurada && (!key || placeholders.includes(key));
export const supabaseUrl = url;
export const supabaseSchema = 'mrbowapp';

export const supabase: SupabaseClient | null = !key || placeholders.includes(key)
  ? null
  : createClient(url!, key!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

// A sessão só é renovada automaticamente quando a aplicação está activa.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase?.auth.startAutoRefresh();
    else supabase?.auth.stopAutoRefresh();
  });
}

// Todas as consultas do MVP utilizam o esquema isolado mrbowapp.
export function db() {
  if (!supabase) throw new Error('Configure o Supabase no ficheiro .env.');
  return supabase.schema(supabaseSchema);
}
