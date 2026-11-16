import React, { useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { HomeHero } from '../../src/components/HomeHero';
import { DemoFlag, EmptyState, PostCard } from '../../src/components/UI';
import { useArtist } from '../../src/context/ArtistContext';
import { useAuth } from '../../src/context/AuthContext';
import { useArtistContent } from '../../src/hooks/useArtistContent';
import { palette } from '../../src/theme/tokens';
import { BRAND_ARTIST_NAME } from '../../src/config/brand';
import type { Post } from '../../src/types/domain';

function welcomeMessage() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Bom dia!' : hour < 19 ? 'Boa tarde!' : 'Boa noite!';
}

function NewsPreview({ post, onOpen }: { post: Post; onOpen: () => void }) {
  const names = { musica: 'MÚSICA', novidade: 'NOVIDADES', bastidores: 'BASTIDORES' };
  const icons = { musica: 'musical-notes', novidade: 'sparkles', bastidores: 'videocam' } as const;
  return <Pressable accessibilityRole="button" onPress={onOpen}
    style={({ pressed }) => ({ flex: 1, minHeight: 194, backgroundColor: '#1B191D',
      borderWidth: 1, borderColor: '#3A3331', borderRadius: 18, padding: 16, gap: 11,
      opacity: pressed ? 0.75 : 1 })}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Ionicons name={icons[post.category]} color={palette.accent} size={15}/>
      <Text style={{ color: palette.accent, fontSize: 10, letterSpacing: 1.1, fontWeight: '900' }}>
        {names[post.category]}
      </Text>
    </View>
    <Text numberOfLines={3} style={{ color: palette.text, fontSize: 18, lineHeight: 23,
      fontWeight: '800' }}>{post.title}</Text>
    <Text numberOfLines={3} style={{ color: palette.muted, fontSize: 12, lineHeight: 18 }}>
      {post.body}
    </Text>
  </Pressable>;
}

export default function HomeScreen() {
  const { selected, loading: artistLoading, error: artistError, refresh: reloadArtist } = useArtist();
  const { session } = useAuth();
  const { posts, loading, error } = useArtistContent(selected?.id);
  const { width } = useWindowDimensions();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const newsTop = useRef(0);
  const firstName = typeof session?.user.user_metadata?.full_name === 'string'
    ? session.user.user_metadata.full_name.trim().split(/\s+/)[0] : '';
  const welcome = welcomeMessage();
  const greeting = firstName ? welcome.replace('!', '') + ', ' + firstName + '!' : welcome;
  const desktop = width >= 750;

  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
    <ScrollView ref={scroll} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 35 }}>
      <View style={{ width: '100%', maxWidth: 1120, alignSelf: 'center' }}>
        {selected ? <HomeHero
          artist={selected} greeting={greeting}
          onUpdates={() => scroll.current?.scrollTo({ y: newsTop.current, animated: true })}
          onCommunity={() => router.push('/(tabs)/community')}
        /> : <View style={{ paddingHorizontal: 22, paddingVertical: 40 }}>
          {artistLoading ? <ActivityIndicator color={palette.accent}/> :
            <EmptyState title="Comunidade indisponível" detail={artistError
              ? "Não foi possível aceder à base de dados. Confirma a ligação no separador Perfil."
              : "Não foi possível carregar a comunidade de " + BRAND_ARTIST_NAME + "."}/>}
          {!artistLoading ? <Pressable accessibilityRole="button" onPress={() => void reloadArtist()}
            style={{ alignSelf: 'center', marginTop: 15, padding: 12, backgroundColor: palette.surface,
              borderRadius: 14, borderWidth: 1, borderColor: palette.line }}>
            <Text style={{ color: palette.accent, fontWeight: '800' }}>Tentar novamente</Text>
          </Pressable> : null}
        </View>}
        <View onLayout={event => { newsTop.current = event.nativeEvent.layout.y; }}
          style={{ paddingHorizontal: desktop ? 52 : 22, paddingTop: 43, gap: 20,
            backgroundColor: palette.background }}>
          <View style={{ gap: 8 }}>
            <Text style={{ color: palette.accent, fontSize: 12, letterSpacing: 2.5,
              fontWeight: '900' }}>AGORA</Text>
            <Text style={{ color: '#FFFFFF', fontSize: desktop ? 43 : 35,
              letterSpacing: -1, fontWeight: '900' }}>O QUE HÁ DE NOVO</Text>
          </View>
          <DemoFlag />
          {loading ? <ActivityIndicator color={palette.accent}/> : null}
          {error ? <Text style={{ color: palette.danger }}>{error}</Text> : null}
          {!loading && !posts.length ? <EmptyState title="Sem publicações"
            detail="As novidades do artista aparecerão aqui."/> : null}
          {posts.length > 0 ? <View style={{ flexDirection: 'row', gap: 12 }}>
            {posts.slice(0, 2).map(post => <NewsPreview key={post.id} post={post}
              onOpen={() => router.push('/(tabs)/community')}/>)}
          </View> : null}
          {posts.length > 2 ? posts.slice(2).map(post => <PostCard key={post.id} post={post}/>) : null}
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
