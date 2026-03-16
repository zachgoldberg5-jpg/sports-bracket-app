import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useGroupStore } from '../../../store/groupStore';
import { useAuthStore } from '../../../store/authStore';
import { useLeagues } from '../../../hooks/useLeague';
import { useLeagueStore } from '../../../store/leagueStore';
import { PremiumGate } from '../../../components/ui/PremiumGate';
import { LEAGUE_CONFIGS } from '../../../constants/leagues';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../../constants/theme';
import { format, addDays } from 'date-fns';
import type { LeagueId } from '../../../types';

export default function CreateGroupScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const { leagues } = useLeagues();
  const leagueStore = useLeagueStore();
  const groupStore = useGroupStore();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [groupName, setGroupName] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<LeagueId | null>(null);
  const [deadline, setDeadline] = useState(addDays(new Date(), 7));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  const activeLeagues = leagues.filter((l) => l.status === 'live' || l.status === 'upcoming');

  async function handleCreate() {
    if (!groupName.trim()) {
      Alert.alert('Name required', 'Please give your group a name.');
      return;
    }
    if (!selectedLeague) {
      Alert.alert('League required', 'Please select a league for this group.');
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
    try {
      // Get or create the bracket for this league
      await leagueStore.loadBracket(selectedLeague);
      const bracket = leagueStore.brackets[selectedLeague];

      if (!bracket) {
        Alert.alert('Error', 'Could not load bracket for this league. Try again.');
        return;
      }

      const group = await groupStore.createGroup(
        groupName.trim(),
        selectedLeague,
        bracket.id,
        deadline,
        user.id
      );

      if (group) {
        router.replace(`/(tabs)/groups/${group.id}`);
      } else {
        Alert.alert('Error', 'Failed to create group. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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
          {activeLeagues.map((league) => {
            const selected = selectedLeague === league.id;
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
                <Text style={styles.leagueEmoji}>
                  {league.sport === 'Basketball' ? '🏀' :
                   league.sport === 'Football' ? '🏈' :
                   league.sport === 'Hockey' ? '🏒' :
                   league.sport === 'Baseball' ? '⚾' : '⚽'}
                </Text>
                <Text style={[styles.leagueName, { color: selected ? league.primaryColor : theme.text }]}>
                  {LEAGUE_CONFIGS[league.id].name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeLeagues.length === 0 && (
          <Text style={[styles.noLeagues, { color: theme.textSecondary }]}>
            No active leagues right now. Check back when playoffs start.
          </Text>
        )}

        {/* Pick deadline */}
        <Text style={[styles.label, { color: theme.textSecondary }]}>Pick Deadline</Text>
        <TouchableOpacity
          style={[styles.dateButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.dateText, { color: theme.text }]}>
            📅 {format(deadline, 'MMM d, yyyy · h:mm a')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.hint, { color: theme.textTertiary }]}>
          Members must submit their picks before this time. After the deadline, picks are locked.
        </Text>

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

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="datetime"
        date={deadline}
        minimumDate={new Date()}
        onConfirm={(date) => {
          setDeadline(date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

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
  noLeagues: { fontSize: FONT_SIZE.base, textAlign: 'center', marginVertical: SPACING.xl },
  dateButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    justifyContent: 'center',
  },
  dateText: { fontSize: FONT_SIZE.base },
  hint: { fontSize: FONT_SIZE.xs, lineHeight: 18 },
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
});
