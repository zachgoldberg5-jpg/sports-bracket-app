import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { Avatar } from '../../../components/ui/Avatar';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOW, SPACING } from '../../../constants/theme';

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const accuracy = profile && profile.totalPredictions > 0
    ? Math.round((profile.totalCorrectPredictions / profile.totalPredictions) * 100)
    : 0;

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile/settings')}>
              <Text style={{ color: COLORS.primary, fontSize: FONT_SIZE.base, paddingRight: SPACING.xs }}>
                Settings
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <Avatar
            uri={profile?.avatarUrl}
            name={profile?.displayName}
            size={80}
          />
          <Text style={[styles.displayName, { color: theme.text }]}>
            {profile?.displayName ?? 'Player'}
          </Text>
          <Text style={[styles.username, { color: theme.textSecondary }]}>
            @{profile?.username}
          </Text>
          {profile?.subscriptionTier === 'premium' && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>👑 Premium</Text>
            </View>
          )}
        </View>

        {/* Stats cards */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total Picks', value: profile?.totalPredictions ?? 0 },
            { label: 'Correct', value: profile?.totalCorrectPredictions ?? 0 },
            { label: 'Accuracy', value: `${accuracy}%` },
          ].map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: theme.surface }, SHADOW.sm]}
            >
              <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu items */}
        <View style={[styles.menu, { backgroundColor: theme.surface }]}>
          {profile?.subscriptionTier === 'free' && (
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => {}}
            >
              <Text style={styles.menuItemEmoji}>👑</Text>
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuItemTitle, { color: COLORS.accent }]}>
                  Upgrade to Premium
                </Text>
                <Text style={[styles.menuItemSubtitle, { color: theme.textSecondary }]}>
                  Unlimited groups, advanced stats
                </Text>
              </View>
              <Text style={[styles.chevron, { color: theme.textTertiary }]}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => router.push('/(tabs)/profile/settings')}
          >
            <Text style={styles.menuItemEmoji}>⚙️</Text>
            <Text style={[styles.menuItemTitle, { color: theme.text }]}>Settings</Text>
            <Text style={[styles.chevron, { color: theme.textTertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => router.push('/privacy-policy')}
          >
            <Text style={styles.menuItemEmoji}>🔒</Text>
            <Text style={[styles.menuItemTitle, { color: theme.text }]}>Privacy Policy</Text>
            <Text style={[styles.chevron, { color: theme.textTertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLast]}
            onPress={handleSignOut}
          >
            <Text style={styles.menuItemEmoji}>🚪</Text>
            <Text style={[styles.menuItemTitle, { color: COLORS.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: SPACING['2xl'] },
  profileHeader: {
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.xs,
  },
  displayName: { fontSize: FONT_SIZE['2xl'], fontWeight: FONT_WEIGHT.bold, marginTop: SPACING.sm },
  username: { fontSize: FONT_SIZE.base },
  premiumBadge: {
    backgroundColor: COLORS.accent + '22',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs,
  },
  premiumText: { color: COLORS.accent, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.base,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: 2,
  },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  statLabel: { fontSize: FONT_SIZE.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  menu: {
    marginHorizontal: SPACING.base,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.md,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  menuItemContent: { flex: 1 },
  menuItemTitle: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.medium },
  menuItemSubtitle: { fontSize: FONT_SIZE.sm, marginTop: 1 },
  chevron: { fontSize: 22 },
});
