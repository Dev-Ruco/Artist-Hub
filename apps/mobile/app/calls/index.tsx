import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionButton, DemoFlag, EmptyState, Eyebrow, Screen } from '../../src/components/UI';
import { useArtist } from '../../src/context/ArtistContext';
import { useAuth } from '../../src/context/AuthContext';
import { useCallOffers } from '../../src/hooks/useCallOffers';
import { isDemoMode } from '../../src/lib/supabase';
import type { AvailableCallSlot, CallKind, CallService } from '../../src/types/calls';
import { bookingStatusLabels } from '../../src/types/calls';
import { palette } from '../../src/theme/tokens';

// A activacao exige checkout real e emissao de credenciais WebRTC pelo backend.
// Nenhuma chamada nem transaccao e iniciada por esta pre-visualizacao.
const PAYMENT_CHECKOUT_CONNECTED = false;

function money(priceMinor: number) {
  return (priceMinor / 100).toLocaleString('pt-PT', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }) + ' MT';
}
function timeForMaputo(date: string) {
  return new Date(date).toLocaleString('pt-PT', {
    timeZone: 'Africa/Maputo', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

function TypeCard({ kind, title, description, onPress, active }: {
  kind: CallKind; title: string; description: string; onPress: () => void; active: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }}
    onPress={onPress} style={({ pressed }) => [
      styles.typeCard, active && styles.activeType, pressed && { opacity: 0.75 },
    ]}>
    <View style={[styles.typeIcon, active && styles.activeIcon]}>
      <Ionicons name={kind === 'video' ? 'videocam-outline' : 'call-outline'} size={28}
        color={palette.accent}/>
    </View>
    <Text style={styles.typeTitle}>{title}</Text>
    <Text style={styles.typeText}>{description}</Text>
    <View style={styles.typeFooter}>
      <Text style={styles.typeLink}>Ver detalhes</Text>
      <Ionicons name="arrow-forward" size={17} color={palette.accent}/>
    </View>
  </Pressable>;
}

function SlotRow({ slot, selected, onPress }: {
  slot: AvailableCallSlot; selected: boolean; onPress: () => void;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }}
    onPress={onPress} style={[styles.slot, selected && styles.selectedSlot]}>
    <Ionicons name="calendar-outline" size={19} color={selected ? palette.accent : palette.muted}/>
    <View style={{ flex: 1 }}>
      <Text style={styles.slotTitle}>{timeForMaputo(slot.starts_at)}</Text>
      <Text style={styles.slotSubtitle}>Hora de Maputo · Sessão individual</Text>
    </View>
    <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'}
      size={21} color={selected ? palette.accent : palette.muted}/>
  </Pressable>;
}

export default function CallBookingScreen() {
  const { selected: artist } = useArtist();
  const { session } = useAuth();
  const {
    services, selectedServiceId, selectService, slots, bookings,
    loading, loadingSlots, loadingBookings, error, reload,
  } = useCallOffers(artist?.id, session?.user.id);
  const [kind, setKind] = useState<CallKind>('video');
  const [slotId, setSlotId] = useState<string | null>(null);

  const forKind = useMemo(() => services.filter(s => s.kind === kind), [services, kind]);
  const chosen = useMemo(() =>
    services.find(s => s.id === selectedServiceId && s.kind === kind) || forKind[0] || null,
  [services, selectedServiceId, forKind, kind]);
  const activeSlot = slots.find(s => s.slot_id === slotId);

  useEffect(() => {
    setSlotId(null);
  }, [kind, selectedServiceId]);

  function changeKind(next: CallKind) {
    setKind(next);
    const nextService = services.find(s => s.kind === next);
    selectService(nextService?.id || null);
  }

  return <Screen>
    <Pressable accessibilityRole="button" onPress={() => router.back()}
      style={styles.back} accessibilityLabel="Voltar">
      <Ionicons name="arrow-back" color={palette.text} size={25}/>
      <Text style={styles.backText}>Voltar</Text>
    </Pressable>
    <Eyebrow>EXPERIÊNCIA EXCLUSIVA</Eyebrow>
    <View style={styles.heading}>
      <Text style={styles.headingTitle}>Um momento com Mr. Bow.</Text>
      <Text style={styles.headingDesc}>Chamada individual por áudio ou vídeo, com marcação e duração previamente definidas.</Text>
    </View>
    <DemoFlag/>
    <View style={styles.notice}>
      <Ionicons name="shield-checkmark-outline" color={palette.accent} size={22}/>
      <Text style={styles.noticeText}>As chamadas serão realizadas dentro da aplicação, sem divulgar o número pessoal do artista. A agenda e os pagamentos ainda não estão activos.</Text>
    </View>

    <Text style={styles.sectionTitle}>Escolhe a experiência</Text>
    <View style={styles.types}>
      <TypeCard kind="audio" title="Áudio" description="Conversa privada por voz."
        active={kind === 'audio'} onPress={() => changeKind('audio')}/>
      <TypeCard kind="video" title="Vídeo" description="Conversa frente a frente."
        active={kind === 'video'} onPress={() => changeKind('video')}/>
    </View>

    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{kind === 'video' ? 'Chamada de vídeo' : 'Chamada de áudio'}</Text>
      {loading ? <ActivityIndicator color={palette.accent}/> : null}
      {forKind.length === 0 ? <>
        <Text style={styles.muted}>As durações e os preços desta experiência serão divulgados quando a equipa de Mr. Bow abrir a agenda.</Text>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" color={palette.accent} size={21}/>
          <Text style={styles.detailText}>Duração a definir</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" color={palette.accent} size={21}/>
          <Text style={styles.detailText}>Preço ainda não anunciado</Text>
        </View>
      </> : forKind.map((service: CallService) =>
        <Pressable accessibilityRole="button" key={service.id}
          accessibilityState={{ selected: chosen?.id === service.id }}
          onPress={() => { selectService(service.id); setSlotId(null); }}
          style={[styles.serviceRow, chosen?.id === service.id && styles.selectedService]}>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={styles.serviceTitle}>{service.title}</Text>
            <Text style={styles.muted}>{service.duration_minutes} minutos · {service.description}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 5 }}>
            <Text style={styles.price}>{money(service.price_minor)}</Text>
            <Ionicons name={chosen?.id === service.id ? 'checkmark-circle' : 'ellipse-outline'}
              color={palette.accent} size={20}/>
          </View>
        </Pressable>)}
    </View>

    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>Horários disponíveis</Text>
      {loadingSlots ? <ActivityIndicator color={palette.accent} size="small"/> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Actualizar horários"
        onPress={() => void reload()} style={styles.refresh}>
        <Ionicons name="refresh-outline" color={palette.text} size={21}/>
      </Pressable>
    </View>
    {slots.length > 0 && chosen ? slots.map(slot =>
      <SlotRow key={slot.slot_id} slot={slot} selected={slot.slot_id === slotId}
        onPress={() => setSlotId(slot.slot_id)}/>) :
      <EmptyState icon="calendar-outline" title="Agenda ainda não aberta"
        detail="Quando Mr. Bow disponibilizar sessões para reserva, os horários aparecerão aqui."/>}

    <View style={styles.checkout}>
      <Text style={styles.checkoutTitle}>A tua reserva</Text>
      <Text style={styles.muted}>{chosen
        ? chosen.title + ' · ' + chosen.duration_minutes + ' minutos'
        : kind === 'video' ? 'Chamada de vídeo' : 'Chamada de áudio'}</Text>
      <Text style={styles.muted}>{activeSlot
        ? 'Horário: ' + timeForMaputo(activeSlot.starts_at)
        : 'Selecciona um horário disponível para continuar.'}</Text>
      {chosen ? <Text style={styles.total}>{money(chosen.price_minor)}</Text> : null}
      <ActionButton label="Reservas e pagamentos indisponíveis"
        onPress={() => { /* Bloqueado ate existir checkout verificado. */ }}
        disabled={!PAYMENT_CHECKOUT_CONNECTED || !chosen || !activeSlot || isDemoMode}/>
      <Text style={styles.warning}>Nenhum pagamento será cobrado nesta fase. A tua escolha não constitui uma reserva.</Text>
    </View>

    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>As minhas reservas</Text>
      {loadingBookings ? <ActivityIndicator color={palette.accent} size="small"/> : null}
    </View>
    {!session ? <View style={styles.panel}>
      <Text style={styles.muted}>Inicia sessão para poderes acompanhar futuras reservas.</Text>
      <ActionButton label="Entrar na minha conta" disabled={isDemoMode}
        onPress={() => router.push('/(auth)/login')} variant="secondary"/>
    </View> : bookings.length === 0 && !loadingBookings ?
      <EmptyState icon="ticket-outline" title="Sem reservas"
        detail="As tuas sessões confirmadas e pendentes aparecerão neste espaço."/> : null}
    {session ? bookings.map(booking => <View key={booking.booking_id} style={styles.booking}>
      <View style={styles.bookingTop}>
        <Text style={styles.bookingName}>{booking.service_title}</Text>
        <Text style={styles.bookingBadge}>{bookingStatusLabels[booking.booking_status]}</Text>
      </View>
      <Text style={styles.detailText}>{timeForMaputo(booking.starts_at)} · {booking.duration_minutes} minutos</Text>
      <Text style={styles.muted}>{money(booking.price_minor)} · {booking.call_kind === 'video' ? 'Vídeo' : 'Áudio'}</Text>
      {booking.booking_status === 'confirmed' ? <Text style={styles.muted}>
        O acesso à sala privada será disponibilizado quando o serviço de chamadas estiver activo.
      </Text> : null}
    </View>) : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Text style={styles.disclaimer}>As sessões estarão sujeitas a confirmação, regras de participação, privacidade e condições de cancelamento. Não é permitido gravar a chamada sem consentimento.</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', flexDirection: 'row', gap: 10,
    alignItems: 'center', paddingVertical: 7 },
  backText: { color: palette.text, fontWeight: '800', fontSize: 13 },
  heading: { gap: 9 },
  headingTitle: { color: palette.text, fontSize: 33, lineHeight: 40,
    fontWeight: '900', letterSpacing: -1 },
  headingDesc: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  notice: { backgroundColor: '#29231E', borderRadius: 17, padding: 15,
    flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  noticeText: { flex: 1, color: '#E0D2BE', fontSize: 12, lineHeight: 19 },
  sectionTitle: { color: palette.text, fontSize: 21, fontWeight: '900' },
  types: { flexDirection: 'row', gap: 12 },
  typeCard: { flex: 1, backgroundColor: palette.surface, borderWidth: 1,
    borderColor: palette.line, borderRadius: 20, padding: 15, gap: 10,
    minHeight: 192 },
  activeType: { borderColor: palette.accent, backgroundColor: '#29221A' },
  typeIcon: { backgroundColor: '#31281F', borderRadius: 15,
    width: 49, height: 49, alignItems: 'center', justifyContent: 'center' },
  activeIcon: { backgroundColor: '#40311E' },
  typeTitle: { color: palette.text, fontSize: 18, fontWeight: '900' },
  typeText: { color: palette.muted, fontSize: 12, lineHeight: 18, flex: 1 },
  typeFooter: { flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 4 },
  typeLink: { color: palette.accent, fontWeight: '800', fontSize: 11 },
  panel: { backgroundColor: palette.surface, borderRadius: 22, padding: 18,
    borderWidth: 1, borderColor: palette.line, gap: 14 },
  panelTitle: { color: palette.text, fontSize: 19, fontWeight: '900' },
  muted: { color: palette.muted, fontSize: 12, lineHeight: 19 },
  detailRow: { flexDirection: 'row', gap: 11, alignItems: 'center' },
  detailText: { color: palette.text, fontSize: 13, lineHeight: 20 },
  serviceRow: { borderColor: palette.line, borderWidth: 1, padding: 13,
    borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedService: { borderColor: palette.accent },
  serviceTitle: { color: palette.text, fontWeight: '800', fontSize: 14 },
  price: { color: palette.accent, fontSize: 14, fontWeight: '900' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', gap: 10, marginTop: 10 },
  refresh: { padding: 11, borderRadius: 21, borderColor: palette.line,
    borderWidth: 1, backgroundColor: palette.surface },
  slot: { backgroundColor: palette.surface, borderRadius: 17, padding: 14,
    borderWidth: 1, borderColor: palette.line, flexDirection: 'row',
    gap: 12, alignItems: 'center' },
  selectedSlot: { borderColor: palette.accent },
  slotTitle: { color: palette.text, fontSize: 14, fontWeight: '900' },
  slotSubtitle: { color: palette.muted, fontSize: 11, marginTop: 4 },
  checkout: { backgroundColor: palette.surfaceRaised, borderRadius: 23,
    padding: 19, gap: 13, borderWidth: 1, borderColor: palette.line },
  checkoutTitle: { color: palette.text, fontWeight: '900', fontSize: 20 },
  total: { color: palette.accent, fontWeight: '900', fontSize: 23 },
  warning: { color: palette.muted, fontSize: 11, lineHeight: 18 },
  booking: { backgroundColor: palette.surface, borderRadius: 18,
    borderWidth: 1, borderColor: palette.line, padding: 15, gap: 10 },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', gap: 10 },
  bookingName: { color: palette.text, fontSize: 15, fontWeight: '900', flex: 1 },
  bookingBadge: { color: palette.accent, fontSize: 11, fontWeight: '800' },
  error: { color: palette.danger, fontSize: 12 },
  disclaimer: { color: palette.muted, fontSize: 11, lineHeight: 18,
    textAlign: 'center', paddingHorizontal: 6 },
});
