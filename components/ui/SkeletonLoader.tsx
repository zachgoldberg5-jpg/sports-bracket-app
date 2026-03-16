import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBlock({ width = '100%', height = 16, borderRadius = RADIUS.sm, style }: SkeletonProps) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.4, 0.9]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as ViewStyle['width'],
          height,
          borderRadius,
          backgroundColor: theme.skeleton,
        },
        animStyle,
        style,
      ]}
    />
  );
}

export function LeagueCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBlock width={40} height={40} borderRadius={RADIUS.full} />
      <View style={styles.cardContent}>
        <SkeletonBlock width="60%" height={14} style={{ marginBottom: 6 }} />
        <SkeletonBlock width="40%" height={11} />
      </View>
      <SkeletonBlock width={60} height={22} borderRadius={RADIUS.full} />
    </View>
  );
}

export function BracketMatchSkeleton() {
  return (
    <View style={styles.matchCard}>
      <SkeletonBlock height={44} borderRadius={RADIUS.md} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  cardContent: {
    flex: 1,
  },
  matchCard: {
    width: 140,
    padding: 4,
  },
});
