import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { InviteCodeCard } from '../../components/groups/InviteCodeCard';
import { COLORS, SPACING } from '../../constants/theme';

export default function InviteModal() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const { code, name } = useLocalSearchParams<{ code: string; name: string }>();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Invite Friends' }} />
      <View style={styles.content}>
        <InviteCodeCard code={code ?? ''} groupName={name ?? 'Your Group'} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: SPACING.xl },
});
