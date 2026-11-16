import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionButton, DemoFlag, EmptyState, Eyebrow, Heading, Label, PostCard, Screen } from '../../src/components/UI';
import { useArtist } from '../../src/context/ArtistContext';
import { useAuth } from '../../src/context/AuthContext';
import { useArtistContent } from '../../src/hooks/useArtistContent';
import { db, isDemoMode } from '../../src/lib/supabase';
import { palette } from '../../src/theme/tokens';

export default function CommunityScreen() {
  const { selected } = useArtist();
  const { session } = useAuth();
  const { posts, loading, error } = useArtistContent(selected?.id);
  const [joining, setJoining] = useState(false);
  async function join() {
    if (isDemoMode) { Alert.alert('Demonstração', 'Configure o Supabase para aderir a uma comunidade real.'); return; }
    if (!session) { router.push('/(auth)/login'); return; }
    if (!selected) return;
    setJoining(true);
    const { error: joinError } = await db().from('artist_memberships').upsert(
      { artist_id: selected.id, user_id: session.user.id }, { onConflict: 'artist_id,user_id', ignoreDuplicates: true }
    );
    setJoining(false);
    Alert.alert(joinError ? 'Não foi possível aderir' : 'Comunidade', joinError?.message || 'Adesão registada com sucesso.');
  }
  return <Screen>
    <Eyebrow>A TUA TRIBO</Eyebrow>
    <Heading subtitle="Acompanha, participa e aproxima-te da comunidade de Mr. Bow.">Comunidade</Heading>
    <DemoFlag />
    <View style={{ backgroundColor: palette.surfaceRaised, borderRadius: 24, padding: 21, gap: 14 }}>
      <Ionicons name="people-circle-outline" color={palette.accent} size={35}/>
      <Text style={{ color: palette.text, fontSize: 19, fontWeight: '800' }}>{selected?.display_name || 'Mr. Bow'}</Text>
      <Text style={{ color: palette.muted, lineHeight: 21, fontSize: 13 }}>Segue as publicações e passa a fazer parte da comunidade oficial. A conversa em tempo real será activada numa fase posterior.</Text>
      <ActionButton label={joining ? 'A registar...' : 'Aderir à comunidade'} onPress={() => void join()} disabled={joining || !selected} />
    </View>
    <Label>Publicações da comunidade</Label>
    {loading ? <ActivityIndicator color={palette.accent}/> : null}
    {error ? <Text style={{ color: palette.danger }}>{error}</Text> : null}
    {!loading && !posts.length ? <EmptyState title="Ainda sem conteúdos" detail="Os conteúdos oficiais aparecem nesta área." /> : posts.map(post => <PostCard key={post.id} post={post}/>)}
    <View style={{ padding: 15, borderRadius: 16, borderColor: palette.line, borderWidth: 1, gap: 6 }}>
      <Text style={{ color: palette.text, fontWeight: '700' }}>Protecção da comunidade</Text>
      <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 19 }}>O chat de fãs só será lançado com denúncia, bloqueio, moderação e regras de participação.</Text>
    </View>
  </Screen>;
}
