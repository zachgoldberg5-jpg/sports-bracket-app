import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLeague } from '../../../../hooks/useLeague';
import { BracketViewer } from '../../../../components/bracket/BracketViewer';
import { StandingsTable } from '../../../../components/standings/StandingsTable';
import { StatusBadge } from '../../../../components/leagues/StatusBadge';
import { ChampionDisplay } from '../../../../components/bracket/ChampionDisplay';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../../../constants/theme';
import { projectBracket } from '../../../../lib/bracketProjection';
import type { LeagueId, PredictionMap } from '../../../../types';
import { format } from 'date-fns';

export default function LeagueDetailScreen() {
  const { leagueId } = useLocalSearchParams<{ leagueId: string }>();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const { league, bracket, standings, loadingBracket, loadingStandings, refresh } = useLeague(
    leagueId as LeagueId
  );

  // Picks state — must be before any early returns (Rules of Hooks)
  const [predictions, setPredictions] = useState<PredictionMap>({});
  const [tiebreakerScore, setTiebreakerScore] = useState('');

  const projectedBracket = useMemo(
    () => (bracket ? projectBracket(bracket, predictions) : null),
    [bracket, predictions]
  );

  const handlePickTeam = (matchId: string, teamId: string) => {
    setPredictions((prev) => ({ ...prev, [matchId]: teamId }));
  };

  if (!league) {
    return <EmptyState title="League not found" />;
  }

  const loading = loadingBracket || loadingStandings;

  // ── Off-season ──────────────────────────────────────────────────────────────
  if (league.status === 'off_season') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <Stack.Screen options={{ title: league.name }} />
        <EmptyState
          icon="⏳"
          title="Season hasn't started yet"
          subtitle={
            league.seasonStartDate
              ? `Season begins ${format(new Date(league.seasonStartDate), 'MMMM d, yyyy')}`
              : 'Check back soon for schedule updates.'
          }
        />
      </SafeAreaView>
    );
  }

  // ── Completed ───────────────────────────────────────────────────────────────
  if (league.status === 'completed' && bracket?.champion) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <Stack.Screen options={{ title: league.name }} />
        <ScrollView>
          <ChampionDisplay
            champion={bracket.champion}
            leagueName={league.name}
            season={league.season}
            primaryColor={league.primaryColor}
          />
          {bracket && (
            <View style={styles.bracketSection}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                Final Bracket
              </Text>
              <View style={styles.bracketContainer}>
                <BracketViewer bracket={bracket} primaryColor={league.primaryColor} />
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Upcoming (pre-playoffs) ──────────────────────────────────────────────────
  if (league.status === 'upcoming') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <Stack.Screen options={{ title: league.name }} />
        <ScrollView
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.primary} />}
        >
          {/* Playoff countdown banner */}
          <View style={[styles.banner, { backgroundColor: league.primaryColor + '22', borderColor: league.primaryColor + '44' }]}>
            <Text style={[styles.bannerTitle, { color: league.primaryColor }]}>
              🏆 Playoffs begin{' '}
              {league.playoffStartDate
                ? format(new Date(league.playoffStartDate), 'MMMM d')
                : 'soon'}
            </Text>
            <Text style={[styles.bannerSubtitle, { color: theme.textSecondary }]}>
              Check back to make your bracket predictions
            </Text>
          </View>

          {/* Current standings */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Current Standings
          </Text>
          {loadingStandings ? (
            <ActivityIndicator style={{ margin: SPACING.xl }} color={COLORS.primary} />
          ) : standings && standings.length > 0 ? (
            <StandingsTable conferences={standings} />
          ) : (
            <EmptyState icon="📊" title="Standings unavailable" subtitle="Data will appear here when the season is underway." />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Live (playoffs active) ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: league.name,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/leagues/${leagueId}/bracket`)}
              style={styles.fullscreenBtn}
            >
              <Text style={{ color: COLORS.primary, fontSize: FONT_SIZE.sm }}>Full Screen</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.headerRow}>
        <StatusBadge status={league.status} />
        <Text style={[styles.season, { color: theme.textSecondary }]}>{league.season}</Text>
      </View>

      {loadingBracket ? (
        <ActivityIndicator style={{ flex: 1 }} color={league.primaryColor} />
      ) : bracket ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <BracketViewer
            bracket={projectedBracket!}
            predictions={predictions}
            onPickTeam={handlePickTeam}
            primaryColor={league.primaryColor}
          />
          <View style={[styles.tiebreakerRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.tiebreakerLabel, { color: theme.textSecondary }]}>
              Tiebreaker: final score total
            </Text>
            <TextInput
              style={[
                styles.tiebreakerInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                },
              ]}
              value={tiebreakerScore}
              onChangeText={setTiebreakerScore}
              placeholder="0"
              placeholderTextColor={theme.textTertiary}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
        </KeyboardAvoidingView>
      ) : (
        <EmptyState
          icon="🏀"
          title="Bracket loading..."
          subtitle="Live bracket data is being fetched."
          actionLabel="Refresh"
          onAction={refresh}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  season: { fontSize: FONT_SIZE.sm },
  fullscreenBtn: { paddingRight: SPACING.sm },
  banner: {
    margin: SPACING.base,
    padding: SPACING.base,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  bannerTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  bannerSubtitle: { fontSize: FONT_SIZE.sm },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  bracketSection: { marginTop: SPACING.base },
  bracketContainer: { height: 400 },
  tiebreakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tiebreakerLabel: { fontSize: FONT_SIZE.sm },
  tiebreakerInput: {
    width: 72,
    textAlign: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    fontSize: FONT_SIZE.md,
  },
});
