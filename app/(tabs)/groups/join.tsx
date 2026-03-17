import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useGroupStore } from '../../../store/groupStore';
import { useAuthStore } from '../../../store/authStore';
import { PremiumGate } from '../../../components/ui/PremiumGate';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../../constants/theme';

export default function JoinGroupScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  const groupStore = useGroupStore();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const { code: codeParam } = useLocalSearchParams<{ code?: string }>();

  React.useEffect(() => {
    if (codeParam) setInviteCode(codeParam.toUpperCase());
  }, [codeParam]);

  function showAlert(title: string, message: string) {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  }

  async function handleJoin() {
    if (inviteCode.trim().length < 6) {
      showAlert('Invalid code', 'Please enter a valid 8-character invite code.');
      return;
    }
    if (!user) return;

    // Check free tier limit
    if (profile?.subscriptionTier === 'free' && groupStore.groups.length >= 2) {
      setShowPremiumGate(true);
      return;
    }

    setLoading(true);
    const group = await groupStore.joinGroup(inviteCode.trim().toUpperCase(), user.id);
    setLoading(false);

    if (group) {
      router.replace(`/groups/${group.id}`);
    } else {
      showAlert('Group not found', 'That invite code is invalid or the group no longer exists.');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen options={{ title: 'Join Group', headerShown: true }} />

      <View style={styles.content}>
        <Text style={styles.emoji}>🔑</Text>
        <Text style={[styles.title, { color: theme.text }]}>Enter Invite Code</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Ask a friend for their group's 8-character invite code.
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
          placeholder="ABCD1234"
          placeholderTextColor={theme.textTertiary}
          value={inviteCode}
          onChangeText={(t) => setInviteCode(t.toUpperCase())}
          autoCapitalize="characters"
          maxLength={8}
          textAlign="center"
          autoFocus
        />

        <TouchableOpacity
          style={[styles.joinButton, loading && { opacity: 0.6 }, (!inviteCode || inviteCode.length < 6) && { opacity: 0.4 }]}
          onPress={handleJoin}
          disabled={loading || inviteCode.length < 6}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.joinButtonText}>Join Group</Text>
          )}
        </TouchableOpacity>
      </View>

      <PremiumGate
        visible={showPremiumGate}
        onClose={() => setShowPremiumGate(false)}
        feature="joining more groups"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: SPACING.xl, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  emoji: { fontSize: 52 },
  title: { fontSize: FONT_SIZE['2xl'], fontWeight: FONT_WEIGHT.bold, textAlign: 'center' },
  subtitle: { fontSize: FONT_SIZE.base, textAlign: 'center', lineHeight: 22 },
  input: {
    width: '100%',
    height: 64,
    borderWidth: 2,
    borderRadius: RADIUS.lg,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 8,
    marginTop: SPACING.sm,
  },
  joinButton: {
    width: '100%',
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: { color: '#FFF', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
});
