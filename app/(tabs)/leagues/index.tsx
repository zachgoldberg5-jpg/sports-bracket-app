import React from 'react';
import { SectionList, View, Text, StyleSheet, RefreshControl, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLeagues } from '../../../hooks/useLeague';
import { LeagueCard } from '../../../components/leagues/LeagueCard';
import { LeagueCardSkeleton } from '../../../components/ui/SkeletonLoader';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../../constants/theme';
import type { League } from '../../../types';

export default function LeaguesScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const { leagues, loading, refresh } = useLeagues();

  const liveLeagues = leagues.filter((l) => l.status === 'live');
  const soonLeagues = leagues.filter((l) => l.status !== 'live');

  const sections = [
    ...(liveLeagues.length > 0 ? [{ title: '🔴  Live Now', data: liveLeagues }] : []),
    ...(soonLeagues.length > 0 ? [{ title: '🔜  Starting Soon', data: soonLeagues }] : []),
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <SectionList
        sections={loading ? [] : sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: League }) => (
          <LeagueCard
            league={item}
            onPress={() => router.push(`/(tabs)/leagues/${item.id}`)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title}
            </Text>
          </View>
        )}
        ListHeaderComponent={
          loading ? (
            <>{[...Array(8)].map((_, i) => <LeagueCardSkeleton key={i} />)}</>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingTop: SPACING.xs, paddingBottom: SPACING['2xl'] },
  sectionHeader: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
