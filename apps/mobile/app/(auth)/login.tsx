import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionButton, DemoFlag, Eyebrow, Screen } from '../../src/components/UI';
import { useAuth } from '../../src/context/AuthContext';
import { isDemoMode } from '../../src/lib/supabase';
import { palette } from '../../src/theme/tokens';

type Mode = 'login' | 'register' | 'recover';
const emailLooksValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function LoginScreen() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setMessage('');
    setSuccess(false);
    setPassword('');
    setShowPassword(false);
  }

  async function submit() {
    if (busy || isDemoMode) return;
    setMessage('');
    setSuccess(false);
    const cleanedEmail = email.trim().toLowerCase();
    if (!emailLooksValid(cleanedEmail)) {
      setMessage('Introduz um endereço de email válido.');
      return;
    }
    if (mode === 'register' && (fullName.trim().length < 2 || fullName.trim().length > 80)) {
      setMessage('Indica o teu nome, entre 2 e 80 caracteres.');
      return;
    }
    if (mode !== 'recover' && password.length < 8) {
      setMessage('A palavra-passe tem de ter pelo menos 8 caracteres.');
      return;
    }

    setBusy(true);
    try {
      const error = mode === 'recover'
        ? await resetPassword(cleanedEmail)
        : mode === 'register'
          ? await signUp(cleanedEmail, password, fullName.trim())
          : await signIn(cleanedEmail, password);
      if (error) {
        setMessage(error);
      } else if (mode === 'recover') {
        setSuccess(true);
        setMessage('Se o endereço estiver registado, receberás instruções por email. Verifica também o spam.');
      } else if (mode === 'register') {
        setSuccess(true);
        setMessage('Pedido de registo recebido. Verifica o email para confirmar a conta, caso seja necessário.');
      } else {
        router.replace('/(tabs)/profile');
      }
    } catch {
      setMessage('Não foi possível comunicar com o serviço. Confirma a ligação e tenta novamente.');
    } finally {
      setBusy(false);
    }
  }

  const heading = mode === 'register' ? 'Entra na família.' :
    mode === 'recover' ? 'Recupera o acesso.' : 'Bem-vindo de volta.';
  const description = mode === 'register'
    ? 'Cria a tua conta para participares na comunidade de Mr. Bow.'
    : mode === 'recover'
      ? 'Enviaremos as instruções de recuperação para o teu email.'
      : 'As novidades, a comunidade e os teus pedidos num só lugar.';

  return <Screen>
    <Pressable onPress={() => router.back()} accessibilityRole="button"
      accessibilityLabel="Voltar" style={styles.back}>
      <Ionicons name="arrow-back" size={24} color={palette.text}/>
    </Pressable>
    <View style={styles.intro}>
      <Eyebrow>MR. BOW · COMUNIDADE</Eyebrow>
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
    <DemoFlag />
    <View style={styles.panel}>
      {mode === 'register' ? <>
        <Text style={styles.label}>Como te chamas?</Text>
        <TextInput
          value={fullName} onChangeText={setFullName}
          placeholder="Nome e apelido" placeholderTextColor={palette.muted}
          accessibilityLabel="Nome e apelido" autoComplete="name"
          autoCapitalize="words" maxLength={80} style={styles.input}
        />
      </> : null}
      <Text style={styles.label}>Email</Text>
      <TextInput
        value={email} onChangeText={setEmail}
        placeholder="nome@exemplo.com" placeholderTextColor={palette.muted}
        accessibilityLabel="Endereço de email" keyboardType="email-address"
        autoCapitalize="none" autoComplete="email" autoCorrect={false}
        style={styles.input}
      />
      {mode !== 'recover' ? <>
        <Text style={styles.label}>Palavra-passe</Text>
        <View style={styles.passwordRow}>
          <TextInput
            value={password} onChangeText={setPassword}
            placeholder="Pelo menos 8 caracteres"
            placeholderTextColor={palette.muted}
            accessibilityLabel="Palavra-passe"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
          />
          <Pressable accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
            onPress={() => setShowPassword(current => !current)}
            style={styles.eye}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22} color={palette.muted}/>
          </Pressable>
        </View>
      </> : null}

      {message ? <Text accessibilityRole="alert" style={[styles.feedback,
        { color: success ? palette.accent : palette.warning }]}>{message}</Text> : null}
      <ActionButton disabled={busy || isDemoMode}
        label={busy ? 'A processar...' : mode === 'recover' ? 'Enviar instruções'
          : mode === 'register' ? 'Criar conta' : 'Entrar'}
        onPress={() => void submit()}/>
      {busy ? <ActivityIndicator color={palette.accent}/> : null}
      {mode === 'login' ? <Pressable onPress={() => switchMode('recover')} style={styles.textButton}>
        <Text style={styles.secondaryLink}>Esqueceste-te da palavra-passe?</Text>
      </Pressable> : null}
    </View>
    {mode !== 'login' ? <Pressable onPress={() => switchMode('login')} style={styles.footerLink}>
      <Text style={styles.linkText}>Já tens conta? Inicia sessão</Text>
    </Pressable> : <Pressable onPress={() => switchMode('register')} style={styles.footerLink}>
      <Text style={styles.linkText}>Ainda não tens conta? Regista-te</Text>
    </Pressable>}
    <Text style={styles.note}>O registo e a recuperação só funcionam com a autenticação Supabase configurada.</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', paddingVertical: 9, paddingRight: 12 },
  intro: { gap: 11, marginTop: 11 },
  heading: { color: palette.text, fontSize: 36, lineHeight: 42, fontWeight: '900', letterSpacing: -1.1 },
  description: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  panel: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line,
    borderRadius: 25, padding: 19, gap: 12 },
  label: { color: palette.text, fontSize: 12, fontWeight: '800' },
  input: { borderRadius: 13, height: 53, borderWidth: 1, borderColor: palette.line,
    backgroundColor: palette.background, color: palette.text, paddingHorizontal: 14, fontSize: 15 },
  passwordRow: { borderRadius: 13, borderWidth: 1, borderColor: palette.line,
    backgroundColor: palette.background, height: 53, flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, height: '100%', color: palette.text, paddingHorizontal: 14, fontSize: 15 },
  eye: { paddingHorizontal: 13, paddingVertical: 12 },
  feedback: { fontSize: 13, lineHeight: 20 },
  textButton: { alignSelf: 'center', paddingVertical: 9 },
  secondaryLink: { fontSize: 12, color: palette.muted, fontWeight: '700' },
  footerLink: { paddingVertical: 10, alignItems: 'center' },
  linkText: { color: palette.accent, fontWeight: '800', fontSize: 14 },
  note: { textAlign: 'center', fontSize: 11, color: palette.muted, lineHeight: 18 },
});
