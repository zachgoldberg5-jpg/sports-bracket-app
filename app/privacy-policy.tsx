import React from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../constants/theme';

export default function PrivacyPolicyScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: theme.text }]}>Privacy Policy</Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          Last updated: January 1, 2025
        </Text>

        {[
          {
            heading: '1. Information We Collect',
            body: 'We collect information you provide when creating an account (name, email), your bracket predictions, and usage data to improve the app. We use Apple Sign In and Google Sign In for authentication, which may share your name and email with us.'
          },
          {
            heading: '2. How We Use Your Information',
            body: 'We use your information to provide the Sports Bracket service, including displaying your predictions, calculating scores, and sending push notifications about game results and group activity. We do not sell your personal information to third parties.'
          },
          {
            heading: '3. Data Storage',
            body: 'Your data is stored securely using Supabase (PostgreSQL). Push notification tokens are stored to deliver personalized notifications. You can delete your account at any time by contacting support.'
          },
          {
            heading: '4. Push Notifications',
            body: 'With your permission, we send push notifications for game results, leaderboard updates, and pick deadline reminders. You can opt out at any time in your device settings or the app settings.'
          },
          {
            heading: '5. In-App Purchases',
            body: 'Premium subscriptions are processed through Apple App Store or Google Play. We do not store your payment information. Subscription management is handled by Apple/Google.'
          },
          {
            heading: '6. Children\'s Privacy',
            body: 'Sports Bracket is not directed to children under 13. We do not knowingly collect personal information from children under 13.'
          },
          {
            heading: '7. Contact',
            body: 'For privacy questions or to request data deletion, contact us at privacy@sportsbracket.app'
          },
        ].map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={[styles.heading, { color: theme.text }]}>{section.heading}</Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: SPACING.base, paddingBottom: SPACING['3xl'] },
  title: { fontSize: FONT_SIZE['2xl'], fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.xs },
  date: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.xl },
  section: { marginBottom: SPACING.lg },
  heading: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, marginBottom: SPACING.xs },
  body: { fontSize: FONT_SIZE.base, lineHeight: 24 },
});
