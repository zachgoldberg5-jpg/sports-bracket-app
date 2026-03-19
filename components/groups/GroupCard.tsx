import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOW, SPACING } from '../../constants/theme';
import { LEAGUE_CONFIGS } from '../../constants/leagues';
import type { Group } from '../../types';
import { formatDistanceToNow, isPast } from 'date-fns';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const config = LEAGUE_CONFIGS[group.leagueId];
  const deadline = group.pickDeadline ? new Date(group.pickDeadline) : null;
  const deadlinePast = deadline ? isPast(deadline) : false;

  const deadlineText = !deadline
    ? 'No deadline'
    : deadlinePast
    ? 'Picks locked'
    : `Picks due ${formatDistanceToNow(deadline, { addSuffix: true })}`;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }, SHADOW.sm]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={[styles.leagueTag, { backgroundColor: config.primaryColor + '22' }]}>
          <Text style={[styles.leagueTagText, { color: config.primaryColor }]}>
            {config.name}
          </Text>
        </View>
        {group.userRank && (
          <Text style={[styles.rank, { color: theme.textSecondary }]}>
            #{group.userRank}
          </Text>
        )}
      </View>

      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {group.name}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: theme.textSecondary }]}>
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          </Text>
          <Text style={[styles.dot, { color: theme.textTertiary }]}>·</Text>
          <Text
            style={[
              styles.metaText,
              { color: deadlinePast ? COLORS.completed : COLORS.upcoming },
            ]}
          >
            {deadlineText}
          </Text>
        </View>
      </View>

      {group.userScore !== undefined && (
        <View style={[styles.score, { borderTopColor: theme.border }]}>
          <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Your score</Text>
          <Text style={[styles.scoreValue, { color: theme.text }]}>
            {group.userScore} pts
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leagueTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  leagueTagText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  rank: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  body: {
    padding: SPACING.md,
    gap: 4,
  },
  name: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    fontSize: FONT_SIZE.sm,
  },
  dot: {
    fontSize: FONT_SIZE.sm,
  },
  score: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  scoreLabel: {
    fontSize: FONT_SIZE.sm,
  },
  scoreValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
});
