import React from 'react';
import { FlatList, StyleSheet, RefreshControl, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLeagues } from '../../../hooks/useLeague';
import { LeagueCard } from '../../../components/leagues/LeagueCard';
import { LeagueCardSkeleton } from '../../../components/ui/SkeletonLoader';
import { COLORS, SPACING } from '../../../constants/theme';
import type { League } from '../../../types';

export default function LeaguesScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const { leagues, loading, refresh } = useLeagues();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <FlatList
        data={loading ? [] : leagues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LeagueCard
            league={item}
            onPress={() => router.push(`/(tabs)/leagues/${item.id}`)}
          />
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingTop: SPACING.sm, paddingBottom: SPACING['2xl'] },
});
