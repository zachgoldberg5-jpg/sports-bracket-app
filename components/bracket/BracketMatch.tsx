import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';
import type { Match, Team } from '../../types';

const MATCH_WIDTH = 160;
const MATCH_HEIGHT = 96;

interface BracketMatchProps {
  match: Match;
  onPickTeam?: (matchId: string, teamId: string) => void;
  selectedTeamId?: string;
  isLocked?: boolean;
  primaryColor?: string;
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
  const isLive = match.status === 'live';
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
      ? primaryColor + '30'
      : isWinner && !isPredictionMode
      ? COLORS.success + '20'
      : 'transparent';

    const seedEl = team?.seed !== undefined ? (
      <View style={[styles.seedBadge, { backgroundColor: isPicked ? primaryColor + '55' : theme.surfaceAlt }]}>
        <Text style={[styles.seedText, { color: isPicked ? primaryColor : theme.textTertiary }]}>
          {team.seed}
        </Text>
      </View>
    ) : null;

    const logoEl = (
      <View style={styles.logoBox}>
        {team?.logoUrl ? (
          <Image source={{ uri: team.logoUrl }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: isPicked ? primaryColor + '33' : theme.surfaceAlt }]}>
            {team && (
              <Text style={[styles.abbr, { color: isPicked ? primaryColor : theme.textSecondary }]}>
                {team.abbreviation?.substring(0, 3) ?? '?'}
              </Text>
            )}
          </View>
        )}
      </View>
    );

    const nameEl = (
      <Text
        style={[
          styles.teamName,
          { color: team ? theme.text : theme.textTertiary },
          isWinner && !isPredictionMode && { fontWeight: FONT_WEIGHT.bold, color: COLORS.success },
          isPicked && { color: primaryColor, fontWeight: FONT_WEIGHT.semibold },
          !team && { fontStyle: 'italic' },
        ]}
        numberOfLines={1}
      >
        {team?.name ?? 'TBD'}
      </Text>
    );

    const scoreEl = (isFinal || isLive) && score !== undefined ? (
      <Text style={[styles.score, { color: isWinner ? theme.text : theme.textTertiary }, isWinner && { fontWeight: FONT_WEIGHT.bold }]}>
        {score}
      </Text>
    ) : null;

    const pickedWrong = isPicked && isFinal && !isWinner;
    const pickedRight = isPicked && isFinal && isWinner;

    const winEl = isPredictionMode && isPicked ? (
      <View style={[styles.pickDot, { backgroundColor: primaryColor }]} />
    ) : pickedWrong ? (
      <Text style={styles.wrongPick}>✗</Text>
    ) : pickedRight || (isWinner && !isPredictionMode) ? (
      <Text style={styles.winCheck}>✓</Text>
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
            {winEl}
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
            {winEl}
          </>
        )}
      </TouchableOpacity>
    );
  }

  if (isTbd) {
    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} {...{ dataSet: { bracketmatch: '' } }}>
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
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]} {...{ dataSet: { bracketmatch: '' } }}>
      {match.status === 'live' && (
        <View style={[styles.liveBar, { backgroundColor: COLORS.live }]} />
      )}
      <TeamRow team={match.homeTeam} score={match.homeScore} isWinner={homeWon} isPicked={selectedTeamId === match.homeTeam?.id} />
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      <TeamRow team={match.awayTeam} score={match.awayScore} isWinner={awayWon} isPicked={selectedTeamId === match.awayTeam?.id} />
    </View>
  );
}

export { MATCH_WIDTH, MATCH_HEIGHT };

const styles = StyleSheet.create({
  card: {
    width: MATCH_WIDTH,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  liveBar: {
    height: 2,
    width: '100%',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: SPACING.sm,
    gap: 4,
  },
  seedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seedText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.bold,
  },
  logoBox: { width: 32, height: 32 },
  logo: { width: 32, height: 32 },
  logoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abbr: { fontSize: 7, fontWeight: FONT_WEIGHT.bold },
  teamName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
  },
  score: {
    fontSize: FONT_SIZE.sm,
    minWidth: 22,
    textAlign: 'right',
    fontWeight: FONT_WEIGHT.semibold,
  },
  pickDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 2,
  },
  winCheck: {
    fontSize: 11,
    color: COLORS.success,
    marginLeft: 2,
    fontWeight: FONT_WEIGHT.bold,
  },
  wrongPick: {
    fontSize: 11,
    color: '#EF4444',
    marginLeft: 2,
    fontWeight: FONT_WEIGHT.bold,
  },
  divider: { height: StyleSheet.hairlineWidth },
  tbdRow: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tbdText: { fontSize: FONT_SIZE.sm, fontStyle: 'italic' },
});
