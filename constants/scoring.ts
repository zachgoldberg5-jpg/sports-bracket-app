import type { ScoringRules } from '../types';

export const DEFAULT_SCORING_RULES: ScoringRules = {
  // Points double each round: Round 1=1, R2=2, R3=4, R4=8, Semis=16, Final=32
  pointsPerRound: [1, 2, 4, 8, 16, 32],
  upsetBonus: 1, // extra point for correctly picking a higher seed to win
  perfectBracketBonus: 100,
};

// March Madness has more rounds
export const NCAA_SCORING_RULES: ScoringRules = {
  pointsPerRound: [1, 2, 4, 8, 16, 32],
  upsetBonus: 1,
  perfectBracketBonus: 500,
};

// FIFA World Cup scoring (group stage + knockouts)
export const FIFA_WC_SCORING_RULES: ScoringRules = {
  pointsPerRound: [1, 2, 4, 8, 16, 32],
  upsetBonus: 2,
  perfectBracketBonus: 200,
};
