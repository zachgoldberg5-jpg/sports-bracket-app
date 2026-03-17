import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useLeague } from '../../../../hooks/useLeague';
import { useAuthStore } from '../../../../store/authStore';
import { useGroupStore } from '../../../../store/groupStore';
import { BracketViewer } from '../../../../components/bracket/BracketViewer';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../../../constants/theme';
import type { Bracket, PredictionMap, LeagueId, Team } from '../../../../types';

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

export default function PersonalPicksScreen() {
  const { leagueId } = useLocalSearchParams<{ leagueId: string }>();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const user = useAuthStore((s) => s.user);
  const store = useGroupStore();
  const { league, bracket, loadingBracket } = useLeague(leagueId as LeagueId);

  const [predictions, setPredictions] = useState<PredictionMap>({});
  const [showQuickFill, setShowQuickFill] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [bracketName, setBracketName] = useState('');
  const isLocked = store.myPersonalPrediction?.locked ?? false;
  const isNew = !store.myPersonalPrediction;

  const displayBracket = useMemo(
    () => bracket ? computePredictionBracket(bracket, predictions) : null,
    [bracket, predictions]
  );

  useEffect(() => {
    if (user && leagueId) {
      store.loadMyPersonalPrediction(leagueId, user.id);
    }
  }, [user?.id, leagueId]);

  useEffect(() => {
    if (store.myPersonalPrediction?.predictions) {
      setPredictions(store.myPersonalPrediction.predictions);
    }
  }, [store.myPersonalPrediction?.predictions]);

  function handlePickTeam(matchId: string, teamId: string) {
    if (isLocked) return;
    setPredictions((prev) => ({ ...prev, [matchId]: teamId }));
  }

  async function doSave(name?: string) {
    if (!displayBracket || !user || !leagueId) return;
    setSaving(true);
    await store.savePersonalPrediction(leagueId, user.id, predictions, displayBracket, name);
    setSaving(false);
    if (Platform.OS === 'web') {
      window.alert('Saved! Your personal bracket has been saved.');
    } else {
      Alert.alert('Saved!', 'Your personal bracket has been saved.');
    }
  }

  function handleSave() {
    if (isNew) {
      // First save — prompt for a name
      setShowNamePrompt(true);
    } else {
      doSave();
    }
  }

  async function doLock(name?: string) {
    if (!displayBracket || !user || !leagueId) return;
    setSaving(true);
    await store.savePersonalPrediction(leagueId, user.id, predictions, displayBracket, name);
    const pred = useGroupStore.getState().myPersonalPrediction;
    if (pred) await store.lockPrediction(pred.id);
    setSaving(false);
    if (Platform.OS === 'web') {
      window.alert('Picks Locked! Your personal bracket is locked in.');
    } else {
      Alert.alert('Picks Locked', 'Your personal bracket is locked in.');
    }
  }

  function handleLock() {
    if (isNew) {
      setShowNamePrompt(true);
      return;
    }
    if (Platform.OS === 'web') {
      if (window.confirm('Lock your picks? Once locked you cannot change them.')) doLock();
    } else {
      Alert.alert(
        'Lock your picks?',
        'Once locked, your picks cannot be changed. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Lock Picks', style: 'destructive', onPress: () => doLock() },
        ]
      );
    }
  }

  function quickFill(mode: 'random' | 'topSeed') {
    if (!bracket) return;
    setShowQuickFill(false);
    const newPredictions: PredictionMap = {};
    let computed = bracket;
    for (const round of computed.rounds) {
      computed = computePredictionBracket(bracket, newPredictions);
      const computedRound = computed.rounds.find((r) => r.roundNumber === round.roundNumber);
      if (!computedRound) continue;
      for (const match of computedRound.matches) {
        if (!match.homeTeam || !match.awayTeam) continue;
        let winnerId: string;
        if (mode === 'random') {
          winnerId = Math.random() < 0.5 ? match.homeTeam.id : match.awayTeam.id;
        } else {
          const homeSeed = match.homeTeam.seed ?? 999;
          const awaySeed = match.awayTeam.seed ?? 999;
          winnerId = homeSeed <= awaySeed ? match.homeTeam.id : match.awayTeam.id;
        }
        newPredictions[match.id] = winnerId;
      }
    }
    setPredictions(newPredictions);
  }

  if (loadingBracket) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'My Bracket' }} />
        <ActivityIndicator style={{ flex: 1 }} color={league?.primaryColor ?? COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!bracket || !league) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'My Bracket' }} />
        <EmptyState icon="⏳" title="Bracket not available yet" subtitle="Check back when the playoffs begin." />
      </SafeAreaView>
    );
  }

  const totalMatches = displayBracket!.rounds.flatMap((r) => r.matches).filter((m) => m.homeTeam && m.awayTeam).length;
  const pickedCount = Object.keys(predictions).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen options={{ title: isLocked ? '🔒 My Bracket (Locked)' : 'My Personal Bracket' }} />

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: theme.surfaceAlt }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: league.primaryColor, width: `${totalMatches > 0 ? (pickedCount / totalMatches) * 100 : 0}%` },
          ]}
        />
      </View>
      <View style={styles.progressLabel}>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {pickedCount}/{totalMatches} picks made
        </Text>
        {isLocked && (
          <Text style={[styles.lockedText, { color: COLORS.completed ?? '#10B981' }]}>🔒 Locked</Text>
        )}
      </View>

      {!isLocked && (
        <>
          <View style={[styles.instructionsRow, { backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.instructionsText, { color: theme.textSecondary, flex: 1 }]}>
              Tap a team to pick them as the winner.
            </Text>
            <TouchableOpacity
              onPress={() => setShowQuickFill((v) => !v)}
              style={[styles.quickFillBtn, { borderColor: league.primaryColor }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.quickFillBtnText, { color: league.primaryColor }]}>⚡ Quick Fill</Text>
            </TouchableOpacity>
          </View>

          {showQuickFill && (
            <View style={[styles.quickFillMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.quickFillLabel, { color: theme.textSecondary }]}>Fill all picks automatically:</Text>
              <View style={styles.quickFillOptions}>
                <TouchableOpacity
                  style={[styles.quickFillOption, { borderColor: league.primaryColor, backgroundColor: league.primaryColor + '18' }]}
                  onPress={() => quickFill('topSeed')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickFillOptionTitle, { color: league.primaryColor }]}>🏆 Top Seed</Text>
                  <Text style={[styles.quickFillOptionSub, { color: theme.textSecondary }]}>Higher seed always wins</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickFillOption, { borderColor: theme.border }]}
                  onPress={() => quickFill('random')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickFillOptionTitle, { color: theme.text }]}>🎲 Random</Text>
                  <Text style={[styles.quickFillOptionSub, { color: theme.textSecondary }]}>Randomly pick winners</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      <View style={styles.bracketArea}>
        <BracketViewer
          bracket={displayBracket!}
          predictions={predictions}
          onPickTeam={!isLocked ? handlePickTeam : undefined}
          isLocked={isLocked}
          primaryColor={league.primaryColor}
        />
      </View>

      {!isLocked && (
        <View style={[styles.actions, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.saveButton, { borderColor: league.primaryColor }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={league.primaryColor} />
            ) : (
              <Text style={[styles.saveButtonText, { color: league.primaryColor }]}>Save Bracket</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.lockButton, { backgroundColor: league.primaryColor }]}
            onPress={handleLock}
            disabled={saving || pickedCount === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.lockButtonText}>Lock Picks 🔒</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Name prompt modal */}
      <Modal visible={showNamePrompt} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Name your bracket</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Give it a name so you can find it easily in My Brackets.
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
              placeholder={`My ${league.name} Bracket`}
              placeholderTextColor={theme.textTertiary}
              value={bracketName}
              onChangeText={setBracketName}
              maxLength={40}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalSecondary, { borderColor: theme.border }]}
                onPress={() => { setShowNamePrompt(false); doSave(undefined); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalSecondaryText, { color: theme.textSecondary }]}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimary, { backgroundColor: league.primaryColor }]}
                onPress={() => { setShowNamePrompt(false); doSave(bracketName.trim() || undefined); }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  instructionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.base,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  instructionsText: { fontSize: FONT_SIZE.xs },
  quickFillBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  quickFillBtnText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },
  quickFillMenu: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  quickFillLabel: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium },
  quickFillOptions: { flexDirection: 'row', gap: SPACING.sm },
  quickFillOption: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 2,
  },
  quickFillOptionTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  quickFillOptionSub: { fontSize: FONT_SIZE.xs },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold },
  modalSubtitle: { fontSize: FONT_SIZE.sm, lineHeight: 20 },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    fontSize: FONT_SIZE.base,
  },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  modalSecondary: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryText: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.medium },
  modalPrimary: {
    flex: 2,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryText: { color: '#FFF', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
});
