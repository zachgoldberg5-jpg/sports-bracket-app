import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';

interface InviteCodeCardProps {
  code: string;
  groupName: string;
  onRefresh?: () => Promise<void>;
}

export function InviteCodeCard({ code, groupName, onRefresh }: InviteCodeCardProps) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const getInviteLink = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const match = window.location.pathname.match(/^(.*?)\/(?:groups|leagues|profile|leaderboard|welcome|sign)/);
      const basePath = match ? match[1] : '';
      return `${window.location.origin}${basePath}/groups/join?code=${code}`;
    }
    return null;
  };

  const handleShare = async () => {
    const link = getInviteLink();
    try {
      await Share.share({
        message: `Join my Sports Bracket group "${groupName}"!\nUse invite code: ${code}${link ? `\n\nOr tap: ${link}` : '\n\nDownload Sports Bracket and enter the code in "Join Group".'}`,
        title: `Join ${groupName} on Sports Bracket`,
      });
    } catch {
      // User cancelled share sheet
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    const link = getInviteLink() ?? `Invite code: ${code}`;
    await Clipboard.setStringAsync(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Invite Code</Text>
        {onRefresh && (
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing} hitSlop={8}>
            {refreshing
              ? <ActivityIndicator size="small" color={COLORS.primary} />
              : <Text style={[styles.refreshText, { color: COLORS.primary }]}>Refresh</Text>}
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.code, { color: COLORS.primary }]}>{code}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={handleCopyCode}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>
            {codeCopied ? '✓ Copied' : 'Copy Code'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={handleCopyLink}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>
            {linkCopied ? '✓ Link Copied' : 'Copy Link'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton, styles.shareFullWidth]}
        onPress={handleShare}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Share Invite</Text>
      </TouchableOpacity>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  refreshText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
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
  shareFullWidth: {
    width: '100%',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
