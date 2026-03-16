import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLeagues } from '../../hooks/useLeague';
import { useAuthStore } from '../../store/authStore';
import { LeagueCard } from '../../components/leagues/LeagueCard';
import { LeagueCardSkeleton } from '../../components/ui/SkeletonLoader';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';
import type { League } from '../../types';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const profile = useAuthStore((s) => s.profile);
  const { leagues, loading, refresh } = useLeagues();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const liveLeagues    = leagues.filter((l) => l.status === 'live');
  const upcomingLeagues = leagues.filter((l) => l.status === 'upcoming');
  const completedLeagues = leagues.filter((l) => l.status === 'completed');
  const offLeagues     = leagues.filter((l) => l.status === 'off_season');

  const mmLeague = leagues.find((l) => l.id === 'ncaa_mm');
  const showMMBanner = mmLeague && (mmLeague.status === 'upcoming' || mmLeague.status === 'live');

  const sections = [
    { key: 'live',     title: '🟢  Live Now',     data: liveLeagues },
    { key: 'upcoming', title: '🟡  Starting Soon', data: upcomingLeagues },
    { key: 'completed',title: '✅  Completed',     data: completedLeagues },
    { key: 'off',      title: '⛔  Off Season',    data: offLeagues },
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
              <View style={styles.appTitle}>
                <Text style={[styles.appName, { color: theme.text }]}>Gold Picks</Text>
                <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>Sports Brackets</Text>
                <Text style={[styles.appTagline, { color: theme.textSecondary }]}>
                  {'Predict playoff brackets for all major sports leagues.\nCompete with friends. Track your wins.'}
                </Text>
              </View>
              <View>
                <Text style={[styles.greeting, { color: theme.textSecondary }]}>{greeting()},</Text>
                <Text style={[styles.name, { color: theme.text }]}>
                  {profile?.displayName ?? 'Player'} 👋
                </Text>
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              {[
                { count: liveLeagues.length,     label: 'Live',     color: COLORS.live },
                { count: upcomingLeagues.length, label: 'Upcoming', color: COLORS.upcoming },
                { count: completedLeagues.length,label: 'Done',     color: COLORS.completed },
              ].map((s) => (
                <View key={s.label} style={[styles.statPill, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.statCount, { color: s.color }]}>{s.count}</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* March Madness featured banner */}
            {showMMBanner && (
              <TouchableOpacity
                style={styles.mmBanner}
                onPress={() => router.push('/(tabs)/leagues/ncaa_mm')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#F47321', '#CC5500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mmGradient}
                >
                  <View style={styles.mmContent}>
                    <Text style={styles.mmEmoji}>🏀</Text>
                    <View style={styles.mmText}>
                      <Text style={styles.mmTitle}>March Madness</Text>
                      <Text style={styles.mmSub}>
                        {mmLeague!.status === 'live' ? 'Tournament is live — check your bracket!' : 'Fill out your bracket before tip-off →'}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* League sections */}
            {loading ? (
              [...Array(4)].map((_, i) => <LeagueCardSkeleton key={i} />)
            ) : (
              sections.map((section) => (
                <View key={section.key}>
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                    {section.title}
                  </Text>
                  {section.data.map((league) => (
                    <LeagueCard key={league.id} league={league} onPress={() => handleLeaguePress(league)} />
                  ))}
                </View>
              ))
            )}
          </>
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.primary} />
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
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  appTitle: { marginBottom: SPACING.md },
  appName: { fontSize: FONT_SIZE['3xl'], fontWeight: FONT_WEIGHT.extrabold, lineHeight: 36 },
  appSubtitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  appTagline: { fontSize: FONT_SIZE.sm, lineHeight: 20, opacity: 0.7 },
  greeting: { fontSize: FONT_SIZE.sm, marginBottom: 2 },
  name: { fontSize: FONT_SIZE['2xl'], fontWeight: FONT_WEIGHT.extrabold },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.base,
    gap: SPACING.sm,
  },
  statPill: {
    flex: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 2,
  },
  statCount: { fontSize: FONT_SIZE['2xl'], fontWeight: FONT_WEIGHT.extrabold },
  statLabel: { fontSize: FONT_SIZE.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  mmBanner: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.base,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  mmGradient: { padding: SPACING.base },
  mmContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  mmEmoji: { fontSize: 40 },
  mmText: { flex: 1 },
  mmTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.extrabold, color: '#FFF' },
  mmSub: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.base,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.base,
  },
});
