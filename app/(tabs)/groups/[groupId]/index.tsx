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
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useGroup } from '../../../../hooks/useGroups';
import { useAuthStore } from '../../../../store/authStore';
import { useGroupStore } from '../../../../store/groupStore';
import { LeaderboardRow } from '../../../../components/groups/LeaderboardRow';
import { InviteCodeCard } from '../../../../components/groups/InviteCodeCard';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../../../constants/theme';
import { format, isPast, addDays } from 'date-fns';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const userId = useAuthStore((s) => s.user?.id);

  const { group, members, myPrediction, loading, unlockPrediction } = useGroup(groupId);
  const deleteGroup = useGroupStore((s) => s.deleteGroup);
  const updateDeadline = useGroupStore((s) => s.updateDeadline);
  const refreshInviteCode = useGroupStore((s) => s.refreshInviteCode);
  const [deleting, setDeleting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  // Deadline editor state
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [noDeadline, setNoDeadline] = useState(false);
  const [editDeadline, setEditDeadline] = useState(addDays(new Date(), 7));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [savingDeadline, setSavingDeadline] = useState(false);

  const isOwner = group?.createdBy === userId;

  function openDeadlineEditor() {
    if (!group) return;
    setNoDeadline(group.pickDeadline === null);
    setEditDeadline(group.pickDeadline ? new Date(group.pickDeadline) : addDays(new Date(), 7));
    setShowDeadlineModal(true);
  }

  async function handleSaveDeadline() {
    if (!groupId) return;
    setSavingDeadline(true);
    await updateDeadline(groupId, noDeadline ? null : editDeadline);
    setSavingDeadline(false);
    setShowDeadlineModal(false);
  }

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

  const deadlinePast = group.pickDeadline ? isPast(new Date(group.pickDeadline)) : false;

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

      {/* Deadline Editor Modal */}
      <Modal
        visible={showDeadlineModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeadlineModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowDeadlineModal(false)}
        />
        <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Pick Deadline</Text>

          {/* No Deadline toggle */}
          <View style={[styles.noDeadlineRow, { borderColor: theme.border }]}>
            <Text style={[styles.noDeadlineLabel, { color: theme.text }]}>No deadline</Text>
            <Switch
              value={noDeadline}
              onValueChange={setNoDeadline}
              trackColor={{ true: COLORS.primary }}
            />
          </View>

          {/* Date/time picker — hidden when no-deadline is on */}
          {!noDeadline && (
            Platform.OS === 'web' ? (
              <View style={styles.webDateRow}>
                {/* @ts-ignore */}
                <input
                  type="date"
                  value={format(editDeadline, 'yyyy-MM-dd')}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      const next = new Date(editDeadline);
                      next.setFullYear(y, m - 1, d);
                      setEditDeadline(next);
                    }
                  }}
                  style={{
                    flex: 1,
                    background: theme.surfaceAlt,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    color: theme.text,
                    fontSize: 15,
                    height: 50,
                    padding: '0 12px',
                    outline: 'none',
                    cursor: 'pointer',
                    colorScheme: scheme === 'dark' ? 'dark' : 'light',
                  }}
                />
                {/* @ts-ignore */}
                <input
                  type="time"
                  value={format(editDeadline, 'HH:mm')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.target.value) {
                      const [h, min] = e.target.value.split(':').map(Number);
                      const next = new Date(editDeadline);
                      next.setHours(h, min);
                      setEditDeadline(next);
                    }
                  }}
                  style={{
                    width: 120,
                    background: theme.surfaceAlt,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    color: theme.text,
                    fontSize: 15,
                    height: 50,
                    padding: '0 12px',
                    outline: 'none',
                    cursor: 'pointer',
                    colorScheme: scheme === 'dark' ? 'dark' : 'light',
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateText, { color: theme.text }]}>
                  📅 {format(editDeadline, 'MMM d, yyyy · h:mm a')}
                </Text>
              </TouchableOpacity>
            )
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: theme.surfaceAlt }]}
              onPress={() => setShowDeadlineModal(false)}
            >
              <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalSaveBtn, savingDeadline && { opacity: 0.6 }]}
              onPress={handleSaveDeadline}
              disabled={savingDeadline}
            >
              {savingDeadline
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.modalSaveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {Platform.OS !== 'web' && showDatePicker && (() => {
          const DateTimePickerModal = require('react-native-modal-datetime-picker').default;
          return (
            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="datetime"
              date={editDeadline}
              minimumDate={new Date()}
              onConfirm={(date: Date) => { setEditDeadline(date); setShowDatePicker(false); }}
              onCancel={() => setShowDatePicker(false)}
            />
          );
        })()}
      </Modal>

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
            {/* Create Bracket CTA — no picks yet */}
            {!deadlinePast && !myPrediction && (
              <View style={[styles.createBracketCard, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                <Text style={[styles.createBracketEmoji]}>🏆</Text>
                <Text style={[styles.createBracketTitle, { color: theme.text }]}>Create Your Bracket</Text>
                <Text style={[styles.createBracketSub, { color: theme.textSecondary }]}>
                  {group.pickDeadline
                    ? `Pick your winners before ${format(new Date(group.pickDeadline), 'MMM d · h:mm a')}`
                    : 'Pick your winners for each matchup'}
                </Text>
                <TouchableOpacity
                  style={styles.createBracketBtn}
                  onPress={() => router.push(`/(tabs)/groups/${groupId}/picks`)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.createBracketBtnText}>Create Bracket</Text>
                </TouchableOpacity>
                {isOwner && (
                  <TouchableOpacity onPress={openDeadlineEditor}>
                    <Text style={[styles.editDeadlineText, { color: COLORS.primary }]}>Edit Deadline</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Edit picks CTA — has picks but not locked */}
            {!deadlinePast && myPrediction && !myPrediction.locked && (
              <View style={[styles.picksBanner, { backgroundColor: COLORS.primary + '22', borderColor: COLORS.primary + '44' }]}>
                <TouchableOpacity
                  style={styles.picksMain}
                  onPress={() => router.push(`/(tabs)/groups/${groupId}/picks`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.picksContent}>
                    <Text style={[styles.picksTitle, { color: COLORS.primary }]}>📝 Edit your picks</Text>
                    <Text style={[styles.picksSubtitle, { color: COLORS.primary + 'BB' }]}>
                      {group.pickDeadline
                        ? `Deadline: ${format(new Date(group.pickDeadline), 'MMM d · h:mm a')}`
                        : 'No deadline'}
                    </Text>
                  </View>
                  <Text style={[styles.picksArrow, { color: COLORS.primary }]}>›</Text>
                </TouchableOpacity>
                {isOwner && (
                  <TouchableOpacity style={styles.editDeadlineBtn} onPress={openDeadlineEditor}>
                    <Text style={[styles.editDeadlineText, { color: COLORS.primary }]}>Edit Deadline</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Owner deadline editor when picks are locked or deadline past */}
            {isOwner && (deadlinePast || myPrediction?.locked) && (
              <TouchableOpacity
                style={[styles.editDeadlineRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                onPress={openDeadlineEditor}
              >
                <Text style={[styles.editDeadlineRowText, { color: theme.textSecondary }]}>
                  Deadline: {group.pickDeadline ? format(new Date(group.pickDeadline), 'MMM d, yyyy · h:mm a') : 'None'}
                </Text>
                <Text style={[styles.editDeadlineText, { color: COLORS.primary }]}>Edit</Text>
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
              <InviteCodeCard
                code={group.inviteCode}
                groupName={group.name}
                onRefresh={isOwner ? async () => { await refreshInviteCode(groupId); } : undefined}
              />
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
  createBracketCard: {
    margin: SPACING.base,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  createBracketEmoji: { fontSize: 48 },
  createBracketTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  createBracketSub: { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20 },
  createBracketBtn: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  createBracketBtnText: { color: '#FFF', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  picksBanner: {
    margin: SPACING.base,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picksMain: {
    padding: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
  },
  picksContent: { flex: 1 },
  picksTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  picksSubtitle: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  picksArrow: { fontSize: 24 },
  editDeadlineBtn: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.primary + '44',
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  editDeadlineText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  editDeadlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  editDeadlineRowText: { fontSize: FONT_SIZE.sm },
  // Modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.base,
  },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.xs },
  noDeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: SPACING.base,
  },
  noDeadlineLabel: { fontSize: FONT_SIZE.base },
  webDateRow: { flexDirection: 'row', gap: SPACING.sm },
  dateButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    justifyContent: 'center',
  },
  dateText: { fontSize: FONT_SIZE.base },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  modalSaveBtn: { backgroundColor: COLORS.primary },
  modalSaveBtnText: { color: '#FFF', fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
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
