import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useGroup } from '../../../../hooks/useGroups';
import { useLeague } from '../../../../hooks/useLeague';
import { BracketViewer } from '../../../../components/bracket/BracketViewer';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../../../constants/theme';
import type { Bracket, PredictionMap, LeagueId, Team } from '../../../../types';
import { isPast } from 'date-fns';

/**
 * Takes the real bracket and user's predictions, and returns a new bracket
 * where picked winners are propagated forward into future round slots.
 * This lets the user pick in round 2 based on their round 1 selections.
 */
function computePredictionBracket(bracket: Bracket, predictions: PredictionMap): Bracket {
  if (Object.keys(predictions).length === 0) return bracket;

  // matchId → the team object the user picked as winner
  const pickedTeams: Record<string, Team | undefined> = {};

  const computedRounds = bracket.rounds.map((round, roundIdx) => {
    const prevRound = roundIdx > 0 ? bracket.rounds[roundIdx - 1] : null;

    const matches = round.matches.map((match) => {
      let { homeTeam, awayTeam } = match;

      // Fill TBD slots using picks from the previous round
      if (prevRound) {
        const homeFeederIdx = match.position * 2;
        const awayFeederIdx = match.position * 2 + 1;
        const homeFeeder = prevRound.matches.find((m) => m.position === homeFeederIdx);
        const awayFeeder = prevRound.matches.find((m) => m.position === awayFeederIdx);

        if (!homeTeam && homeFeeder && pickedTeams[homeFeeder.id]) {
          homeTeam = pickedTeams[homeFeeder.id];
        }
        if (!awayTeam && awayFeeder && pickedTeams[awayFeeder.id]) {
          awayTeam = pickedTeams[awayFeeder.id];
        }
      }

      const updatedMatch = { ...match, homeTeam, awayTeam };

      // Record this match's picked winner so it can feed the next round
      const pickedId = predictions[match.id];
      if (pickedId) {
        const winner =
          homeTeam?.id === pickedId ? homeTeam
          : awayTeam?.id === pickedId ? awayTeam
          : undefined;
        if (winner) pickedTeams[match.id] = winner;
      }

      return updatedMatch;
    });

    return { ...round, matches };
  });

  return { ...bracket, rounds: computedRounds };
}

export default function PicksScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const { group, myPrediction, savePrediction, lockPrediction, unlockPrediction, savingPrediction } = useGroup(groupId);
  const leagueId = group?.leagueId;
  const { league, bracket, loadingBracket } = useLeague((leagueId ?? 'nba') as LeagueId);

  const [predictions, setPredictions] = useState<PredictionMap>({});
  const isLocked = myPrediction?.locked ?? false;
  const deadlinePast = group ? isPast(new Date(group.pickDeadline)) : false;

  const displayBracket = useMemo(
    () => bracket ? computePredictionBracket(bracket, predictions) : null,
    [bracket, predictions]
  );

  useEffect(() => {
    if (myPrediction?.predictions) {
      setPredictions(myPrediction.predictions);
    }
  }, [myPrediction?.predictions]);

  function handlePickTeam(matchId: string, teamId: string) {
    if (isLocked || deadlinePast) return;
    setPredictions((prev) => ({ ...prev, [matchId]: teamId }));
  }

  async function handleSave() {
    if (!displayBracket || !group) return;
    await savePrediction(predictions, displayBracket);
    Alert.alert('Saved!', 'Your picks have been saved. You can update them until the deadline.');
  }

  async function handleLock() {
    Alert.alert(
      'Lock your picks?',
      'Once locked, your picks cannot be changed. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock Picks',
          style: 'destructive',
          onPress: async () => {
            if (!displayBracket || !group) return;
            await savePrediction(predictions, displayBracket);
            await lockPrediction();
            Alert.alert('Picks Locked', 'Your bracket is locked in. Good luck!');
          },
        },
      ]
    );
  }

  if (!group || !league) {
    return <EmptyState title="Loading..." />;
  }

  if (loadingBracket) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator style={{ flex: 1 }} color={league?.primaryColor ?? COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!bracket) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Make Picks' }} />
        <EmptyState
          icon="⏳"
          title="Bracket not available"
          subtitle="The playoff bracket hasn't been set yet. Check back closer to the start."
        />
      </SafeAreaView>
    );
  }

  const totalMatches = displayBracket!.rounds.flatMap((r) => r.matches).filter((m) => m.homeTeam && m.awayTeam).length;
  const pickedCount = Object.keys(predictions).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: isLocked ? '🔒 Picks Locked' : 'Make Your Picks',
        }}
      />

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: theme.surfaceAlt }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: league.primaryColor,
              width: `${totalMatches > 0 ? (pickedCount / totalMatches) * 100 : 0}%`,
            },
          ]}
        />
      </View>
      <View style={styles.progressLabel}>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {pickedCount}/{totalMatches} picks made
        </Text>
        {(isLocked || deadlinePast) && (
          <Text style={[styles.lockedText, { color: COLORS.completed }]}>
            {isLocked ? '🔒 Locked' : '⏰ Deadline passed'}
          </Text>
        )}
      </View>

      {/* Instructions */}
      {!isLocked && !deadlinePast && (
        <View style={[styles.instructions, { backgroundColor: theme.surfaceAlt }]}>
          <Text style={[styles.instructionsText, { color: theme.textSecondary }]}>
            Tap a team to pick them as the winner. Double-tap to reset zoom.
          </Text>
        </View>
      )}

      {/* Bracket */}
      <View style={styles.bracketArea}>
        <BracketViewer
          bracket={displayBracket!}
          predictions={predictions}
          onPickTeam={!isLocked && !deadlinePast ? handlePickTeam : undefined}
          isLocked={isLocked || deadlinePast}
          primaryColor={league.primaryColor}
        />
      </View>

      {/* Action buttons — editing */}
      {!isLocked && !deadlinePast && (
        <View style={[styles.actions, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.saveButton, { borderColor: league.primaryColor }]}
            onPress={handleSave}
            disabled={savingPrediction}
            activeOpacity={0.8}
          >
            {savingPrediction ? (
              <ActivityIndicator color={league.primaryColor} />
            ) : (
              <Text style={[styles.saveButtonText, { color: league.primaryColor }]}>Save Picks</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.lockButton, { backgroundColor: league.primaryColor }]}
            onPress={handleLock}
            disabled={savingPrediction || pickedCount === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.lockButtonText}>Lock Picks 🔒</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Locked but deadline not past — allow editing */}
      {isLocked && !deadlinePast && (
        <View style={[styles.actions, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.editButton]}
            onPress={unlockPrediction}
            activeOpacity={0.8}
          >
            <Text style={styles.editButtonText}>✏️ Edit Picks</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBar: { height: 4, marginHorizontal: SPACING.base, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
  },
  progressText: { fontSize: FONT_SIZE.xs },
  lockedText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },
  instructions: {
    marginHorizontal: SPACING.base,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  instructionsText: { fontSize: FONT_SIZE.xs, textAlign: 'center' },
  bracketArea: { flex: 1 },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.base,
    paddingBottom: SPACING.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },
  lockButton: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockButtonText: { color: '#FFF', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  editButton: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
  },
  editButtonText: { color: '#FFF', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
});
