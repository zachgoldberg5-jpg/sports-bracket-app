import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { calculateRankings } from '../../lib/scoring';
import { useAuthStore } from '../../store/authStore';
import { LeaderboardRow } from '../../components/groups/LeaderboardRow';
import { EmptyState } from '../../components/ui/EmptyState';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../constants/theme';
import type { GroupMember, Profile } from '../../types';

type GlobalEntry = GroupMember;

export default function GlobalLeaderboardScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const userId = useAuthStore((s) => s.user?.id);

  const [entries, setEntries] = useState<GlobalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      // Get top users by total correct predictions
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, username, total_correct_predictions, total_predictions, subscription_tier, created_at')
        .order('total_correct_predictions', { ascending: false })
        .limit(100);

      if (data) {
        const raw = data.map((p) => ({
          userId: p.id,
          profile: {
            id: p.id,
            username: p.username,
            displayName: p.display_name,
            avatarUrl: p.avatar_url ?? undefined,
            subscriptionTier: p.subscription_tier,
            totalCorrectPredictions: p.total_correct_predictions,
            totalPredictions: p.total_predictions,
            createdAt: p.created_at,
          } as Profile,
          score: p.total_correct_predictions,
          rank: 0,
          correctPicks: p.total_correct_predictions,
          totalPicks: p.total_predictions,
        }));
        setEntries(calculateRankings(raw));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaderboard();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen options={{ title: 'Global Leaderboard', headerShown: true,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }} />

      <FlatList
        data={entries}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => (
          <LeaderboardRow member={item} isCurrentUser={item.userId === userId} />
        )}
        ListHeaderComponent={
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.headerText, { color: theme.textSecondary }]}>
              🌍 All-time global rankings based on total correct bracket picks
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="🏆"
              title="No rankings yet"
              subtitle="Start making predictions to appear on the leaderboard."
            />
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadLeaderboard} tintColor={COLORS.primary} />
        }
        contentContainerStyle={entries.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />

      {loading && entries.length === 0 && (
        <ActivityIndicator style={styles.loader} color={COLORS.primary} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: SPACING.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: { fontSize: FONT_SIZE.sm, lineHeight: 20 },
  emptyList: { flex: 1 },
  loader: { position: 'absolute', alignSelf: 'center', top: '50%' },
});
