import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';

export default function WelcomeScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const signInAsGuest = useAuthStore((s) => s.signInAsGuest);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0D1117' }]}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.emoji}>🏆</Text>
        <Text style={styles.title}>Gold Picks</Text>
        <Text style={styles.appSub}>Sports Brackets</Text>
        <Text style={styles.subtitle}>
          Predict playoff brackets for all major sports leagues.{'\n'}
          Compete with friends. Track your wins.
        </Text>
      </View>

      {/* League emoji row */}
      <View style={styles.leagues}>
        {['🏀', '🏈', '🏒', '⚾', '⚽', '🎓'].map((emoji, i) => (
          <Text key={i} style={styles.leagueEmoji}>{emoji}</Text>
        ))}
      </View>

      {/* Features */}
      <View style={styles.features}>
        {[
          { icon: '📊', text: 'Live brackets for 8+ leagues' },
          { icon: '👥', text: 'Private prediction groups' },
          { icon: '🔔', text: 'Real-time score updates' },
        ].map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      {/* CTAs */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/sign-up')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: 'rgba(255,255,255,0.2)' }]}
          onPress={() => router.push('/(auth)/sign-in')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { signInAsGuest(); router.replace('/(tabs)'); }}
          activeOpacity={0.7}
          style={styles.guestButton}
        >
          <Text style={styles.guestText}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy link */}
      <TouchableOpacity
        onPress={() => router.push('/privacy-policy')}
        style={styles.privacyLink}
      >
        <Text style={styles.privacyText}>Privacy Policy & Terms</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  hero: {
    alignItems: 'center',
    marginTop: SPACING['3xl'],
    marginBottom: SPACING.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.base,
  },
  title: {
    fontSize: FONT_SIZE['4xl'],
    fontWeight: FONT_WEIGHT.extrabold,
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  appSub: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.base,
  },
  subtitle: {
    fontSize: FONT_SIZE.base,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
  },
  leagues: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.base,
    marginBottom: SPACING['2xl'],
  },
  leagueEmoji: {
    fontSize: 28,
  },
  features: {
    gap: SPACING.md,
    marginBottom: SPACING['2xl'],
    paddingHorizontal: SPACING.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIcon: {
    fontSize: 22,
    width: 32,
  },
  featureText: {
    fontSize: FONT_SIZE.base,
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
  },
  actions: {
    gap: SPACING.sm,
    marginTop: 'auto',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  secondaryButton: {
    borderWidth: 1,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  guestText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: FONT_SIZE.sm,
    textDecorationLine: 'underline',
  },
  privacyLink: {
    alignItems: 'center',
    paddingVertical: SPACING.base,
    marginBottom: SPACING.sm,
  },
  privacyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FONT_SIZE.sm,
  },
});
