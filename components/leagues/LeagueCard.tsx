import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SHADOW, SPACING } from '../../constants/theme';
import { StatusBadge } from './StatusBadge';
import type { League } from '../../types';

interface LeagueCardProps {
  league: League;
  onPress: () => void;
}

export function LeagueCard({ league, onPress }: LeagueCardProps) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }, SHADOW.sm]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: league.primaryColor }]} />

      {/* League logo placeholder */}
      <View style={[styles.logoContainer, { backgroundColor: league.primaryColor + '22' }]}>
        {league.logoUrl ? (
          <Image source={{ uri: league.logoUrl }} style={styles.logo} resizeMode="contain" />
        ) : (
          <Text style={styles.logoFallback}>{league.name[0]}</Text>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text }]}>{league.name}</Text>
        <Text style={[styles.sport, { color: theme.textSecondary }]}>
          {league.sport} · {league.season}
        </Text>
      </View>

      {/* Status + chevron */}
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
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    margin: SPACING.base,
  },
  logo: {
    width: 32,
    height: 32,
  },
  logoFallback: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingVertical: SPACING.base,
  },
  name: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: 2,
  },
  sport: {
    fontSize: FONT_SIZE.sm,
  },
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
