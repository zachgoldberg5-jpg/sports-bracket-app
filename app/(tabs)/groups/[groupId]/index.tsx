import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useGroup } from '../../../../hooks/useGroups';
import { useAuthStore } from '../../../../store/authStore';
import { useGroupStore } from '../../../../store/groupStore';
import { LeaderboardRow } from '../../../../components/groups/LeaderboardRow';
import { InviteCodeCard } from '../../../../components/groups/InviteCodeCard';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../../../constants/theme';
import { format, isPast } from 'date-fns';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const userId = useAuthStore((s) => s.user?.id);

  const { group, members, myPrediction, loading, unlockPrediction } = useGroup(groupId);
  const deleteGroup = useGroupStore((s) => s.deleteGroup);
  const [deleting, setDeleting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const isOwner = group?.createdBy === userId;

  function confirmDelete() {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${group?.name}"? This cannot be undone.`)) {
        handleDelete();
      }
    } else {
      Alert.alert(
        'Delete Group',
        `Delete "${group?.name}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: handleDelete },
        ]
      );
    }
  }

  async function handleDelete() {
    if (!groupId) return;
    setDeleting(true);
    const ok = await deleteGroup(groupId);
    setDeleting(false);
    if (ok) router.replace('/(tabs)/groups');
  }

  if (loading && !group) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!group) {
    return <EmptyState title="Group not found" />;
  }

  const deadlinePast = isPast(new Date(group.pickDeadline));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: group.name,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: SPACING.md, paddingRight: SPACING.xs }}>
              <TouchableOpacity
                onPress={() => router.push({
                  pathname: '/modal/invite',
                  params: { code: group.inviteCode, name: group.name },
                })}
              >
                <Text style={{ color: COLORS.primary, fontSize: FONT_SIZE.sm }}>Invite</Text>
              </TouchableOpacity>
              {isOwner && (
                <TouchableOpacity onPress={confirmDelete} disabled={deleting}>
                  <Text style={{ color: '#EF4444', fontSize: FONT_SIZE.sm }}>
                    {deleting ? '...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />

      <FlatList
        data={members}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => (
          <LeaderboardRow
            member={item}
            isCurrentUser={item.userId === userId}
            onPress={() => router.push({
              pathname: '/(tabs)/groups/[groupId]/member-bracket' as any,
              params: {
                groupId,
                memberId: item.userId,
                displayName: item.profile.displayName,
                predictionsJson: JSON.stringify(item.predictions ?? {}),
              },
            })}
          />
        )}
        ListHeaderComponent={
          <>
            {/* Picks CTA — only show when not yet locked */}
            {!deadlinePast && !myPrediction?.locked && (
              <TouchableOpacity
                style={[styles.picksBanner, { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary + '44' }]}
                onPress={() => router.push(`/(tabs)/groups/${groupId}/picks`)}
                activeOpacity={0.8}
              >
                <View style={styles.picksContent}>
                  <Text style={[styles.picksTitle, { color: COLORS.primary }]}>📝 Make your picks</Text>
                  <Text style={[styles.picksSubtitle, { color: COLORS.primary + 'BB' }]}>
                    Deadline: {format(new Date(group.pickDeadline), 'MMM d · h:mm a')}
                  </Text>
                </View>
                <Text style={[styles.picksArrow, { color: COLORS.primary }]}>›</Text>
              </TouchableOpacity>
            )}

            {/* View/Edit Bracket — shown after locking, disappears after deadline */}
            {myPrediction?.locked && !deadlinePast && (
              <View style={[styles.viewEditRow, { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary + '44' }]}>
                <TouchableOpacity
                  style={styles.viewEditBtn}
                  onPress={() => router.push(`/(tabs)/groups/${groupId}/picks`)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.viewEditText, { color: COLORS.primary }]}>👁 View Bracket</Text>
                </TouchableOpacity>
                <View style={[styles.viewEditDivider, { backgroundColor: COLORS.primary + '44' }]} />
                <TouchableOpacity
                  style={styles.viewEditBtn}
                  onPress={async () => {
                    setUnlocking(true);
                    await unlockPrediction();
                    setUnlocking(false);
                    router.push(`/(tabs)/groups/${groupId}/picks`);
                  }}
                  disabled={unlocking}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.viewEditText, { color: COLORS.primary }]}>
                    {unlocking ? '...' : '✏️ Edit Bracket'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Invite code */}
            <View style={styles.inviteWrap}>
              <InviteCodeCard code={group.inviteCode} groupName={group.name} />
            </View>

            {/* Leaderboard header */}
            <View style={[styles.leaderboardHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.leaderboardTitle, { color: theme.textSecondary }]}>
                Leaderboard · {members.length} {members.length === 1 ? 'member' : 'members'}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title="No members yet"
            subtitle="Share your invite code to get friends to join."
          />
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => {}} tintColor={COLORS.primary} />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingBottom: SPACING['2xl'] },
  picksBanner: {
    margin: SPACING.base,
    padding: SPACING.base,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  picksContent: { flex: 1 },
  picksTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  picksSubtitle: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  picksArrow: { fontSize: 24 },
  viewEditRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  viewEditBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewEditDivider: {
    width: 1,
  },
  viewEditText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  inviteWrap: { paddingHorizontal: SPACING.base, marginBottom: SPACING.base },
  leaderboardHeader: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leaderboardTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
