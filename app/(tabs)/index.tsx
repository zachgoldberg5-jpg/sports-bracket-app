import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLeagues } from '../../hooks/useLeague';
import { useAuthStore } from '../../store/authStore';
import { LeagueCard } from '../../components/leagues/LeagueCard';
import { LeagueCardSkeleton } from '../../components/ui/SkeletonLoader';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../constants/theme';
import type { League } from '../../types';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const profile = useAuthStore((s) => s.profile);
  const { leagues, loading, refresh } = useLeagues();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const liveLeagues = leagues.filter((l) => l.status === 'live');
  const upcomingLeagues = leagues.filter((l) => l.status === 'upcoming');
  const completedLeagues = leagues.filter((l) => l.status === 'completed');
  const offLeagues = leagues.filter((l) => l.status === 'off_season');

  const sections = [
    { key: 'live', title: '🟢 Live Now', data: liveLeagues },
    { key: 'upcoming', title: '🟡 Starting Soon', data: upcomingLeagues },
    { key: 'completed', title: '✅ Completed', data: completedLeagues },
    { key: 'off', title: '⛔ Off Season', data: offLeagues },
  ].filter((s) => s.data.length > 0);

  const handleLeaguePress = useCallback((league: League) => {
    router.push(`/(tabs)/leagues/${league.id}`);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                  {greeting()},{' '}
                </Text>
                <Text style={[styles.name, { color: theme.text }]}>
                  {profile?.displayName ?? 'Player'} 👋
                </Text>
              </View>
            </View>

            {/* Status summary row */}
            <View style={[styles.summaryRow, { backgroundColor: theme.surface }]}>
              {[
                { count: liveLeagues.length, label: 'Live', color: COLORS.live },
                { count: upcomingLeagues.length, label: 'Upcoming', color: COLORS.upcoming },
                { count: completedLeagues.length, label: 'Done', color: COLORS.completed },
              ].map((s) => (
                <View key={s.label} style={styles.summaryItem}>
                  <Text style={[styles.summaryCount, { color: s.color }]}>{s.count}</Text>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* League sections */}
            {loading ? (
              <>
                {[...Array(4)].map((_, i) => <LeagueCardSkeleton key={i} />)}
              </>
            ) : (
              sections.map((section) => (
                <View key={section.key}>
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                    {section.title}
                  </Text>
                  {section.data.map((league) => (
                    <LeagueCard
                      key={league.id}
                      league={league}
                      onPress={() => handleLeaguePress(league)}
                    />
                  ))}
                </View>
              ))
            )}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: SPACING['2xl'] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  greeting: { fontSize: FONT_SIZE.sm },
  name: { fontSize: FONT_SIZE['2xl'], fontWeight: FONT_WEIGHT.bold },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.base,
    borderRadius: 12,
    padding: SPACING.base,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryCount: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: SPACING.base,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.base,
  },
});
