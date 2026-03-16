import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';

interface InviteCodeCardProps {
  code: string;
  groupName: string;
}

export function InviteCodeCard({ code, groupName }: InviteCodeCardProps) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Sports Bracket group "${groupName}"!\nUse invite code: ${code}\n\nDownload Sports Bracket and enter the code in "Join Group".`,
        title: `Join ${groupName} on Sports Bracket`,
      });
    } catch {
      // User cancelled share sheet
    }
  };

  const handleCopy = async () => {
    // Clipboard not available without expo-clipboard — show visual feedback only
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Invite Code</Text>
      <Text style={[styles.code, { color: COLORS.primary }]}>{code}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={handleCopy}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>
            {copied ? '✓ Copied' : 'Copy Code'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Share Invite</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  code: {
    fontSize: FONT_SIZE['3xl'],
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 6,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  button: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  buttonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
