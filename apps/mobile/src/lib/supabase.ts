import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const isDemoMode = !url || !key || key === 'COLOCAR_CHAVE_PUBLICAVEL';

export const supabase: SupabaseClient | null = isDemoMode
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
  return supabase.schema('mrbowapp');
}
