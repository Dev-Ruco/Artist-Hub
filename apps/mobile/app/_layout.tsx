import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/context/AuthContext';
import { ArtistProvider } from '../src/context/ArtistContext';
import { palette } from '../src/theme/tokens';
export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.background }}>
    <AuthProvider><ArtistProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }} />
    </ArtistProvider></AuthProvider>
  </GestureHandlerRootView>;
}
