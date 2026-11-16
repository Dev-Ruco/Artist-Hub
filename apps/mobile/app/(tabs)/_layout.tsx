import React from 'react';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../src/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
function TabIcon({ name, focused, color }: { name: IconName; focused: boolean; color: ColorValue }) {
  return <Ionicons name={name} size={focused ? 23 : 21} color={typeof color === 'string' ? color : palette.muted} />;
}
export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: palette.accent,
    tabBarInactiveTintColor: palette.muted, tabBarStyle: { backgroundColor: '#10141D', borderTopColor: palette.line,
      height: 68, paddingTop: 8, paddingBottom: 11 }, tabBarLabelStyle: { fontSize: 10, fontWeight: '700' } }}>
    <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} /> }} />
    <Tabs.Screen name="community" options={{ title: 'Comunidade', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} color={color} /> }} />
    <Tabs.Screen name="artist" options={{ title: 'Falar', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'mic' : 'mic-outline'} focused={focused} color={color} /> }} />
    <Tabs.Screen name="events" options={{ title: 'Eventos', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} color={color} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={color} /> }} />
  </Tabs>;
}
