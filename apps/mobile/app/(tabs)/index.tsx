import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, ArtistHero, ArtistSwitcher, DemoFlag, EmptyState, Eyebrow, Label, PostCard } from '../../src/components/UI';
import { useArtist } from '../../src/context/ArtistContext';
import { useArtistContent } from '../../src/hooks/useArtistContent';
import { palette } from '../../src/theme/tokens';

export default function HomeScreen() {
  const { selected } = useArtist();
  const { posts, loading, error } = useArtistContent(selected?.id);
  return <Screen>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View><Eyebrow>ARTIST HUB · PILOTO</Eyebrow><Text style={{ color: palette.text, fontSize: 26, fontWeight: '900' }}>O teu backstage.</Text></View>
      <View style={{ backgroundColor: palette.surfaceRaised, borderRadius: 20, padding: 12 }}><Ionicons name="radio-outline" color={palette.accent} size={23}/></View>
    </View>
    <DemoFlag />
    <ArtistSwitcher />
    {selected ? <ArtistHero artist={selected} /> : <EmptyState title="Comunidade indisponível" detail="Adicione artistas para iniciar a experiência." />}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Label>Últimas novidades</Label><Text style={{ color: palette.muted, fontSize: 12 }}>Feed oficial</Text></View>
    {loading ? <ActivityIndicator color={palette.accent} /> : null}
    {error ? <Text style={{ color: palette.danger }}>{error}</Text> : null}
    {!loading && !posts.length ? <EmptyState title="Sem publicações" detail="As novidades do artista aparecerão aqui." /> : posts.map(post => <PostCard key={post.id} post={post} />)}
  </Screen>;
}
