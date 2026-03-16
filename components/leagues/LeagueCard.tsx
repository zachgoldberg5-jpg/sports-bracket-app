import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOW, SPACING } from '../../constants/theme';
import { LEAGUE_EMOJI } from '../../constants/leagues';
import { StatusBadge } from './StatusBadge';
import type { League, LeagueId } from '../../types';

interface LeagueCardProps {
  league: League;
  onPress: () => void;
}

export function LeagueCard({ league, onPress }: LeagueCardProps) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const emoji = LEAGUE_EMOJI[league.id as LeagueId] ?? '🏆';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface }, SHADOW.md]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[league.primaryColor + 'BB', league.primaryColor + '00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.iconWrap, { backgroundColor: league.primaryColor + '44' }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {league.name}
        </Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>
          {league.sport} · {league.season}
        </Text>
      </View>
      <View style={styles.right}>
        <StatusBadge status={league.status} compact />
        <Text style={[styles.chevron, { color: theme.textTertiary }]}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    minHeight: 72,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    margin: SPACING.base,
  },
  emoji: { fontSize: 26 },
  content: {
    flex: 1,
    paddingVertical: SPACING.base,
    gap: 3,
  },
  name: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  sub: { fontSize: FONT_SIZE.sm },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: SPACING.sm,
    gap: SPACING.xs,
  },
  chevron: {
    fontSize: 22,
    marginTop: -1,
  },
});
