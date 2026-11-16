import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActionButton, DemoFlag, Eyebrow, Heading, Screen } from '../../src/components/UI';
import { useAuth } from '../../src/context/AuthContext';
import { useArtist } from '../../src/context/ArtistContext';
import { db, isDemoMode, supabase } from '../../src/lib/supabase';
import { apiConfigurada, pedirApi } from '../../src/lib/api';
import { palette } from '../../src/theme/tokens';
import { BackendConnectionCard } from '../../src/components/BackendConnectionCard';

type Membership = { level: string; joined_at: string };
const membershipTitle = (level: string) => {
  if (level === 'vip') return 'Membro VIP';
  if (level === 'promax') return 'Membro Pro Max';
  return 'Fã da comunidade';
};

export default function ProfileScreen() {
  const { session, signOut, actualizarNome, loading: authLoading } = useAuth();
  const { selected } = useArtist();
  const userId = session?.user.id;
  const artistId = selected?.id;
  const [fullName, setFullName] = useState('');
  const [membership, setMembership] = useState<Membership | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const metadataName = session?.user.user_metadata?.full_name;
    setFullName(typeof metadataName === 'string' ? metadataName : '');
    setMembership(null);
    setQuestionCount(null);
    setMessage('');
    if (!userId || isDemoMode) { setLoading(false); return; }

    setLoading(true);
    async function loadProfile() {
      try {
        if (apiConfigurada) {
          const dados = await pedirApi<{ nome?: string }>('/perfil', {
            token: session?.access_token,
          });
          if (!active) return;
          if (dados.nome) setFullName(dados.nome);
          if (artistId) {
            const [adesao, perguntas] = await Promise.all([
              pedirApi<{ aderiu: boolean; adesao?: { nivel: string; dataAdesao: string } }>(
                '/comunidade/adesao', { token: session?.access_token }),
              pedirApi<Array<{ identificador: string }>>(
                '/perguntas', { token: session?.access_token }),
            ]);
            if (active) {
              setMembership(adesao.aderiu && adesao.adesao
                ? { level: adesao.adesao.nivel, joined_at: adesao.adesao.dataAdesao }
                : null);
              setQuestionCount(perguntas.length);
            }
          }
          return;
        }
        const profileResult = await db().from('profiles')
          .select('display_name').eq('user_id', userId!).maybeSingle();
        if (profileResult.error) throw profileResult.error;
        if (!active) return;
        if (profileResult.data?.display_name) setFullName(profileResult.data.display_name);

        if (artistId) {
          const [membershipResult, questionsResult] = await Promise.all([
            db().from('artist_memberships').select('level,joined_at')
              .eq('artist_id', artistId).eq('user_id', userId!).maybeSingle(),
            db().from('message_requests').select('id', { count: 'exact', head: true })
              .eq('artist_id', artistId).eq('fan_id', userId!),
          ]);
          if (membershipResult.error) throw membershipResult.error;
          if (questionsResult.error) throw questionsResult.error;
          if (active) {
            setMembership((membershipResult.data as Membership | null) ?? null);
            setQuestionCount(questionsResult.count ?? 0);
          }
        }
      } catch {
        if (active) setMessage('Não foi possível actualizar os dados do teu perfil.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProfile();
    return () => { active = false; };
  }, [userId, artistId, session?.user.user_metadata?.full_name, session?.access_token]);

  async function save() {
    if (!userId || (!supabase && !apiConfigurada) || saving) return;
    const name = fullName.trim().replace(/\s+/g, ' ');
    if (name.length < 2 || name.length > 80) {
      setMessage('O nome deve ter entre 2 e 80 caracteres.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      if (apiConfigurada) {
        await pedirApi('/perfil', {
          metodo: 'PATCH', token: session?.access_token, corpo: { nome },
        });
        await actualizarNome(name);
        setMessage('Perfil actualizado com sucesso.');
        return;
      }
      const { error } = await db().from('profiles')
        .upsert({ user_id: userId, display_name: name }, { onConflict: 'user_id' });
      if (error) throw error;
      // Mantém a saudação do hero sincronizada com o perfil do fã.
      const { error: authError } = await supabase.auth.updateUser({ data: { full_name: name } });
      setMessage(authError
        ? 'Nome guardado no perfil. A saudação será actualizada no próximo acesso.'
        : 'Perfil actualizado com sucesso.');
    } catch {
      setMessage('Não foi possível guardar o nome. Tenta novamente.');
    } finally {
      setSaving(false);
    }
  }

  function requestSignOut() {
    Alert.alert('Terminar sessão', 'Queres sair da tua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', onPress: () => void signOut() },
    ]);
  }

  if (!session) return <Screen>
    <Eyebrow>A TUA IDENTIDADE</Eyebrow>
    <Heading subtitle="O teu espaço na comunidade de Mr. Bow.">O meu perfil</Heading>
    <DemoFlag />
    <View style={styles.guestPanel}>
      <View style={styles.avatar}><Ionicons name="person-outline" color={palette.accent} size={36}/></View>
      <Text style={styles.guestTitle}>Faz parte da comunidade.</Text>
      <Text style={styles.description}>Cria uma conta para aderires, guardares o teu nome e acompanhares as perguntas enviadas à equipa de Mr. Bow.</Text>
      <ActionButton disabled={authLoading || isDemoMode}
        label="Entrar ou criar conta" onPress={() => router.push('/(auth)/login')}/>
    </View>
    <Text style={styles.note}>As publicações públicas continuam disponíveis sem registo.</Text>
    <BackendConnectionCard/>
  </Screen>;

  return <Screen>
    <Eyebrow>A TUA IDENTIDADE</Eyebrow>
    <Heading subtitle="Gere os teus dados e acompanha a tua participação.">O meu perfil</Heading>
    <View style={styles.identityCard}>
      <View style={styles.avatar}><Ionicons name="person-outline" color={palette.accent} size={35}/></View>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={styles.email} numberOfLines={2}>{session.user.email || 'Conta de fã'}</Text>
        <Text style={styles.description}>Conta pessoal · Comunidade Mr. Bow</Text>
      </View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Os meus dados</Text>
      <Text style={styles.label}>Nome a apresentar</Text>
      <TextInput accessibilityLabel="Nome do fã" autoCapitalize="words"
        autoComplete="name" value={fullName} onChangeText={setFullName}
        placeholder="Nome e apelido" placeholderTextColor={palette.muted}
        maxLength={80} style={styles.input}/>
      {message ? <Text accessibilityRole="alert" style={styles.info}>{message}</Text> : null}
      <ActionButton label={saving ? 'A guardar...' : 'Guardar alterações'}
        disabled={saving || loading} onPress={() => void save()}/>
    </View>

    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>A minha comunidade</Text>
        {loading ? <ActivityIndicator color={palette.accent} size="small"/> : null}
      </View>
      <View style={styles.infoRow}>
        <Ionicons name={membership ? 'checkmark-circle' : 'people-outline'} size={23}
          color={palette.accent}/>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.rowTitle}>{membership
            ? membershipTitle(membership.level) : 'Ainda não aderiste'}</Text>
          <Text style={styles.description}>{membership
            ? 'Adesão registada à comunidade de Mr. Bow.'
            : 'Entra na comunidade e acompanha as publicações oficiais.'}</Text>
        </View>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="chatbubbles-outline" size={23} color={palette.accent}/>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.rowTitle}>{questionCount === null ? 'As minhas perguntas'
            : questionCount + (questionCount === 1 ? ' pergunta enviada' : ' perguntas enviadas')}</Text>
          <Text style={styles.description}>Consulta o estado dos teus pedidos à equipa.</Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/artist')}
        style={styles.linkRow}>
        <Text style={styles.linkText}>Consultar as minhas perguntas</Text>
        <Ionicons name="arrow-forward" size={18} color={palette.accent}/>
      </Pressable>
      {!membership ? <ActionButton label="Ver a comunidade" variant="secondary"
        onPress={() => router.push('/(tabs)/community')}/> : null}
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Segurança</Text>
      <Text style={styles.description}>Os teus dados e pedidos são pessoais. Não são disponibilizados publicamente na comunidade.</Text>
      <ActionButton variant="secondary" label="Terminar sessão" onPress={requestSignOut}/>
    </View>
    <Text style={styles.note}>O chat privado, as compras e os serviços VIP ainda não estão activos.</Text>
    <BackendConnectionCard/>
  </Screen>;
}

