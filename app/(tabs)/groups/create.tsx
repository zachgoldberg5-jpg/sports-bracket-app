import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useGroupStore } from '../../../store/groupStore';
import { useAuthStore } from '../../../store/authStore';
import { useLeagues } from '../../../hooks/useLeague';
import { PremiumGate } from '../../../components/ui/PremiumGate';
import { LEAGUE_CONFIGS, LEAGUE_EMOJI } from '../../../constants/leagues';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../../constants/theme';
import { format, addDays } from 'date-fns';
import type { Group, LeagueId } from '../../../types';

export default function CreateGroupScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const { leagues } = useLeagues();
  const groupStore = useGroupStore();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [groupName, setGroupName] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<LeagueId | null>(null);
  const [deadline, setDeadline] = useState(addDays(new Date(), 7));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  async function handleCreate() {
    setErrorMsg('');
    if (!groupName.trim()) {
      setErrorMsg('Please give your group a name.');
      return;
    }
    if (!selectedLeague) {
      setErrorMsg('Please select a league for this group.');
      return;
    }
    if (!user) return;

    // Check free tier limit
    const groups = groupStore.groups;
    if (profile?.subscriptionTier === 'free' && groups.length >= 2) {
      setShowPremiumGate(true);
      return;
    }

    setLoading(true);
    const group = await groupStore.createGroup(
      groupName.trim(),
      selectedLeague,
      selectedLeague,
      deadline,
      user.id
    );
    setLoading(false);

    if (group) {
      setCreatedGroup(group);
    } else {
      setErrorMsg(groupStore.lastError ?? 'Failed to create group. Please try again.');
    }
  }

  async function handleCopyCode() {
    if (!createdGroup) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(createdGroup.inviteCode);
      }
    } catch { /* ignore */ }
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  async function handleCopyLink() {
    if (!createdGroup) return;
    const link = Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname.replace(/\/(tabs).*$/, '')}/(tabs)/groups/join?code=${createdGroup.inviteCode}`
      : `Join code: ${createdGroup.inviteCode}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
      }
    } catch { /* ignore */ }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function handleShare() {
    if (!createdGroup) return;
    const link = Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname.replace(/\/(tabs).*$/, '')}/(tabs)/groups/join?code=${createdGroup.inviteCode}`
      : '';
    try {
      await Share.share({
        message: `Join my Sports Bracket group "${createdGroup.name}"!\nUse invite code: ${createdGroup.inviteCode}${link ? `\n\nOr tap this link: ${link}` : ''}`,
        title: `Join ${createdGroup.name} on Sports Bracket`,
      });
    } catch { /* cancelled */ }
  }

  if (createdGroup) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <Stack.Screen options={{ title: 'Group Created!', headerShown: true }} />
        <ScrollView contentContainerStyle={[styles.scroll, styles.successScroll]}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={[styles.successTitle, { color: theme.text }]}>Group Created!</Text>
          <Text style={[styles.successSubtitle, { color: theme.textSecondary }]}>{createdGroup.name}</Text>

          <View style={[styles.codeBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <Text style={[styles.codeLabel, { color: theme.textSecondary }]}>Invite Code</Text>
            <Text style={[styles.codeValue, { color: COLORS.primary }]}>{createdGroup.inviteCode}</Text>
            <Text style={[styles.codeHint, { color: theme.textTertiary }]}>
              Share this code with friends so they can join your group.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            onPress={handleCopyCode}
            activeOpacity={0.8}
          >
            <Text style={[styles.shareBtnText, { color: theme.text }]}>
              {codeCopied ? '✓ Code Copied!' : 'Copy Invite Code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            onPress={handleCopyLink}
            activeOpacity={0.8}
          >
            <Text style={[styles.shareBtnText, { color: theme.text }]}>
              {linkCopied ? '✓ Link Copied!' : 'Copy Invite Link'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createButton, { marginTop: SPACING.xs }]}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Text style={styles.createButtonText}>Share with Friends</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.goToGroupBtn}
            onPress={() => router.replace(`/(tabs)/groups/${createdGroup.id}`)}
            activeOpacity={0.8}
          >
            <Text style={[styles.goToGroupText, { color: theme.textSecondary }]}>Go to Group →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen options={{ title: 'Create Group', headerShown: true }} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Group name */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>Group Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
          placeholder="e.g. Office Bracket 2025"
          placeholderTextColor={theme.textTertiary}
          value={groupName}
          onChangeText={setGroupName}
          maxLength={50}
        />

        {/* League selection */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>Select League</Text>
        <View style={styles.leagueGrid}>
          {leagues.map((league) => {
            const selected = selectedLeague === league.id;
            const isActive = league.status === 'live' || league.status === 'upcoming';
            return (
              <TouchableOpacity
                key={league.id}
                style={[
                  styles.leagueOption,
                  { borderColor: selected ? league.primaryColor : theme.border },
                  selected && { backgroundColor: league.primaryColor + '22' },
                ]}
                onPress={() => setSelectedLeague(league.id)}
              >
                <Text style={styles.leagueEmoji}>{LEAGUE_EMOJI[league.id]}</Text>
                <View>
                  <Text style={[styles.leagueName, { color: selected ? league.primaryColor : theme.text }]}>
                    {LEAGUE_CONFIGS[league.id].name}
                  </Text>
                  {isActive && (
                    <Text style={[styles.leagueLive, { color: league.primaryColor }]}>● Live</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pick deadline */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>Pick Deadline</Text>
        {Platform.OS === 'web' ? (
          <View style={[styles.dateButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            {/* @ts-ignore – web-only input */}
            <input
              type="datetime-local"
              value={format(deadline, "yyyy-MM-dd'T'HH:mm")}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.value) setDeadline(new Date(e.target.value));
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.text,
                fontSize: 16,
                width: '100%',
                height: 48,
                outline: 'none',
                cursor: 'pointer',
                padding: '0 4px',
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
              📅 {format(deadline, 'MMM d, yyyy · h:mm a')}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.hint, { color: theme.textTertiary }]}>
          Members must submit their picks before this time. After the deadline, picks are locked.
        </Text>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        {/* Create button */}
        <TouchableOpacity
          style={[styles.createButton, loading && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.createButtonText}>Create Group</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {Platform.OS !== 'web' && (() => {
        const DateTimePickerModal = require('react-native-modal-datetime-picker').default;
        return (
          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="datetime"
            date={deadline}
            minimumDate={new Date()}
            onConfirm={(date: Date) => { setDeadline(date); setShowDatePicker(false); }}
            onCancel={() => setShowDatePicker(false)}
          />
        );
      })()}

      <PremiumGate
        visible={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        feature="unlimited prediction groups"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: SPACING.base, gap: SPACING.sm },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    fontSize: FONT_SIZE.base,
  },
  leagueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  leagueOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  leagueEmoji: { fontSize: 18 },
  leagueName: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },
  leagueLive: { fontSize: 10, fontWeight: FONT_WEIGHT.bold, marginTop: 1 },
  dateButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    justifyContent: 'center',
  },
  dateText: { fontSize: FONT_SIZE.base },
  hint: { fontSize: FONT_SIZE.xs, lineHeight: 18 },
  errorText: { fontSize: FONT_SIZE.sm, color: '#EF4444', textAlign: 'center', marginTop: SPACING.xs },
  createButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  // Success screen styles
  successScroll: { alignItems: 'center', paddingTop: SPACING['2xl'] },
  successEmoji: { fontSize: 64 },
  successTitle: { fontSize: FONT_SIZE['2xl'], fontWeight: FONT_WEIGHT.bold, marginTop: SPACING.md },
  successSubtitle: { fontSize: FONT_SIZE.base, marginTop: SPACING.xs, marginBottom: SPACING.xl },
  codeBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  codeLabel: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  codeValue: { fontSize: FONT_SIZE['3xl'], fontWeight: FONT_WEIGHT.bold, letterSpacing: 6 },
  codeHint: { fontSize: FONT_SIZE.xs, textAlign: 'center', lineHeight: 16 },
  shareBtn: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  shareBtnText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  goToGroupBtn: { marginTop: SPACING.lg, paddingVertical: SPACING.sm },
  goToGroupText: { fontSize: FONT_SIZE.sm },
});
