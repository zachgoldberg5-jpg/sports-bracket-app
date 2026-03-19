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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const { registered, inviteCode } = useLocalSearchParams<{ registered?: string; inviteCode?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);

  async function handleEmailSignIn() {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const error = await signInWithEmail(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) {
      if (error.toLowerCase().includes('email not confirmed')) {
        setErrorMsg('Please confirm your email first — check your inbox for a confirmation link.');
      } else if (error.toLowerCase().includes('invalid login') || error.toLowerCase().includes('invalid credentials')) {
        setErrorMsg('Incorrect email or password.');
      } else {
        setErrorMsg(error);
      }
    } else if (inviteCode) {
      router.replace(`/(tabs)/groups/join?code=${inviteCode}`);
    } else {
      router.replace('/(tabs)');
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

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      });

      if (error) {
        setErrorMsg('Apple Sign In failed: ' + error.message);
        return;
      }

      // Save display name from Apple (only available first sign-in)
      if (credential.fullName?.givenName) {
        const fullName = [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean)
          .join(' ');
        await supabase
          .from('profiles')
          .update({ display_name: fullName })
          .eq('id', data.user?.id ?? '');
      }

      router.replace('/(tabs)');
    } catch (err: unknown) {
      if ((err as { code?: string }).code !== 'ERR_CANCELED') {
        setErrorMsg('Apple Sign In failed. Please try again.');
      }
    }
  }

  async function handleGoogleSignIn() {
    const redirectUrl = makeRedirectUri({ scheme: 'sportsbracket' });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      setErrorMsg(error?.message ?? 'Could not start Google sign in.');
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === 'success') {
      const { url } = result;
      await supabase.auth.exchangeCodeForSession(url);
      if (inviteCode) {
        router.replace(`/(tabs)/groups/join?code=${inviteCode}`);
      } else {
        router.replace('/(tabs)');
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

        {registered ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>Account created! Sign in below.</Text>
          </View>
        ) : null}

        <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Sign in to your account
        </Text>

        {/* Email / Password */}
        <View style={styles.form}>
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
            placeholder="Password"
            placeholderTextColor={theme.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotWrap}
          >
            <Text style={[styles.forgotText, { color: COLORS.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabled]}
            onPress={handleEmailSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textTertiary }]}>or</Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
        </View>

        {/* Social sign in */}
        <View style={styles.social}>
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
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

          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={[styles.googleText, { color: theme.text }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign up link */}
        <View style={styles.signupRow}>
          <Text style={[styles.signupText, { color: theme.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace(inviteCode ? `/(auth)/sign-up?inviteCode=${inviteCode}` : '/(auth)/sign-up')}>
            <Text style={[styles.signupLink, { color: COLORS.primary }]}>Sign Up</Text>
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
  successBanner: {
    backgroundColor: '#166534',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  successBannerText: { color: '#86EFAC', fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, textAlign: 'center' },
  errorText: { fontSize: FONT_SIZE.sm, color: '#EF4444', marginTop: SPACING.xs },
  forgotWrap: { alignSelf: 'flex-end' },
  forgotText: { fontSize: FONT_SIZE.sm },
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
  social: { gap: SPACING.sm },
  appleButton: { height: 50 },
  googleButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  googleIcon: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: '#4285F4' },
  googleText: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.medium },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  signupText: { fontSize: FONT_SIZE.base },
  signupLink: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },
});
