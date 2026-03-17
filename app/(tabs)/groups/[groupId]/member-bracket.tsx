import React, { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroup } from '../../../../hooks/useGroups';
import { useLeague } from '../../../../hooks/useLeague';
import { BracketViewer } from '../../../../components/bracket/BracketViewer';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { COLORS } from '../../../../constants/theme';
import type { LeagueId, PredictionMap, Team, Bracket } from '../../../../types';

function computePredictionBracket(bracket: Bracket, predictions: PredictionMap): Bracket {
  if (Object.keys(predictions).length === 0) return bracket;
  const pickedTeams: Record<string, Team | undefined> = {};
  const computedRounds = bracket.rounds.map((round, roundIdx) => {
    const prevRound = roundIdx > 0 ? bracket.rounds[roundIdx - 1] : null;
    const matches = round.matches.map((match) => {
      let { homeTeam, awayTeam } = match;
      if (prevRound) {
        const homeFeeder = prevRound.matches.find((m) => m.position === match.position * 2);
        const awayFeeder = prevRound.matches.find((m) => m.position === match.position * 2 + 1);
        if (!homeTeam && homeFeeder && pickedTeams[homeFeeder.id]) homeTeam = pickedTeams[homeFeeder.id];
        if (!awayTeam && awayFeeder && pickedTeams[awayFeeder.id]) awayTeam = pickedTeams[awayFeeder.id];
      }
      const updatedMatch = { ...match, homeTeam, awayTeam };
      const pickedId = predictions[match.id];
      if (pickedId) {
        const winner = homeTeam?.id === pickedId ? homeTeam : awayTeam?.id === pickedId ? awayTeam : undefined;
        if (winner) pickedTeams[match.id] = winner;
      }
      return updatedMatch;
    });
    return { ...round, matches };
  });
  return { ...bracket, rounds: computedRounds };
}

export default function MemberBracketScreen() {
  const { groupId, memberId, displayName, predictionsJson } = useLocalSearchParams<{
    groupId: string;
    memberId: string;
    displayName: string;
    predictionsJson: string;
  }>();

  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const { group } = useGroup(groupId);
  const { bracket, loadingBracket, league } = useLeague((group?.leagueId ?? 'ncaa_mm') as LeagueId);

  const predictions: PredictionMap = useMemo(() => {
    try {
      return predictionsJson ? JSON.parse(predictionsJson) : {};
    } catch {
      return {};
    }
  }, [predictionsJson]);

  const displayBracket = useMemo(
    () => bracket ? computePredictionBracket(bracket, predictions) : null,
    [bracket, predictions]
  );

  const title = displayName ? `${displayName}'s Bracket` : "Member's Bracket";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen options={{ title }} />
      {loadingBracket ? (
        <ActivityIndicator style={styles.loading} color={league?.primaryColor ?? COLORS.primary} size="large" />
      ) : displayBracket ? (
        <BracketViewer
          bracket={displayBracket}
          predictions={predictions}
          primaryColor={league?.primaryColor}
        />
      ) : (
        <EmptyState icon="📋" title="No bracket yet" subtitle="This member hasn't made their picks yet." />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1 },
});
