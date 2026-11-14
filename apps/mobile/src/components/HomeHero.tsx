import React, { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Artist } from '../types/domain';

// Esta imagem é incluída no bundle React Native (Android, iOS e Web).
// A origem original mantém-se intacta em assets/artists/mr-bow/.
const MR_BOW_HERO = require('../../assets/artists/mr-bow/hero.jpeg');

type Props = {
  artist: Artist;
  greeting: string;
  onUpdates: () => void;
  onCommunity: () => void;
};

const condensedFont = Platform.select({
  ios: 'HelveticaNeue-CondensedBold',
  android: 'sans-serif-condensed',
  default: 'Impact, "Arial Narrow", sans-serif',
});

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

export function HomeHero({ artist, greeting, onUpdates, onCommunity }: Props) {
  const { width, height } = useWindowDimensions();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const mobile = width < 750;
  const narrow = width < 375;
  const heroHeight = mobile
    ? Math.min(820, Math.max(670, Math.round(height * 0.96)))
    : 730;
  const typeSize = mobile ? (narrow ? 63 : 80) : 110;
  const photoHeight = mobile ? Math.round(heroHeight * 0.82) : heroHeight;

  const isMrBow = artist.slug.trim().toLowerCase() === 'mr-bow';
  const remote = artist.banner_url?.trim();
  const useRemote = !isMrBow && Boolean(remote) && failedUri !== remote;
  const imageSource = isMrBow ? MR_BOW_HERO : useRemote ? { uri: remote! } : null;
  const hasPhoto = imageSource !== null;

  const words = artist.display_name.toUpperCase().trim().split(/\s+/);
  const title = words.length <= 3 ? words.join('\n') : artist.display_name.toUpperCase();

  return (
    <View style={[styles.hero, {
      height: heroHeight,
      paddingHorizontal: mobile ? (narrow ? 20 : 26) : 54,
      paddingTop: mobile ? 23 : 34,
      paddingBottom: mobile ? 31 : 42,
    }]}>
      {/* Primeiro plano da fotografia: ocupa a maior parte do ecrã móvel,
          sem depender de um URL externo nem de estilos Web específicos. */}
      <View pointerEvents="none" style={[
        styles.photoArea,
        mobile
          ? { left: 0, right: 0, top: 0, height: photoHeight }
          : { right: 0, top: 0, width: '72%', height: '100%' },
      ]}>
        {hasPhoto ? (
          <Image
            key={artist.id + (isMrBow ? '-local' : '-remote')}
            source={imageSource}
            accessibilityLabel={'Fotografia de ' + artist.display_name}
            resizeMode="cover"
            onError={() => { if (useRemote && remote) setFailedUri(remote); }}
            style={styles.photo}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.monogram}>{initials(artist.display_name)}</Text>
          </View>
        )}
      </View>

      {/* No telemóvel, o rosto fica visível na metade superior.
          O gradiente escurece apenas a parte inferior, por detrás do texto. */}
      <LinearGradient
        pointerEvents="none"
        colors={mobile
          ? ['rgba(8,8,10,0.24)', 'rgba(8,8,10,0.02)', 'rgba(8,8,10,0.06)',
              'rgba(8,8,10,0.58)', '#09090B', '#09090B']
          : ['rgba(8,8,10,0.58)', 'rgba(8,8,10,0.18)', 'rgba(8,8,10,0.30)', '#09090B']}
        locations={mobile ? [0, 0.19, 0.44, 0.68, 0.87, 1] : [0, 0.28, 0.66, 1]}
        style={StyleSheet.absoluteFill}
      />
      {!mobile ? (
        <LinearGradient
          pointerEvents="none"
          colors={['#09090B', 'rgba(9,9,11,0.90)', 'rgba(9,9,11,0.00)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { fontSize: mobile ? 23 : 28 }]}>{greeting}</Text>
            <Text style={styles.subtitle}>Novidades e momentos perto de ti.</Text>
          </View>
          <View accessibilityLabel="Artist Hub" style={styles.brand}>
            <Ionicons name="musical-notes-outline" size={22} color="#FFFFFF"/>
          </View>
        </View>

        <View style={[styles.body, { maxWidth: mobile ? '100%' : 600 }]}>
          <View style={[styles.pill, { backgroundColor: artist.accent_color }]}>
            <Text style={styles.pillText}>ESPAÇO OFICIAL DO ARTISTA</Text>
          </View>
          <Text
            adjustsFontSizeToFit
            numberOfLines={4}
            style={[styles.name, {
              fontFamily: condensedFont,
              fontSize: typeSize,
              lineHeight: typeSize * 0.94,
              maxWidth: mobile ? '100%' : 570,
            }]}
          >
            {title}
          </Text>
          <Text style={[styles.tagline, { fontSize: mobile ? 14 : 17 }]}>
            {artist.tagline || 'A tua música, a tua comunidade e os teus momentos.'}
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onUpdates}
              accessibilityRole="button"
              accessibilityLabel="Ver as novidades"
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: artist.accent_color },
                pressed && styles.pressed,
              ]}>
              <Text style={styles.primaryText}>Novidades</Text>
              <Ionicons name="arrow-forward" size={19} color="#18110B"/>
            </Pressable>
            <Pressable
              onPress={onCommunity}
              accessibilityRole="button"
              accessibilityLabel="Entrar na comunidade"
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
              <Ionicons name="people-outline" size={19} color="#FFFFFF"/>
              <Text style={styles.secondaryText}>Comunidade</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    backgroundColor: '#09090B',
    overflow: 'hidden',
    position: 'relative',
  },
  photoArea: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#4C392D',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3F3329',
  },
  monogram: {
    fontSize: 220,
    fontWeight: '900',
    letterSpacing: -16,
    color: 'rgba(255,255,255,0.13)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 5,
  },
  greeting: {
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.36)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
    textShadowColor: 'rgba(0,0,0,0.46)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  brand: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: 'rgba(8,8,10,0.50)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 13,
    alignItems: 'flex-start',
  },
  pill: {
    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  pillText: {
    color: '#221508',
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '900',
  },
  name: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: -1.7,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 3 },
  },
  tagline: {
    color: '#EDE6DF',
    lineHeight: 22,
    maxWidth: 360,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    width: '100%',
  },
  primaryButton: {
    flex: 1.1,
    minHeight: 56,
    borderRadius: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  primaryText: {
    fontSize: 15,
    color: '#18110B',
    fontWeight: '900',
  },
  secondaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 29,
    borderWidth: 1.4,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(11,11,13,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
  },
  secondaryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: { opacity: 0.74 },
});
