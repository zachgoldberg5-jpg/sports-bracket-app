import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';
import type { Team } from '../../types';

interface ChampionDisplayProps {
  champion: Team;
  leagueName: string;
  season: string;
  primaryColor?: string;
}

export function ChampionDisplay({ champion, leagueName, season, primaryColor = COLORS.accent }: ChampionDisplayProps) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 100 }));
    opacity.value = withDelay(200, withSpring(1));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <View style={[styles.badge, { backgroundColor: primaryColor + '22', borderColor: primaryColor + '44' }]}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={[styles.championLabel, { color: primaryColor }]}>
          {season} {leagueName} Champion
        </Text>

        {champion.logoUrl ? (
          <Image source={{ uri: champion.logoUrl }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: primaryColor + '33' }]}>
            <Text style={[styles.teamAbbr, { color: primaryColor }]}>
              {champion.abbreviation}
            </Text>
          </View>
        )}

        <Text style={[styles.teamName, { color: theme.text }]}>{champion.name}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  badge: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    gap: SPACING.sm,
    minWidth: 200,
  },
  trophy: {
    fontSize: 48,
  },
  championLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  logo: {
    width: 80,
    height: 80,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamAbbr: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
  },
  teamName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
  },
});
