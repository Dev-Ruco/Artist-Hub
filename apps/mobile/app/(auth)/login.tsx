import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionButton, Eyebrow, Screen } from '../../src/components/UI';
import { useAuth } from '../../src/context/AuthContext';
import { isDemoMode } from '../../src/lib/supabase';
import { palette } from '../../src/theme/tokens';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function submit() {
    setMessage(null);
    if (!email.includes('@') || password.length < 8) { setMessage('Introduza um email válido e uma palavra-passe com pelo menos 8 caracteres.'); return; }
    setBusy(true);
    const error = mode === 'login' ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setBusy(false);
    if (error) setMessage(error);
    else if (mode === 'register') setMessage('Registo efectuado. Se a confirmação por email estiver activa, confirme o endereço antes de entrar.');
    else router.replace('/(tabs)/profile');
  }
  return <Screen>
    <Pressable style={{ alignSelf: 'flex-start', paddingVertical: 10 }} onPress={() => router.back()} accessibilityLabel="Voltar">
      <Ionicons name="arrow-back" size={25} color={palette.text}/></Pressable>
    <View style={{ paddingTop: 18, gap: 10 }}><Eyebrow>A TUA COMUNIDADE ESTÁ AQUI</Eyebrow>
      <Text style={s.heading}>{mode === 'login' ? 'Bem-vindo de volta.' : 'Faz parte da comunidade.'}</Text>
      <Text style={s.subtitle}>A tua conta na comunidade de Mr. Bow.</Text></View>
    {isDemoMode ? <Text style={{ color: palette.warning, lineHeight: 19 }}>O modo de demonstração não permite registar utilizadores. Configure o Supabase para activar a autenticação.</Text> : null}
    <View style={{ gap: 13, marginTop: 20 }}>
      <TextInput accessibilityLabel="Email" keyboardType="email-address" autoCapitalize="none" autoComplete="email"
        placeholder="Endereço de email" placeholderTextColor={palette.muted} value={email} onChangeText={setEmail} style={s.input}/>
      <TextInput accessibilityLabel="Palavra-passe" secureTextEntry autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        placeholder="Palavra-passe" placeholderTextColor={palette.muted} value={password} onChangeText={setPassword} style={s.input}/>
      {message ? <Text style={{ color: palette.warning, lineHeight: 20 }}>{message}</Text> : null}
      <ActionButton label={mode === 'login' ? 'Entrar' : 'Criar conta'} disabled={busy || isDemoMode} onPress={() => void submit()} />
      {busy ? <ActivityIndicator color={palette.accent}/> : null}
      <Pressable style={{ padding: 12, alignItems: 'center' }} onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(null); }}>
        <Text style={{ color: palette.accent, fontWeight: '700', fontSize: 13 }}>
          {mode === 'login' ? 'Ainda não tens conta? Regista-te' : 'Já tens conta? Inicia sessão'}</Text></Pressable>
    </View>
  </Screen>;
}
const s = StyleSheet.create({
  heading: { color: palette.text, fontSize: 35, lineHeight: 40, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  input: { borderColor: palette.line, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, height: 54,
    color: palette.text, backgroundColor: palette.surface, fontSize: 14 },
});
