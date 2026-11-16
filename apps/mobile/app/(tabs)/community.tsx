import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ActionButton, DemoFlag, EmptyState, Eyebrow, PostCard, Screen,
} from '../../src/components/UI';
import { useArtist } from '../../src/context/ArtistContext';
import { useAuth } from '../../src/context/AuthContext';
import { useArtistContent } from '../../src/hooks/useArtistContent';
import { db, isDemoMode } from '../../src/lib/supabase';
import { apiConfigurada, pedirApi } from '../../src/lib/api';
import { palette } from '../../src/theme/tokens';
import type { Post } from '../../src/types/domain';

type Filter = 'todos' | Post['category'];
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'todos', label: 'Tudo' },
  { value: 'novidade', label: 'Novidades' },
  { value: 'musica', label: 'Música' },
  { value: 'bastidores', label: 'Bastidores' },
];

export default function CommunityScreen() {
  const { selected } = useArtist();
  const { session } = useAuth();
  const userId = session?.user.id;
  const artistId = selected?.id;
  const { posts, loading, error, refresh } = useArtistContent(artistId);
  const [filter, setFilter] = useState<Filter>('todos');
  const [membership, setMembership] = useState<{ level: string; joined_at: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState('');

  const refreshMembership = useCallback(async () => {
    if (!userId || !artistId || isDemoMode) { setMembership(null); return; }
    setChecking(true);
    if (apiConfigurada) {
      try {
        const resposta = await pedirApi<{
          aderiu: boolean; adesao?: { nivel: string; dataAdesao: string };
        }>('/comunidade/adesao', { token: session?.access_token });
        setMembership(resposta.aderiu && resposta.adesao
          ? { level: resposta.adesao.nivel, joined_at: resposta.adesao.dataAdesao }
          : null);
        setMessage('');
      } catch {
        setMessage('Não foi possível verificar a tua adesão.');
      } finally {
        setChecking(false);
      }
      return;
    }
    const { data, error: queryError } = await db().from('artist_memberships')
      .select('level,joined_at').eq('user_id', userId).eq('artist_id', artistId).maybeSingle();
    if (queryError) {
      setMessage('Não foi possível verificar a tua adesão.');
    } else {
      setMembership(data as { level: string; joined_at: string } | null);
    }
    setChecking(false);
  }, [userId, artistId, session?.access_token]);

  useEffect(() => { void refreshMembership(); }, [refreshMembership]);

  async function join() {
    setMessage('');
    if (isDemoMode) { setMessage('A adesão estará disponível quando a base de dados estiver ligada.'); return; }
    if (!session) { router.push('/(auth)/login'); return; }
    if (!artistId || joining || membership) return;
    setJoining(true);
    try {
      if (apiConfigurada) {
        await pedirApi('/comunidade/adesao', {
          metodo: 'POST', token: session.access_token,
        });
        await refreshMembership();
        setMessage('Adesão registada. Bem-vindo à comunidade de Mr. Bow!');
        return;
      }
      const { error: joinError } = await db().from('artist_memberships')
        .upsert({ artist_id: artistId, user_id: session.user.id, level: 'fan', points: 0 },
          { onConflict: 'artist_id,user_id', ignoreDuplicates: true });
      if (joinError) throw joinError;
      await refreshMembership();
      setMessage('Adesão registada. Bem-vindo à comunidade de Mr. Bow!');
    } catch {
      setMessage('Não foi possível concluir a adesão. Tenta novamente.');
    } finally {
      setJoining(false);
    }
  }

  async function reload() {
    await Promise.all([refresh(), refreshMembership()]);
  }
  const visiblePosts = useMemo(() => filter === 'todos'
    ? posts : posts.filter(post => post.category === filter), [posts, filter]);

  return <Screen>
    <Eyebrow>A NOSSA COMUNIDADE</Eyebrow>
    <View style={styles.headingBlock}>
      <Text style={styles.heading}>A família Mr. Bow.</Text>
      <Text style={styles.subheading}>Novidades, música e bastidores num espaço dedicado aos fãs.</Text>
    </View>
    <DemoFlag/>

    <View style={styles.clubCard}>
      <View style={styles.clubHeader}>
        <View style={styles.clubIcon}><Ionicons name="people-outline" color={palette.accent} size={29}/></View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.clubTitle}>Comunidade Mr. Bow</Text>
          <Text style={styles.muted}>Acompanha os conteúdos e participa como fã.</Text>
        </View>
      </View>
      <View style={styles.statusRow}>
        <Ionicons name={membership ? 'checkmark-circle' : 'ellipse-outline'}
          color={membership ? palette.accent : palette.muted} size={17}/>
        <Text style={styles.statusText}>{checking ? 'A verificar adesão...' :
          membership ? 'Já fazes parte da comunidade.' : 'Participação gratuita.'}</Text>
      </View>
      {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
      {membership ? <ActionButton label="Ver o meu perfil" variant="secondary"
        onPress={() => router.push('/(tabs)/profile')}/> :
        <ActionButton disabled={joining || checking || !selected}
          label={joining ? 'A registar...' : session ? 'Aderir à comunidade' : 'Entrar para aderir'}
          onPress={() => void join()}/>}
    </View>

    <View style={styles.feedHeading}>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.feedLabel}>DO ARTISTA PARA TI</Text>
        <Text style={styles.feedTitle}>Publicações</Text>
      </View>
      <Pressable onPress={() => void reload()} accessibilityRole="button"
        accessibilityLabel="Actualizar publicações" style={styles.reloadButton}>
        <Ionicons name="refresh-outline" color={palette.text} size={21}/>
      </Pressable>
    </View>

    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filters}>
      {FILTERS.map(option => <Pressable key={option.value} accessibilityRole="button"
        accessibilityState={{ selected: filter === option.value }}
        onPress={() => setFilter(option.value)}
        style={[styles.chip, filter === option.value && styles.selectedChip]}>
        <Text style={[styles.chipText, filter === option.value && styles.selectedText]}>
          {option.label}
        </Text>
      </Pressable>)}
    </ScrollView>
    {loading ? <ActivityIndicator color={palette.accent}/> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {!loading && !error && visiblePosts.length === 0 ?
      <EmptyState icon="newspaper-outline" title="Ainda sem publicações"
        detail="Quando houver novidades nesta categoria, serão apresentadas aqui."/> : null}
    {visiblePosts.map(post => <PostCard key={post.id} post={post}/>)}

    <View style={styles.safety}>
      <Ionicons name="shield-checkmark-outline" color={palette.accent} size={21}/>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.safetyTitle}>Um espaço para todos</Text>
        <Text style={styles.muted}>A conversa em grupo só será activada depois de concluídas as ferramentas de moderação, denúncia e bloqueio.</Text>
      </View>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  headingBlock: { gap: 8 },
  heading: { color: palette.text, fontSize: 33, fontWeight: '900', letterSpacing: -1 },
  subheading: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  clubCard: { borderRadius: 24, padding: 19, backgroundColor: palette.surfaceRaised,
    borderColor: '#59442E', borderWidth: 1, gap: 18 },
  clubHeader: { flexDirection: 'row', gap: 13, alignItems: 'center' },
  clubIcon: { width: 53, height: 53, borderRadius: 17, backgroundColor: '#403324',
    alignItems: 'center', justifyContent: 'center' },
  clubTitle: { color: palette.text, fontSize: 18, fontWeight: '900' },
  muted: { color: palette.muted, fontSize: 12, lineHeight: 19 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { color: palette.text, fontWeight: '700', fontSize: 12 },
  message: { color: palette.accent, fontSize: 12, lineHeight: 19 },
  feedHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 13 },
  feedLabel: { color: palette.accent, fontSize: 10, letterSpacing: 2, fontWeight: '900' },
  feedTitle: { color: palette.text, fontSize: 27, fontWeight: '900' },
  reloadButton: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface,
    borderRadius: 22, padding: 11 },
  filters: { gap: 9, paddingBottom: 3 },
  chip: { paddingHorizontal: 17, paddingVertical: 11, borderRadius: 22, borderWidth: 1,
    borderColor: palette.line, backgroundColor: palette.surface },
  selectedChip: { borderColor: palette.accent, backgroundColor: palette.accent },
  chipText: { color: palette.text, fontSize: 12, fontWeight: '800' },
  selectedText: { color: '#21180E' },
  error: { color: palette.danger, fontSize: 13 },
  safety: { flexDirection: 'row', gap: 12, borderRadius: 19, padding: 17,
    borderColor: palette.line, borderWidth: 1, backgroundColor: palette.surface },
  safetyTitle: { color: palette.text, fontSize: 14, fontWeight: '900' },
});
