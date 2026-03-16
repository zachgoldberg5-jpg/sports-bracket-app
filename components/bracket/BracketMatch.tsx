import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';
import type { Match, Team } from '../../types';

const MATCH_WIDTH = 148;
const MATCH_HEIGHT = 88;

interface BracketMatchProps {
  match: Match;
  /** If provided, this match is a prediction picker and team can be selected */
  onPickTeam?: (matchId: string, teamId: string) => void;
  selectedTeamId?: string;
  isLocked?: boolean;
  primaryColor?: string;
  /** Flip layout for right-side bracket (score/logo on left, name on right) */
  isRightSide?: boolean;
}

export function BracketMatch({
  match,
  onPickTeam,
  selectedTeamId,
  isLocked,
  primaryColor = COLORS.primary,
  isRightSide = false,
}: BracketMatchProps) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const isPredictionMode = !!onPickTeam;
  const isFinal = match.status === 'final';
  const isTbd = !match.homeTeam && !match.awayTeam;

  function TeamRow({ team, score, isWinner, isPicked }: {
    team?: Team;
    score?: number;
    isWinner?: boolean;
    isPicked?: boolean;
  }) {
    const handlePress = () => {
      if (isPredictionMode && team && !isLocked) {
        onPickTeam!(match.id, team.id);
      }
    };

    const bgColor = isPicked
      ? primaryColor + '33'
      : isWinner && !isPredictionMode
      ? COLORS.success + '22'
      : 'transparent';

    const logoEl = (
      <View style={styles.logoBox}>
        {team?.logoUrl ? (
          <Image source={{ uri: team.logoUrl }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: theme.surfaceAlt }]}>
            {team && (
              <Text style={[styles.abbr, { color: theme.textSecondary }]}>
                {team.abbreviation?.substring(0, 3) ?? '?'}
              </Text>
            )}
          </View>
        )}
      </View>
    );

    const seedEl = team?.seed !== undefined ? (
      <Text style={[styles.seed, { color: theme.textTertiary }]}>{team.seed}</Text>
    ) : null;

    const nameEl = (
      <Text
        style={[
          styles.teamName,
          { color: team ? theme.text : theme.textTertiary },
          isWinner && !isPredictionMode && { fontWeight: FONT_WEIGHT.bold },
          isPicked && { color: primaryColor, fontWeight: FONT_WEIGHT.semibold },
        ]}
        numberOfLines={1}
      >
        {team?.name ?? 'TBD'}
      </Text>
    );

    const scoreEl = isFinal && score !== undefined ? (
      <Text
        style={[
          styles.score,
          { color: isWinner ? theme.text : theme.textSecondary },
          isWinner && { fontWeight: FONT_WEIGHT.bold },
        ]}
      >
        {score}
      </Text>
    ) : null;

    const pickDotEl = isPredictionMode && isPicked ? (
      <Text style={[styles.pickDot, { color: primaryColor }]}>●</Text>
    ) : null;

    return (
      <TouchableOpacity
        style={[styles.teamRow, { backgroundColor: bgColor }]}
        onPress={handlePress}
        disabled={!isPredictionMode || isLocked || !team}
        activeOpacity={0.7}
      >
        {isRightSide ? (
          <>
            {pickDotEl}
            {scoreEl}
            {nameEl}
            {seedEl}
            {logoEl}
          </>
        ) : (
          <>
            {logoEl}
            {seedEl}
            {nameEl}
            {scoreEl}
            {pickDotEl}
          </>
        )}
      </TouchableOpacity>
    );
  }

  if (isTbd) {
    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.tbdRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.tbdText, { color: theme.textTertiary }]}>TBD</Text>
        </View>
        <View style={styles.tbdRow}>
          <Text style={[styles.tbdText, { color: theme.textTertiary }]}>TBD</Text>
        </View>
      </View>
    );
  }

  const homeWon = isFinal && match.winnerId === match.homeTeam?.id;
  const awayWon = isFinal && match.winnerId === match.awayTeam?.id;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TeamRow
        team={match.homeTeam}
        score={match.homeScore}
        isWinner={homeWon}
        isPicked={selectedTeamId === match.homeTeam?.id}
      />
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      <TeamRow
        team={match.awayTeam}
        score={match.awayScore}
        isWinner={awayWon}
        isPicked={selectedTeamId === match.awayTeam?.id}
      />
    </View>
  );
}

export { MATCH_WIDTH, MATCH_HEIGHT };

const styles = StyleSheet.create({
  card: {
    width: MATCH_WIDTH,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: SPACING.sm,
    gap: 4,
  },
  logoBox: {
    width: 22,
    height: 22,
  },
  logo: {
    width: 22,
    height: 22,
  },
  logoPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abbr: {
    fontSize: 7,
    fontWeight: FONT_WEIGHT.bold,
  },
  seed: {
    fontSize: 10,
    width: 14,
    textAlign: 'center',
  },
  teamName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
  },
  score: {
    fontSize: FONT_SIZE.sm,
    minWidth: 20,
    textAlign: 'right',
  },
  pickDot: {
    fontSize: 8,
    marginLeft: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  tbdRow: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tbdText: {
    fontSize: FONT_SIZE.sm,
    fontStyle: 'italic',
  },
});
