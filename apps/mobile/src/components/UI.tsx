import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useArtist } from '../context/ArtistContext';
import { isDemoMode } from '../lib/supabase';
import type { Artist, ArtistEvent, Post } from '../types/domain';
import { palette, radius } from '../theme/tokens';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  return <SafeAreaView edges={['top']} style={styles.safe}>
    {scroll ? <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      : <View style={[styles.screenContent, { flex: 1 }]}>{children}</View>}
  </SafeAreaView>;
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}
export function Heading({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return <View style={{ gap: 8, marginBottom: 18 }}><Text style={styles.heading}>{children}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>;
}
export function Label({ children }: { children: React.ReactNode }) { return <Text style={styles.label}>{children}</Text>; }
export function EmptyState({ icon = 'albums-outline', title, detail }: {
  icon?: React.ComponentProps<typeof Ionicons>['name']; title: string; detail: string;
}) {
  return <View style={styles.empty}><Ionicons name={icon} size={30} color={palette.muted}/>
    <Text style={styles.emptyTitle}>{title}</Text><Text style={styles.mutedCenter}>{detail}</Text></View>;
}
export function ActionButton({ label, onPress, disabled, variant = 'primary', style }: {
  label: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'secondary'; style?: ViewStyle;
}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, variant === 'secondary' ? styles.buttonSecondary : styles.buttonPrimary,
      disabled && { opacity: .45 }, pressed && { opacity: .75 }, style]}>
    <Text style={[styles.buttonText, variant === 'secondary' && { color: palette.text }]}>{label}</Text>
  </Pressable>;
}
export function DemoFlag() {
  if (!isDemoMode) return null;
  return <View style={styles.demoFlag}><Ionicons name="flask-outline" color={palette.warning} size={14}/>
    <Text style={{ color: palette.warning, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>DADOS FICTÍCIOS · DEMONSTRAÇÃO</Text></View>;
}
export function ArtistSwitcher() {
  const { artists, selected, selectArtist, loading, error } = useArtist();
  if (loading) return <ActivityIndicator color={palette.accent} />;
  if (error) return <Text style={{ color: palette.danger }}>{error}</Text>;
  if (!artists.length) return <EmptyState title="Sem artistas" detail="Registe e active um artista na base de dados." />;
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9, paddingBottom: 8 }}>
    {artists.map(artist => <Pressable key={artist.id} onPress={() => selectArtist(artist.id)}
      accessibilityRole="button"
      style={[styles.artistChip, selected?.id === artist.id && { borderColor: artist.accent_color, backgroundColor: '#21292A' }]}>
      <View style={[styles.artistDot, { backgroundColor: artist.accent_color }]}/>
      <Text numberOfLines={1} style={styles.chipText}>{artist.display_name}</Text>
      {artist.is_verified ? <Ionicons name="checkmark-circle" color={artist.accent_color} size={14}/> : null}
    </Pressable>)}
  </ScrollView>;
}
export function ArtistHero({ artist }: { artist: Artist }) {
  return <View style={[styles.hero, { borderColor: artist.accent_color + '44' }]}>
    <View style={[styles.heroHalo, { backgroundColor: artist.accent_color + '22' }]}/>
    <Eyebrow>ESPAÇO OFICIAL DO ARTISTA</Eyebrow>
    <Text style={styles.heroName}>{artist.display_name}</Text>
    <Text style={styles.heroTagline}>{artist.tagline || 'Mais perto de quem faz a música acontecer.'}</Text>
    <View style={styles.heroFooter}>
      <View style={[styles.heroSmallDot, { backgroundColor: artist.accent_color }]}/>
      <Text style={styles.heroFooterText}>Comunidade · Conteúdos · Eventos</Text>
    </View>
  </View>;
}
export function PostCard({ post }: { post: Post }) {
  const category = { musica: 'MÚSICA', bastidores: 'BASTIDORES', novidade: 'NOVIDADES' }[post.category];
  return <View style={styles.card}>
    <View style={styles.cardTop}><View style={styles.categoryPill}><Text style={styles.categoryText}>{category}</Text></View>
      <Text style={styles.smallMuted}>{new Date(post.published_at).toLocaleDateString('pt-PT')}</Text></View>
    <Text style={styles.cardTitle}>{post.title}</Text><Text style={styles.cardBody}>{post.body}</Text>
    <View style={styles.cardBottom}><Ionicons name="sparkles-outline" color={palette.violet} size={15}/>
      <Text style={styles.smallMuted}>Publicação oficial</Text></View>
  </View>;
}
export function EventCard({ event }: { event: ArtistEvent }) {
  const date = new Date(event.starts_at);
  return <View style={styles.card}>
    <View style={styles.eventRow}>
      <View style={styles.dateBox}><Text style={styles.dateNumber}>{date.getDate()}</Text>
        <Text style={styles.dateMonth}>{date.toLocaleDateString('pt-PT', { month: 'short' }).replace('.', '').toUpperCase()}</Text></View>
      <View style={{ flex: 1, gap: 4 }}><Text style={styles.cardTitle}>{event.title}</Text>
        <Text style={styles.cardBody}>{event.venue} · {event.city}</Text>
        <Text style={styles.smallMuted}>{date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</Text></View>
    </View>
  </View>;
}
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  screenContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48, gap: 20 },
  eyebrow: { color: palette.accent, fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  heading: { fontSize: 30, color: palette.text, fontWeight: '800', letterSpacing: -.7 },
  subtitle: { fontSize: 14, color: palette.muted, lineHeight: 21 },
  label: { fontSize: 16, color: palette.text, fontWeight: '800' },
  mutedCenter: { color: palette.muted, textAlign: 'center', lineHeight: 20 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderColor: palette.line, backgroundColor: palette.surface,
    padding: 26, borderRadius: radius.lg, alignItems: 'center', gap: 12 },
  emptyTitle: { color: palette.text, fontSize: 17, fontWeight: '700' },
  button: { paddingVertical: 15, paddingHorizontal: 18, minHeight: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: palette.accent },
  buttonSecondary: { backgroundColor: palette.surfaceRaised, borderColor: palette.line, borderWidth: 1 },
  buttonText: { color: palette.background, fontWeight: '800', fontSize: 14 },
  demoFlag: { flexDirection: 'row', gap: 7, alignItems: 'center', alignSelf: 'flex-start' },
  artistChip: { borderColor: palette.line, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 99,
    alignItems: 'center', gap: 8, flexDirection: 'row', maxWidth: 200 },
  artistDot: { height: 9, width: 9, borderRadius: 9 },
  chipText: { color: palette.text, fontSize: 12, fontWeight: '700' },
  hero: { backgroundColor: '#1B2125', borderWidth: 1, borderRadius: radius.xl, padding: 24, gap: 12,
    minHeight: 250, overflow: 'hidden', justifyContent: 'flex-end' },
  heroHalo: { width: 240, height: 240, borderRadius: 120, position: 'absolute', right: -75, top: -90 },
  heroName: { color: palette.white, fontSize: 35, lineHeight: 40, fontWeight: '900', letterSpacing: -1.8 },
  heroTagline: { color: '#C3CFD6', fontSize: 15, lineHeight: 22, maxWidth: 250 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  heroSmallDot: { width: 6, height: 6, borderRadius: 3 },
  heroFooterText: { color: palette.muted, fontSize: 11 },
  card: { backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 1,
    borderRadius: radius.lg, padding: 18, gap: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryPill: { backgroundColor: '#303440', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 6 },
  categoryText: { color: palette.accent, letterSpacing: 1, fontSize: 9, fontWeight: '800' },
  smallMuted: { color: palette.muted, fontSize: 11 },
  cardTitle: { color: palette.text, fontSize: 18, fontWeight: '800', lineHeight: 23 },
  cardBody: { color: '#B6C0CD', fontSize: 13, lineHeight: 21 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 2 },
  eventRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  dateBox: { backgroundColor: '#293426', minWidth: 64, borderRadius: 16, padding: 9, alignItems: 'center' },
  dateNumber: { color: palette.accent, fontSize: 26, fontWeight: '900' },
  dateMonth: { color: palette.accent, fontSize: 11, fontWeight: '700' },
});
