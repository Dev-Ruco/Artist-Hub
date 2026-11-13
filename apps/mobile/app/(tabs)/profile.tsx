import React from 'react';
import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionButton, DemoFlag, Eyebrow, Heading, Screen } from '../../src/components/UI';
import { useAuth } from '../../src/context/AuthContext';
import { useArtist } from '../../src/context/ArtistContext';
import { palette } from '../../src/theme/tokens';

export default function ProfileScreen() {
  const { session, signOut, loading } = useAuth();
  const { selected } = useArtist();
  return <Screen>
    <Eyebrow>A TUA IDENTIDADE</Eyebrow>
    <Heading subtitle="Gere o teu acesso e as comunidades que segues.">O meu perfil</Heading>
    <DemoFlag />
    <View style={{ backgroundColor: palette.surface, padding: 22, borderColor: palette.line, borderWidth: 1, borderRadius: 24, gap: 14, alignItems: 'center' }}>
      <View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: '#303D28', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="person-outline" color={palette.accent} size={37}/>
      </View>
      <Text style={{ color: palette.text, fontSize: 19, fontWeight: '800' }}>{session?.user.email || 'Visitante'}</Text>
      <Text style={{ color: palette.muted, fontSize: 12, textAlign: 'center' }}>
        {session ? 'Sessão iniciada com segurança' : 'Entra na tua conta para aderir e enviar perguntas.'}</Text>
      <View style={{ height: 1, backgroundColor: palette.line, width: '100%' }}/>
      <Text style={{ color: palette.muted, fontSize: 12 }}>Artista seleccionado: <Text style={{ color: palette.text }}>{selected?.display_name || 'Nenhum'}</Text></Text>
    </View>
    {session ? <ActionButton label="Terminar sessão" variant="secondary" onPress={() => {
      Alert.alert('Terminar sessão', 'Pretendes sair da tua conta?', [
        { text: 'Cancelar', style: 'cancel' }, { text: 'Sair', onPress: () => void signOut() },
      ]);
    }}/> : <ActionButton label="Entrar ou criar conta" disabled={loading} onPress={() => router.push('/(auth)/login')} />}
    <View style={{ padding: 16, gap: 5 }}>
      <Text style={{ color: palette.text, fontSize: 13, fontWeight: '800' }}>Privacidade e segurança</Text>
      <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 20 }}>Esta é uma versão piloto. Não estão activos pagamentos, mensagens VIP nem conversas privadas. Os dados de demonstração são fictícios.</Text>
    </View>
  </Screen>;
}
