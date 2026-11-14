import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Artist } from '../types/domain';

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
  return name.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase();
}
export function HomeHero({ artist, greeting, onUpdates, onCommunity }: Props) {
  const { width, height } = useWindowDimensions();
  const compact = width < 375;
  const desktop = width >= 750;
  const typeSize = desktop ? 112 : compact ? 62 : 78;
  const sectionHeight = desktop ? 735 : Math.min(775, Math.max(655, height - 132));
  const words = artist.display_name.toUpperCase().trim().split(/\s+/);
  const title = words.length <= 3 ? words.join('\n') : artist.display_name.toUpperCase();
  const hasImage = Boolean(artist.banner_url?.trim());
  return <View style={[styles.hero, { height: sectionHeight, paddingHorizontal: desktop ? 52 : compact ? 22 : 27 }]}>
    <LinearGradient colors={['#795130', '#2B1E1A', '#08080B']} start={{x:1,y:0}} end={{x:0.08,y:1}}
      style={StyleSheet.absoluteFill}/>
    {hasImage ? <Image source={{ uri: artist.banner_url! }} style={StyleSheet.absoluteFill}
      resizeMode="cover" accessibilityLabel={'Fotografia de ' + artist.display_name}/> : <>
      <View style={styles.posterRuleA}/>
      <View style={styles.posterRuleB}/>
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={[styles.monogram, {fontSize:desktop ? 390 : 244,right: desktop ? -18 : -40}]}>{initials(artist.display_name)}</Text>
    </>}
    <LinearGradient colors={['rgba(7,7,9,0.5)', 'rgba(7,7,9,0.12)', 'rgba(7,7,9,0.32)', 'rgba(7,7,9,0.97)']}
      locations={[0,0.27,0.57,1]} style={StyleSheet.absoluteFill}/>
    <LinearGradient colors={['rgba(7,7,9,0.50)', 'rgba(7,7,9,0)']}
      start={{x:0,y:0.5}} end={{x:1,y:0.5}} style={StyleSheet.absoluteFill}/>
    <View style={styles.heroContent}>
      <View style={styles.topRow}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={[styles.greeting,{fontSize:desktop ? 27 : 23}]}>{greeting}</Text>
          <Text style={styles.greetingSub}>O teu espaço, mais perto da música.</Text>
        </View>
        <View style={styles.brandBadge} accessibilityLabel="Artist Hub">
          <Ionicons name="musical-notes-outline" size={22} color="#FFFFFF"/>
        </View>
      </View>
      <View style={styles.bottomContent}>
        {!hasImage ? <View style={styles.photoWaiting}>
          <Ionicons name="image-outline" size={14} color="#F0D2AE"/>
          <Text style={styles.photoWaitingText}>FOTOGRAFIA DE CAPA EM PREPARAÇÃO</Text>
        </View> : null}
        <View style={[styles.identityPill,{backgroundColor:artist.accent_color}]}>
          <Text style={styles.identityText}>O UNIVERSO DO ARTISTA</Text>
        </View>
        <Text adjustsFontSizeToFit numberOfLines={4}
          style={[styles.artistName,{fontFamily:condensedFont,fontSize:typeSize,lineHeight:typeSize*0.96,
            maxWidth:desktop ? 620 : '100%'}]}>{title}</Text>
        <Text style={[styles.tagline,{maxWidth:desktop ? 530 : 345}]}>
          {artist.tagline || 'Música, momentos e novidades. Tudo mais perto de ti.'}
        </Text>
        <View style={[styles.actionRow,{marginTop:compact ? 17 : 27}]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Ver as últimas novidades"
            onPress={onUpdates} style={({pressed}) => [styles.mainAction,
              {backgroundColor:artist.accent_color},pressed && styles.pressed]}>
            <Text style={styles.mainActionText}>Novidades</Text>
            <Ionicons name="arrow-forward" size={20} color="#18110B"/>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Abrir comunidade"
            onPress={onCommunity} style={({pressed}) => [styles.secondaryAction,pressed && styles.pressed]}>
            <Ionicons name="people-outline" size={19} color="#FFFFFF"/>
            <Text style={styles.secondaryActionText}>Comunidade</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  hero: {width:'100%',position:'relative',overflow:'hidden',backgroundColor:'#15110D',paddingTop:26,paddingBottom:32},
  heroContent: {flex:1,justifyContent:'space-between'},
  topRow: {flexDirection:'row',alignItems:'flex-start',gap:15},
  greeting: {color:'#FFFFFF',fontWeight:'800',letterSpacing:-0.55},
  greetingSub: {color:'#E2DDD5',fontSize:13,lineHeight:19},
  brandBadge: {width:43,height:43,borderRadius:22,alignItems:'center',justifyContent:'center',
    backgroundColor:'rgba(8,8,10,0.48)',borderWidth:1,borderColor:'rgba(255,255,255,0.18)'},
  bottomContent: {gap:14,alignItems:'flex-start'},
  identityPill: {borderRadius:100,paddingHorizontal:17,paddingVertical:11},
  identityText: {color:'#211408',fontSize:11,fontWeight:'900',letterSpacing:1},
  artistName: {color:'#FFFFFF',fontWeight:'900',letterSpacing:-1.9,
    textShadowColor:'rgba(0,0,0,0.32)',textShadowRadius:12,textShadowOffset:{width:0,height:4}},
  tagline: {color:'#E3D8CE',fontSize:16,lineHeight:24,marginTop:2},
  actionRow: {width:'100%',flexDirection:'row',alignItems:'stretch',gap:10},
  mainAction: {flex:1.15,height:58,borderRadius:30,flexDirection:'row',alignItems:'center',
    justifyContent:'center',paddingHorizontal:12,gap:9},
  mainActionText: {color:'#18110B',fontSize:15,fontWeight:'900'},
  secondaryAction: {flex:1,height:58,borderRadius:30,flexDirection:'row',alignItems:'center',
    justifyContent:'center',paddingHorizontal:10,gap:7,borderWidth:1.4,
    borderColor:'rgba(255,255,255,0.83)',backgroundColor:'rgba(10,10,11,0.33)'},
  secondaryActionText: {color:'#FFFFFF',fontSize:13,fontWeight:'800'},
  pressed: {opacity:0.72},
  posterRuleA: {position:'absolute',width:430,height:110,backgroundColor:'rgba(249,174,72,0.10)',
    transform:[{rotate:'-24deg'}],top:120,right:-165},
  posterRuleB: {position:'absolute',width:430,height:120,backgroundColor:'rgba(255,255,255,0.045)',
    transform:[{rotate:'-24deg'}],top:330,right:-100},
  monogram: {position:'absolute',top:200,color:'rgba(255,234,207,0.11)',fontWeight:'900',
    letterSpacing:-26,transform:[{rotate:'-14deg'}]},
  photoWaiting: {flexDirection:'row',gap:6,alignItems:'center',marginBottom:3},
  photoWaitingText: {fontSize:9,letterSpacing:1.3,fontWeight:'800',color:'#F0D2AE'},
});
