import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../constants/theme';
import { BracketMatch, MATCH_WIDTH, MATCH_HEIGHT } from './BracketMatch';
import type { BracketRound as BracketRoundType, PredictionMap } from '../../types';

// Vertical spacing between matches in the same round
const MATCH_GAP = 24;
const CONNECTOR_WIDTH = 20;

interface BracketRoundProps {
  round: BracketRoundType;
  isFirst: boolean;
  predictions?: PredictionMap;
  onPickTeam?: (matchId: string, teamId: string) => void;
  isLocked?: boolean;
  primaryColor?: string;
}

export function BracketRoundColumn({
  round,
  isFirst,
  predictions = {},
  onPickTeam,
  isLocked,
  primaryColor,
}: BracketRoundProps) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  // Calculate vertical position for each match
  // In a proper bracket, spacing doubles each round
  const matchSpacing = MATCH_HEIGHT + MATCH_GAP;
  const roundMultiplier = Math.pow(2, round.roundNumber - 1);
  const totalHeight = round.matches.length * matchSpacing * roundMultiplier;

  return (
    <View style={styles.column}>
      {/* Round label */}
      <Text style={[styles.roundLabel, { color: theme.textSecondary }]}>
        {round.label}
      </Text>

      {/* Matches */}
      <View style={[styles.matchesArea, { height: Math.max(totalHeight, round.matches.length * (MATCH_HEIGHT + MATCH_GAP)) }]}>
        {round.matches.map((match, idx) => {
          const vertOffset = idx * (MATCH_HEIGHT + MATCH_GAP) * roundMultiplier +
            ((MATCH_HEIGHT + MATCH_GAP) * roundMultiplier - MATCH_HEIGHT) / 2;

          return (
            <View
              key={match.id}
              style={[styles.matchWrapper, { top: vertOffset }]}
            >
              <BracketMatch
                match={match}
                onPickTeam={onPickTeam}
                selectedTeamId={predictions[match.id]}
                isLocked={isLocked}
                primaryColor={primaryColor}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: MATCH_WIDTH + CONNECTOR_WIDTH,
    paddingRight: CONNECTOR_WIDTH,
  },
  roundLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    paddingRight: CONNECTOR_WIDTH,
  },
  matchesArea: {
    position: 'relative',
  },
  matchWrapper: {
    position: 'absolute',
    left: 0,
  },
});
