import React, { useEffect, useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  RefreshControl,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';
import { EmptyState } from '../../components/ui/EmptyState';
import { LeagueLogo } from '../../components/ui/LeagueLogo';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';
import { LEAGUE_CONFIGS, LEAGUE_EMOJI } from '../../constants/leagues';
import { format } from 'date-fns';
import type { UserPrediction, LeagueId } from '../../types';

export default function MyBracketsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const user = useAuthStore((s) => s.user);
  const store = useGroupStore();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  function load() {
    if (user) store.loadAllMyPredictions(user.id);
  }

  // Reload every time this tab is focused so newly created brackets appear
  useFocusEffect(useCallback(() => { load(); }, [user?.id]));

  function handlePress(item: UserPrediction) {
    if (item.groupId) {
      // Navigate to the group's picks view
      router.push(`/(tabs)/groups/${item.groupId}/picks`);
    } else if (item.leagueId) {
      // Personal bracket — navigate to personal picks screen
      router.push(`/(tabs)/leagues/${item.leagueId}/picks`);
    }
  }

  function openRename(item: UserPrediction) {
    const defaultName = item.name || (item.groupId
      ? item.groupName ?? 'Group Bracket'
      : `My ${item.leagueId ? LEAGUE_CONFIGS[item.leagueId as LeagueId]?.name ?? '' : ''} Bracket`);
    setRenameValue(defaultName);
    setRenamingId(item.id);
  }

  async function submitRename() {
    if (!renamingId) return;
    await store.renamePersonalPrediction(renamingId, renameValue.trim());
    setRenamingId(null);
  }

  function renderItem({ item, index }: { item: UserPrediction; index: number }) {
    const leagueId = item.leagueId as LeagueId | undefined;
    const leagueConfig = leagueId ? LEAGUE_CONFIGS[leagueId] : null;
    const emoji = leagueId ? LEAGUE_EMOJI[leagueId] : '🏆';
    const primaryColor = leagueConfig?.primaryColor ?? COLORS.primary;
    const displayName = item.name
      || (item.groupId ? item.groupName ?? 'Group Bracket' : 'Personal Bracket');

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => handlePress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.cardAccent, { backgroundColor: primaryColor }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <LeagueLogo leagueId={leagueId ?? 'nba'} size={32} />
            <View style={styles.cardInfo}>
              <Text style={[styles.cardLeague, { color: theme.text }]} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={[styles.cardGroup, { color: theme.textSecondary }]} numberOfLines={1}>
                {leagueConfig?.name ?? 'Unknown League'}{!item.groupId ? ' · Personal' : ''}
              </Text>
              {item.groupId && item.groupName ? (
                <Text style={[styles.cardGroupName, { color: theme.textTertiary }]} numberOfLines={1}>
                  {item.groupName}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => openRename(item)}
              style={styles.renameBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.renameBtnText, { color: theme.textTertiary }]}>Edit</Text>
            </TouchableOpacity>
            {item.locked && (
              <View style={[styles.lockedBadge, { backgroundColor: primaryColor + '22' }]}>
                <Text style={[styles.lockedBadgeText, { color: primaryColor }]}>🔒</Text>
              </View>
            )}
          </View>
          <View style={styles.cardStats}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.text }]}>{item.score}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>pts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.text }]}>{item.correctPicks}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>correct</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {Object.keys(item.predictions).length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>picks</Text>
            </View>
            <Text style={[styles.cardDate, { color: theme.textTertiary }]}>
              {format(new Date(item.updatedAt), 'MMM d')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const totalBrackets = store.allMyPredictions.length;
  const lockedCount = store.allMyPredictions.filter((p) => p.locked).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Brackets</Text>
          {totalBrackets > 0 && (
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {totalBrackets} {totalBrackets === 1 ? 'bracket' : 'brackets'} · {lockedCount} locked
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: COLORS.primary }]}
          onPress={() => router.push('/(tabs)/leagues')}
          activeOpacity={0.85}
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={store.allMyPredictions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="📋"
            title="No brackets yet"
            subtitle="Create a bracket from a league or join a group to get started."
            actionLabel="Browse Leagues"
            onAction={() => router.push('/(tabs)/leagues')}
          />
        }
        refreshControl={
          <RefreshControl refreshing={store.loading} onRefresh={load} tintColor={COLORS.primary} />
        }
        contentContainerStyle={store.allMyPredictions.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Rename modal */}
      <Modal visible={!!renamingId} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Rename Bracket</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
              value={renameValue}
              onChangeText={setRenameValue}
              maxLength={40}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalSecondary, { borderColor: theme.border }]}
                onPress={() => setRenamingId(null)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalSecondaryText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimary, { backgroundColor: COLORS.primary }]}
                onPress={submitRename}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  newBtn: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  newBtnText: {
    color: '#FFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  list: { padding: SPACING.base, gap: SPACING.sm, paddingBottom: SPACING['2xl'] },
  emptyList: { flex: 1 },
  card: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: SPACING.base, gap: SPACING.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  cardEmoji: { width: 32, height: 32 },
  cardInfo: { flex: 1 },
  cardLeague: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },
  cardGroup: { fontSize: FONT_SIZE.sm, marginTop: 1 },
  cardGroupName: { fontSize: FONT_SIZE.xs, marginTop: 1 },
  lockedBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  lockedBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },
  cardStats: { flexDirection: 'row', alignItems: 'center', gap: SPACING.base },
  stat: { alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  statLabel: { fontSize: FONT_SIZE.xs },
  cardDate: { marginLeft: 'auto' as any, fontSize: FONT_SIZE.xs },
  renameBtn: { paddingHorizontal: SPACING.xs },
  renameBtnText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium },
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
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    fontSize: FONT_SIZE.base,
  },
  modalActions: { flexDirection: 'row', gap: SPACING.sm },
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
