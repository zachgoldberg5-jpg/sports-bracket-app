import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { setupNotificationListeners } from '../lib/notifications';
import { COLORS } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    initialize().then(() => {
      SplashScreen.hideAsync();
    });

    // Set up notification listeners at root level (no-op handlers, child hooks handle routing)
    const cleanup = setupNotificationListeners(undefined, undefined);
    return cleanup;
  }, []);

  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }} />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="modal/invite"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Share Invite',
            }}
          />
          <Stack.Screen
            name="privacy-policy"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Privacy Policy',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
