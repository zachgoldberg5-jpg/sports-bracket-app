import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';
import type { LeagueStatus } from '../../types';

const STATUS_CONFIG: Record<LeagueStatus, { label: string; color: string; dot: boolean }> = {
  live: { label: 'Live', color: COLORS.live, dot: true },
  upcoming: { label: 'Upcoming', color: COLORS.upcoming, dot: false },
  completed: { label: 'Completed', color: COLORS.completed, dot: false },
  off_season: { label: 'Off Season', color: COLORS.off_season, dot: false },
};

interface StatusBadgeProps {
  status: LeagueStatus;
  compact?: boolean;
}

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    if (status === 'live') {
      opacity.value = withRepeat(withTiming(0.3, { duration: 800 }), -1, true);
    }
  }, [status]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.color + '22' },
        compact && styles.compact,
      ]}
    >
      {config.dot && (
        <Animated.View
          style={[styles.dot, { backgroundColor: config.color }, dotStyle]}
        />
      )}
      <Text
        style={[
          styles.label,
          { color: config.color },
          compact && styles.labelCompact,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  compact: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  labelCompact: {
    fontSize: FONT_SIZE.xs,
  },
});
