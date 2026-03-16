import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { View } from 'react-native';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const isGuest = useAuthStore((s) => s.isGuest);
  const initialized = useAuthStore((s) => s.initialized);

  if (!initialized) {
    return <View style={{ flex: 1 }} />;
  }

  if (session || isGuest) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
