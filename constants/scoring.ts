import type { ScoringRules } from '../types';

export const DEFAULT_SCORING_RULES: ScoringRules = {
  pointsPerRound: [1, 2, 4, 8, 16, 32],
  upsetBonus: 1,
  perfectBracketBonus: 100,
};

// ESPN standard March Madness scoring
// Round of 64: 10 | Round of 32: 20 | Sweet 16: 40 | Elite 8: 80 | Final Four: 160 | Championship: 320
export const NCAA_SCORING_RULES: ScoringRules = {
  pointsPerRound: [10, 20, 40, 80, 160, 320],
  upsetBonus: 0,
  perfectBracketBonus: 1_000_000,
};

// WBC — 3 knockout rounds
export const WBC_SCORING_RULES: ScoringRules = {
  pointsPerRound: [5, 10, 20],
  upsetBonus: 2,
  perfectBracketBonus: 200,
};

export const FIFA_WC_SCORING_RULES: ScoringRules = {
  pointsPerRound: [1, 2, 4, 8, 16, 32],
  upsetBonus: 2,
  perfectBracketBonus: 200,
};

export function getScoringRulesForLeague(leagueId: string): ScoringRules {
  switch (leagueId) {
    case 'ncaa_mm': return NCAA_SCORING_RULES;
    case 'wbc':     return WBC_SCORING_RULES;
    case 'fifa_wc': return FIFA_WC_SCORING_RULES;
    default:        return DEFAULT_SCORING_RULES;
  }
}

export const NCAA_ROUND_NAMES = [
  'First Four',
  'Round of 64',
  'Round of 32',
  'Sweet 16',
  'Elite Eight',
  'Final Four',
  'Championship',
];
