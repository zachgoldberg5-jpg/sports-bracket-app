import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function AuthLayout() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
