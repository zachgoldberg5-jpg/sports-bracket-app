import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';

export default function SignUpScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);

  async function handleSignUp() {
    if (!displayName.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const error = await signUpWithEmail(email.trim().toLowerCase(), password, displayName.trim());
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error);
    } else if (!supabaseConfigured) {
      // Demo mode — account created locally, go straight to app
      router.replace('/(tabs)');
    } else {
      Alert.alert(
        'Verify your email',
        'We sent you a confirmation email. Click the link to activate your account.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
      );
    }
  }

  async function handleAppleSignIn() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      });

      if (error) {
        Alert.alert('Apple Sign In failed', error.message);
        return;
      }

      router.replace('/(tabs)');
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== 'ERR_CANCELED') {
        Alert.alert('Apple Sign In failed', 'An unexpected error occurred.');
      }
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={[styles.backText, { color: COLORS.primary }]}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.text }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Start making bracket predictions
        </Text>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
            placeholder="Display name"
            placeholderTextColor={theme.textTertiary}
            value={displayName}
            onChangeText={setDisplayName}
            autoComplete="name"
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
            placeholder="Email"
            placeholderTextColor={theme.textTertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
            placeholder="Password (8+ characters)"
            placeholderTextColor={theme.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <Text style={[styles.terms, { color: theme.textTertiary }]}>
            By creating an account you agree to our{' '}
            <Text
              style={{ color: COLORS.primary }}
              onPress={() => router.push('/privacy-policy')}
            >
              Privacy Policy & Terms
            </Text>
            .
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabled]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textTertiary }]}>or</Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
        </View>

        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
            buttonStyle={
              scheme === 'dark'
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={RADIUS.full}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        )}

        <View style={styles.signinRow}>
          <Text style={[styles.signinText, { color: theme.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
            <Text style={[styles.signinLink, { color: COLORS.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: SPACING.xl },
  back: { marginBottom: SPACING.lg },
  backText: { fontSize: FONT_SIZE.base },
  title: { fontSize: FONT_SIZE['3xl'], fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONT_SIZE.base, marginBottom: SPACING.xl },
  form: { gap: SPACING.sm },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    fontSize: FONT_SIZE.base,
  },
  terms: { fontSize: FONT_SIZE.xs, lineHeight: 18, marginTop: SPACING.xs },
  primaryButton: {
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  disabled: { opacity: 0.6 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.xl, gap: SPACING.sm },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: FONT_SIZE.sm },
  appleButton: { height: 50 },
  signinRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  signinText: { fontSize: FONT_SIZE.base },
  signinLink: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },
});
