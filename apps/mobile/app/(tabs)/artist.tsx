import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionButton, DemoFlag, EmptyState, Eyebrow, Screen } from '../../src/components/UI';
import { useArtist } from '../../src/context/ArtistContext';
import { useAuth } from '../../src/context/AuthContext';
import { db, isDemoMode } from '../../src/lib/supabase';
import { palette } from '../../src/theme/tokens';

type FanRequest = {
  id: string;
  body: string;
  status: 'pending' | 'answered' | 'declined';
  request_type: 'free' | 'paid';
  created_at: string;
  replied_at: string | null;
};
const statuses: Record<FanRequest['status'], string> = {
  pending: 'Em análise',
  answered: 'Respondida',
  declined: 'Não aceite',
};

export default function ArtistScreen() {
  const { selected } = useArtist();
  const { session } = useAuth();
  const userId = session?.user.id;
  const artistId = selected?.id;
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<FanRequest[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadRequests = useCallback(async () => {
    if (!userId || !artistId || isDemoMode) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: queryError } = await db().from('message_requests')
      .select('id,body,status,request_type,created_at,replied_at')
      .eq('fan_id', userId).eq('artist_id', artistId)
      .order('created_at', { ascending: false }).limit(40);
    if (queryError) setError('Não foi possível consultar as perguntas enviadas.');
    else setRequests((data || []) as FanRequest[]);
    setLoading(false);
  }, [userId, artistId]);
  useEffect(() => { void loadRequests(); }, [loadRequests]);

  const last24Hours = useMemo(() => {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    return requests.filter(request => request.request_type === 'free' &&
      new Date(request.created_at).getTime() > since).length;
  }, [requests]);
  const remaining = Math.max(0, 3 - last24Hours);

  async function sendQuestion() {
    setMessage('');
    const content = question.trim();
    if (content.length < 10 || content.length > 1000) {
      setMessage('Escreve uma pergunta com 10 a 1000 caracteres.');
      return;
    }
    if (isDemoMode) { setMessage('O envio estará disponível quando ligarmos o serviço de contas.'); return; }
    if (!session) { router.push('/(auth)/login'); return; }
    if (!artistId || sending) return;
    if (remaining === 0) { setMessage('Atingiste o limite de três perguntas nas últimas 24 horas.'); return; }
    setSending(true);
    try {
      const { error: insertError } = await db().from('message_requests').insert({
        artist_id: artistId,
        fan_id: session.user.id,
        body: content,
        request_type: 'free',
        status: 'pending',
      });
      if (insertError) {
        setMessage(insertError.message.includes('Limite de 3')
          ? 'Atingiste o limite de três perguntas nas últimas 24 horas.'
          : 'Não foi possível enviar a pergunta. Tenta novamente.');
        return;
      }
      setQuestion('');
      setMessage('Pergunta registada. Podes acompanhar o estado abaixo.');
      await loadRequests();
    } catch {
      setMessage('Não foi possível enviar. Confirma a ligação e tenta novamente.');
    } finally {
      setSending(false);
    }
  }

  return <Screen>
    <Eyebrow>MAIS PERTO DE MR. BOW</Eyebrow>
    <View style={styles.intro}>
      <Text style={styles.title}>Fala com a equipa.</Text>
      <Text style={styles.description}>Envia uma pergunta à equipa de Mr. Bow e acompanha o pedido. O envio gratuito não garante uma resposta pessoal do artista.</Text>
    </View>
    <DemoFlag />
    <Pressable accessibilityRole="button" accessibilityLabel="Conhecer as chamadas privadas de áudio e vídeo"
      onPress={() => router.push('/calls')}
      style={({ pressed }) => [styles.callExperience, pressed && { opacity: 0.76 }]}>
      <View style={styles.callIcon}>
        <Ionicons name="videocam-outline" size={29} color={palette.accent}/>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.callEyebrow}>EXPERIÊNCIA PRIVADA</Text>
        <Text style={styles.callTitle}>Áudio ou vídeo com Mr. Bow</Text>
        <Text style={styles.callText}>Descobre como funcionarão as sessões individuais, com marcação e pagamento seguro.</Text>
        <Text style={styles.callStatus}>AGENDA EM PREPARAÇÃO</Text>
      </View>
      <Ionicons name="arrow-forward" size={20} color={palette.accent}/>
    </Pressable>
    <View style={styles.questionCard}>
      <View style={styles.cardTop}>
        <View style={styles.icon}><Ionicons name="chatbubble-ellipses-outline"
          size={27} color={palette.accent}/></View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={styles.cardTitle}>A tua pergunta</Text>
          <Text style={styles.description}>Até 3 perguntas gratuitas num período de 24 horas.</Text>
        </View>
      </View>
      {!session ? <View style={styles.notice}>
        <Ionicons name="lock-closed-outline" color={palette.accent} size={18}/>
        <Text style={styles.noticeText}>Entra na tua conta para poderes enviar e acompanhar perguntas.</Text>
      </View> : null}
      {session && !isDemoMode ? <Text style={styles.quota}>
        {remaining} {remaining === 1 ? 'pergunta disponível' : 'perguntas disponíveis'} nas últimas 24 horas
      </Text> : null}
      <TextInput
        value={question} onChangeText={setQuestion} multiline maxLength={1000}
        accessibilityLabel="Escreve uma pergunta à equipa de Mr. Bow"
        placeholder="O que gostarias de perguntar?"
        placeholderTextColor={palette.muted}
        textAlignVertical="top" style={styles.input}
        editable={Boolean(session) && !isDemoMode && !sending && remaining > 0}
      />
      <View style={styles.counter}>
        <Text style={styles.muted}>{question.length}/1000</Text>
      </View>
      {message ? <Text accessibilityRole="alert" style={styles.feedback}>{message}</Text> : null}
      {!session ? <ActionButton label="Entrar para enviar"
        disabled={isDemoMode} onPress={() => router.push('/(auth)/login')}/> :
        <ActionButton label={sending ? 'A enviar...' : 'Enviar pergunta gratuita'}
          disabled={isDemoMode || sending || !selected || remaining === 0}
          onPress={() => void sendQuestion()}/>}
    </View>

    <View style={styles.historyHeading}>
      <View style={{ gap: 5, flex: 1 }}>
        <Text style={styles.eyebrow}>ACOMPANHA OS PEDIDOS</Text>
        <Text style={styles.historyTitle}>As minhas perguntas</Text>
      </View>
      <Pressable onPress={() => void loadRequests()} accessibilityRole="button"
        accessibilityLabel="Actualizar as perguntas" style={styles.refresh}>
        <Ionicons name="refresh-outline" color={palette.text} size={20}/>
      </Pressable>
    </View>
    {loading ? <ActivityIndicator color={palette.accent}/> : null}
    {error ? <Text style={styles.feedback}>{error}</Text> : null}
    {!session ? <EmptyState icon="lock-closed-outline" title="Área pessoal"
      detail="As tuas perguntas e os respectivos estados ficam disponíveis depois de entrares na conta."/> :
      !loading && requests.length === 0 ? <EmptyState icon="chatbubbles-outline"
        title="Ainda não enviaste perguntas"
        detail="Quando enviares uma pergunta, aparecerá nesta lista."/> : null}
    {session ? requests.map(request => <View key={request.id} style={styles.requestCard}>
      <View style={styles.requestTop}>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{statuses[request.status]}</Text>
        </View>
        <Text style={styles.muted}>{new Date(request.created_at).toLocaleDateString('pt-PT')}</Text>
      </View>
      <Text style={styles.requestBody}>{request.body}</Text>
      <Text style={styles.requestFooter}>Pedido recebido pela equipa · Sem prazo de resposta garantido</Text>
    </View>) : null}
    <View style={styles.vip}>
      <Ionicons name="diamond-outline" size={26} color={palette.violet}/>
      <View style={{ flex: 1, gap: 7 }}>
        <Text style={styles.cardTitle}>Experiências VIP</Text>
        <Text style={styles.description}>As experiências pagas de áudio e vídeo têm agora um ecrã de apresentação e estrutura de reservas, mas não estão abertas para pagamento ou realização de chamadas.</Text>
        <Text style={styles.vipTag}>EM DESENVOLVIMENTO</Text>
      </View>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  callExperience: { flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#272018', borderWidth: 1, borderColor: '#675039',
    borderRadius: 24, padding: 18 },
  callIcon: { borderRadius: 16, backgroundColor: '#40311E', padding: 12 },
  callEyebrow: { color: palette.accent, fontSize: 9, letterSpacing: 1.5, fontWeight: '900' },
  callTitle: { color: palette.text, fontSize: 19, fontWeight: '900', lineHeight: 24 },
  callText: { color: palette.muted, fontSize: 12, lineHeight: 19 },
  callStatus: { color: palette.accent, fontSize: 10, letterSpacing: 1, fontWeight: '800', marginTop: 4 },
  intro: { gap: 9 },
  title: { color: palette.text, fontSize: 33, fontWeight: '900', letterSpacing: -1 },
  description: { color: palette.muted, fontSize: 13, lineHeight: 21 },
  questionCard: { backgroundColor: palette.surface, borderColor: palette.line,
    borderWidth: 1, borderRadius: 24, padding: 19, gap: 15 },
  cardTop: { flexDirection: 'row', gap: 13, alignItems: 'center' },
  icon: { width: 51, height: 51, borderRadius: 16, backgroundColor: '#3C3023',
    alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: palette.text, fontSize: 18, fontWeight: '900' },
  quota: { color: palette.accent, fontSize: 12, fontWeight: '800' },
  notice: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12,
    borderRadius: 14, backgroundColor: palette.surfaceRaised },
  noticeText: { color: palette.text, flex: 1, fontSize: 12, lineHeight: 19 },
  input: { minHeight: 145, backgroundColor: palette.background, color: palette.text,
    borderColor: palette.line, borderWidth: 1, borderRadius: 15,
    paddingHorizontal: 14, paddingTop: 15, fontSize: 14 },
  counter: { alignItems: 'flex-end', marginTop: -8 },
  muted: { color: palette.muted, fontSize: 11 },
  feedback: { color: palette.warning, fontSize: 12, lineHeight: 19 },
  historyHeading: { flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 13 },
  eyebrow: { color: palette.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  historyTitle: { color: palette.text, fontSize: 24, fontWeight: '900' },
  refresh: { padding: 11, backgroundColor: palette.surface, borderRadius: 22,
    borderWidth: 1, borderColor: palette.line },
  requestCard: { gap: 14, padding: 17, borderRadius: 19, backgroundColor: palette.surface,
    borderWidth: 1, borderColor: palette.line },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: { backgroundColor: '#3A2F1F', paddingVertical: 7,
    paddingHorizontal: 11, borderRadius: 20 },
  statusText: { color: palette.accent, fontSize: 11, fontWeight: '800' },
  requestBody: { color: palette.text, fontSize: 14, lineHeight: 21 },
  requestFooter: { color: palette.muted, fontSize: 11, lineHeight: 18 },
  vip: { flexDirection: 'row', gap: 13, backgroundColor: '#1B1922',
    borderRadius: 22, borderColor: '#353044', borderWidth: 1, padding: 19 },
  vipTag: { color: palette.violet, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});
