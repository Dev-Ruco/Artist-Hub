import React from 'react';
import { ActivityIndicator, Alert, Linking, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActionButton, DemoFlag, EmptyState, Eyebrow, EventCard, Heading, Screen } from '../../src/components/UI';
import { useArtist } from '../../src/context/ArtistContext';
import { useArtistContent } from '../../src/hooks/useArtistContent';
import { palette } from '../../src/theme/tokens';

export default function EventsScreen() {
  const { selected } = useArtist();
  const { events, loading, error } = useArtistContent(selected?.id);
  return <Screen>
    <Eyebrow>AO VIVO E PERTO DE TI</Eyebrow>
    <Heading subtitle="Descobre a agenda do artista e prepara a próxima experiência.">Eventos</Heading>
    <DemoFlag />
    <View style={{ padding: 16, backgroundColor: palette.surfaceRaised, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Ionicons name="ticket-outline" size={27} color={palette.accent}/>
      <Text style={{ flex: 1, color: palette.muted, fontSize: 12, lineHeight: 19 }}>Os bilhetes só serão abertos através de ligações oficiais e verificadas.</Text>
    </View>
    {loading ? <ActivityIndicator color={palette.accent}/> : null}
    {error ? <Text style={{ color: palette.danger }}>{error}</Text> : null}
    {!loading && !events.length ? <EmptyState icon="calendar-outline" title="Sem eventos anunciados" detail="Os próximos eventos do artista aparecerão aqui." /> : null}
    {events.map(event => <View key={event.id} style={{ gap: 10 }}><EventCard event={event}/>
      {event.ticket_url ? <ActionButton label="Consultar bilhetes" variant="secondary" onPress={() => {
        if (event.ticket_url && /^https:\/\//i.test(event.ticket_url)) void Linking.openURL(event.ticket_url);
        else Alert.alert('Ligação inválida', 'O endereço oficial não está disponível.');
      }}/> : null}</View>)}
  </Screen>;
}
