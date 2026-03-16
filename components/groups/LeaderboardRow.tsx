import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../constants/theme';
import { Avatar } from '../ui/Avatar';
import type { GroupMember } from '../../types';

interface LeaderboardRowProps {
  member: GroupMember;
  isCurrentUser?: boolean;
  showDivider?: boolean;
}

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function LeaderboardRow({ member, isCurrentUser, showDivider = true }: LeaderboardRowProps) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const medal = RANK_MEDALS[member.rank];
  const accuracy = member.totalPicks > 0
    ? Math.round((member.correctPicks / member.totalPicks) * 100)
    : 0;

  return (
    <View
      style={[
        styles.row,
        isCurrentUser && { backgroundColor: COLORS.primary + '11' },
        showDivider && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      {/* Rank */}
      <View style={styles.rankWrap}>
        {medal ? (
          <Text style={styles.medal}>{medal}</Text>
        ) : (
          <Text style={[styles.rankNum, { color: theme.textSecondary }]}>
            {member.rank}
          </Text>
        )}
      </View>

      {/* Avatar */}
      <Avatar
        uri={member.profile.avatarUrl}
        name={member.profile.displayName}
        size={34}
        style={{ marginRight: SPACING.sm }}
      />

      {/* Name + accuracy */}
      <View style={styles.nameWrap}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {member.profile.displayName}
          {isCurrentUser && (
            <Text style={[styles.you, { color: COLORS.primary }]}> (You)</Text>
          )}
        </Text>
        <Text style={[styles.accuracy, { color: theme.textSecondary }]}>
          {member.correctPicks}/{member.totalPicks} correct · {accuracy}%
        </Text>
      </View>

      {/* Champion pick logo */}
      {member.pickedChampionLogo ? (
        <Image
          source={{ uri: member.pickedChampionLogo }}
          style={styles.champLogo}
          resizeMode="contain"
          accessibilityLabel={member.pickedChampionName}
        />
      ) : null}

      {/* Score */}
      <Text style={[styles.score, { color: theme.text }]}>
        {member.score}
        <Text style={[styles.pts, { color: theme.textSecondary }]}> pts</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm + 2,
    minHeight: 56,
  },
  rankWrap: {
    width: 32,
    alignItems: 'center',
  },
  medal: {
    fontSize: 20,
  },
  rankNum: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  nameWrap: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.medium,
  },
  you: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.normal,
  },
  accuracy: {
    fontSize: FONT_SIZE.xs,
    marginTop: 1,
  },
  champLogo: {
    width: 28,
    height: 28,
    marginRight: SPACING.sm,
  },
  score: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  pts: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.normal,
  },
});
