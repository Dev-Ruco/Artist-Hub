import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_ARTIST_SLUG } from '../config/brand';
import { db, isDemoMode, supabaseSchema, supabaseUrl } from '../lib/supabase';
import { apiConfigurada, enderecoApi, pedirApi, type ArtistaApi } from '../lib/api';
import { palette } from '../theme/tokens';

type ConnectionStatus = 'checking' | 'connected' | 'unconfigured' | 'error';

// Diagnóstico temporário destinado à fase de integração.
// Não regista nem exibe a chave anon ou quaisquer tokens.
export function BackendConnectionCard() {
  const [status, setStatus] = useState<ConnectionStatus>(
    isDemoMode ? 'unconfigured' : 'checking'
  );
  const [message, setMessage] = useState(
    isDemoMode
      ? 'Falta configurar a chave pública anon nas variáveis de ambiente do Expo.'
      : 'A verificar a ligação ao Supabase…'
  );

  const check = useCallback(async () => {
    if (isDemoMode) {
      setStatus('unconfigured');
      setMessage('Falta configurar a chave pública anon nas variáveis de ambiente do Expo.');
      return;
    }
    setStatus('checking');
    setMessage('A verificar a ligação ao Supabase…');
    try {
      if (apiConfigurada) {
        const dados = await pedirApi<ArtistaApi>('/artista');
        if (dados.codigo !== BRAND_ARTIST_SLUG) throw new Error('Artista inesperado.');
        setStatus('connected');
        setMessage('Ligação à API Java confirmada. Mr. Bow foi encontrado no PostgreSQL.');
        return;
      }
      const { data, error } = await db().from('artists')
        .select('slug,display_name')
        .eq('slug', BRAND_ARTIST_SLUG)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        setStatus('error');
        switch (error.code) {
          case 'PGRST106':
            setMessage('O esquema mrbowapp não está disponível na API REST. Verifica PGRST_DB_SCHEMAS no Coolify.');
            break;
          case '42501':
            setMessage('A API respondeu, mas as permissões de leitura foram recusadas.');
            break;
          case 'PGRST301':
            setMessage('A chave pública ou a autenticação foi recusada pelo servidor.');
            break;
          default:
            setMessage('O Supabase respondeu com um erro. Verifica a chave anon, o serviço REST e a ligação de rede.');
        }
      } else if (data?.slug === BRAND_ARTIST_SLUG) {
        setStatus('connected');
        setMessage('Ligação confirmada: o registo activo de Mr. Bow foi encontrado na base de dados.');
      } else {
        setStatus('error');
        setMessage('API acessível, mas o registo activo de Mr. Bow não foi encontrado.');
      }
    } catch {
      setStatus('error');
      setMessage(apiConfigurada
        ? 'Não foi possível consultar a API Java. Confirma o endereço, CORS e o estado do backend.'
        : 'Não foi possível estabelecer a ligação. Verifica HTTPS, rede e configuração CORS.');
    }
  }, []);

  useEffect(() => { void check(); }, [check]);

  return <View style={styles.card}>
    <View style={styles.header}>
      <Ionicons
        name={status === 'connected' ? 'checkmark-circle-outline' :
          status === 'error' ? 'alert-circle-outline' : 'server-outline'}
        size={22} color={status === 'connected' ? palette.accent : palette.muted}/>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Ligação à base de dados</Text>
        <Text style={styles.caption}>Diagnóstico do piloto · {apiConfigurada ? 'API Java' : supabaseSchema}</Text>
      </View>
      {status === 'checking' ? <ActivityIndicator color={palette.accent} size="small"/> : null}
    </View>
    <Text style={styles.message}>{message}</Text>
    <Text style={styles.host} numberOfLines={1}>{apiConfigurada ? enderecoApi : supabaseUrl}</Text>
    <Pressable accessibilityRole="button" disabled={status === 'checking'}
      onPress={() => void check()} style={styles.action}>
      <Ionicons name="refresh-outline" size={16} color={palette.accent}/>
      <Text style={styles.actionText}>Testar ligação</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  card: { padding: 17, gap: 13, borderRadius: 19,
    borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  title: { color: palette.text, fontWeight: '900', fontSize: 14 },
  caption: { color: palette.muted, fontSize: 11, marginTop: 3 },
  message: { color: palette.text, fontSize: 12, lineHeight: 20 },
  host: { color: palette.muted, fontSize: 11 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 9, alignSelf: 'flex-start' },
  actionText: { color: palette.accent, fontSize: 12, fontWeight: '800' },
});
