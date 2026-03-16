import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../constants/theme';
import type { StandingsEntry } from '../../types';

interface StandingsRowProps {
  entry: StandingsEntry;
  showDivider?: boolean;
  highlightPlayoffLine?: boolean;
}

export function StandingsRow({ entry, showDivider = true, highlightPlayoffLine = false }: StandingsRowProps) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const record = entry.ties != null
    ? `${entry.wins}-${entry.losses}-${entry.ties}`
    : `${entry.wins}-${entry.losses}`;

  return (
    <>
      {highlightPlayoffLine && (
        <View style={[styles.playoffLine, { backgroundColor: COLORS.primary }]} />
      )}
      <View style={[styles.row, showDivider && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        {/* Rank */}
        <Text style={[styles.rank, { color: theme.textSecondary }]}>{entry.rank}</Text>

        {/* Team logo */}
        <View style={styles.logoWrap}>
          {entry.team.logoUrl ? (
            <Image source={{ uri: entry.team.logoUrl }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: theme.surfaceAlt }]}>
              <Text style={[styles.abbr, { color: theme.textSecondary }]}>
                {entry.team.abbreviation}
              </Text>
            </View>
          )}
        </View>

        {/* Team name */}
        <View style={styles.nameWrap}>
          <Text style={[styles.teamName, { color: theme.text }]} numberOfLines={1}>
            {entry.team.name}
          </Text>
        </View>

        {/* Stats */}
        <Text style={[styles.stat, { color: theme.text }]}>{record}</Text>
        {entry.winPct !== undefined && (
          <Text style={[styles.stat, styles.statNarrow, { color: theme.textSecondary }]}>
            {entry.winPct.toFixed(3).replace(/^0/, '')}
          </Text>
        )}
        {entry.gamesBack !== undefined && (
          <Text style={[styles.stat, styles.statNarrow, { color: theme.textSecondary }]}>
            {entry.gamesBack === 0 ? '—' : entry.gamesBack}
          </Text>
        )}
        {entry.points !== undefined && (
          <Text style={[styles.stat, styles.statNarrow, { color: theme.text, fontWeight: FONT_WEIGHT.semibold }]}>
            {entry.points}
          </Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm + 2,
    minHeight: 44,
  },
  rank: {
    width: 24,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  logoWrap: {
    width: 30,
    height: 30,
    marginHorizontal: SPACING.sm,
  },
  logo: {
    width: 30,
    height: 30,
  },
  logoPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abbr: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.bold,
  },
  nameWrap: {
    flex: 1,
  },
  teamName: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.medium,
  },
  stat: {
    fontSize: FONT_SIZE.sm,
    width: 52,
    textAlign: 'right',
  },
  statNarrow: {
    width: 42,
  },
  playoffLine: {
    height: 2,
    marginHorizontal: SPACING.base,
  },
});