const styles = StyleSheet.create({
  guestPanel: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line,
    padding: 22, borderRadius: 24, gap: 16, alignItems: 'center' },
  avatar: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#3A3227',
    alignItems: 'center', justifyContent: 'center' },
  guestTitle: { color: palette.text, fontWeight: '900', fontSize: 20 },
  description: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  note: { textAlign: 'center', color: palette.muted, fontSize: 11, lineHeight: 18 },
  identityCard: { backgroundColor: palette.surfaceRaised, borderRadius: 23,
    flexDirection: 'row', alignItems: 'center', gap: 17, padding: 19 },
  email: { color: palette.text, fontSize: 16, fontWeight: '800' },
  section: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface,
    borderRadius: 24, padding: 18, gap: 15 },
  sectionTitle: { color: palette.text, fontWeight: '900', fontSize: 18 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  input: { height: 53, paddingHorizontal: 14, color: palette.text, backgroundColor: palette.background,
    borderWidth: 1, borderColor: palette.line, borderRadius: 14, fontSize: 15 },
  info: { color: palette.accent, fontSize: 12, lineHeight: 19 },
  infoRow: { flexDirection: 'row', gap: 13, alignItems: 'center' },
  rowTitle: { color: palette.text, fontSize: 14, fontWeight: '800' },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderTopWidth: 1, borderColor: palette.line },
  linkText: { color: palette.accent, fontSize: 13, fontWeight: '800' },
});
