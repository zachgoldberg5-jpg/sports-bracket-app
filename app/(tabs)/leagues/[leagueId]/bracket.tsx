import React from 'react';
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLeague } from '../../../../hooks/useLeague';
import { BracketViewer } from '../../../../components/bracket/BracketViewer';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { COLORS } from '../../../../constants/theme';
import type { LeagueId } from '../../../../types';

export default function FullBracketScreen() {
  const { leagueId } = useLocalSearchParams<{ leagueId: string }>();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const { league, bracket, loadingBracket } = useLeague(leagueId as LeagueId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: `${league?.name ?? ''} Bracket`,
          presentation: 'fullScreenModal',
        }}
      />
      {loadingBracket ? (
        <ActivityIndicator style={styles.loading} color={league?.primaryColor ?? COLORS.primary} size="large" />
      ) : bracket ? (
        <BracketViewer bracket={bracket} primaryColor={league?.primaryColor} />
      ) : (
        <EmptyState icon="📊" title="Bracket not available yet" />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1 },
});
