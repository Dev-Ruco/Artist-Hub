import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionButton, DemoFlag, Eyebrow, Heading, Screen } from '../../src/components/UI';
import { useArtist } from '../../src/context/ArtistContext';
import { useAuth } from '../../src/context/AuthContext';
import { db, isDemoMode } from '../../src/lib/supabase';
import { palette } from '../../src/theme/tokens';

export default function ArtistScreen() {
  const { selected } = useArtist();
  const { session } = useAuth();
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  async function sendQuestion() {
    const message = question.trim();
    if (message.length < 10 || message.length > 1000) {
      Alert.alert('Pergunta inválida', 'Escreva entre 10 e 1000 caracteres.'); return;
    }
    if (isDemoMode) { Alert.alert('Demonstração', 'O envio só está disponível com a base de dados configurada.'); return; }
    if (!session) { router.push('/(auth)/login'); return; }
    if (!selected) return;
    setSending(true);
    const { error } = await db().from('message_requests').insert({ artist_id: selected.id, fan_id: session.user.id, body: message });
    setSending(false);
    if (error) Alert.alert('Erro no envio', error.message);
    else { setQuestion(''); Alert.alert('Pergunta enviada', 'O pedido foi registado. A resposta não é garantida nesta modalidade gratuita.'); }
  }
  return <Screen>
    <Eyebrow>ACESSO AO ARTISTA</Eyebrow>
    <Heading subtitle="Uma ligação mais próxima, com regras claras e respeito pelo tempo do artista.">Fala com o artista</Heading>
    <DemoFlag />
    <View style={s.feature}>
      <View style={s.icon}><Ionicons name="chatbubble-ellipses-outline" color={palette.accent} size={30}/></View>
      <Text style={s.title}>Envia uma pergunta</Text>
      <Text style={s.text}>Podes enviar uma pergunta à equipa de {selected?.display_name || 'um artista'}. A recepção não garante uma resposta pessoal.</Text>
      <TextInput multiline maxLength={1000} value={question} onChangeText={setQuestion}
        placeholder="Escreve aqui a tua pergunta..." placeholderTextColor={palette.muted}
        style={s.input} textAlignVertical="top" accessibilityLabel="Pergunta para o artista"/>
      <Text style={{ color: palette.muted, alignSelf: 'flex-end', fontSize: 11 }}>{question.length}/1000</Text>
      <ActionButton label={sending ? 'A enviar...' : 'Enviar pergunta gratuita'} disabled={sending || !selected} onPress={() => void sendQuestion()} />
    </View>
    <View style={[s.feature, { backgroundColor: '#1D2030' }]}>
      <Ionicons name="diamond-outline" color={palette.violet} size={27}/>
      <Text style={s.title}>Experiências VIP</Text>
      <Text style={s.text}>Mensagens privadas, áudio exclusivo, lives e sessões com o artista estão previstos para uma fase posterior, sujeitos a condições e preços transparentes.</Text>
      <View style={s.tag}><Text style={{ color: palette.violet, fontSize: 11, fontWeight: '800' }}>EM DESENVOLVIMENTO</Text></View>
    </View>
  </Screen>;
}
const s = StyleSheet.create({
  feature: { backgroundColor: palette.surface, borderRadius: 24, borderColor: palette.line, borderWidth: 1, padding: 20, gap: 14 },
  icon: { backgroundColor: '#293426', padding: 13, alignSelf: 'flex-start', borderRadius: 16 },
  title: { color: palette.text, fontWeight: '800', fontSize: 19 },
  text: { color: palette.muted, fontSize: 13, lineHeight: 21 },
  input: { backgroundColor: palette.background, borderColor: palette.line, borderWidth: 1, color: palette.text,
    borderRadius: 16, minHeight: 125, padding: 15, fontSize: 14 },
  tag: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99, backgroundColor: '#333147', alignSelf: 'flex-start' },
});
