import type { Bracket, PredictionMap, ScoringRules } from '../types';

export interface ScoreResult {
  score: number;
  correctPicks: number;
  totalGradable: number;
  breakdown: { round: number; label: string; points: number; correct: number; total: number }[];
}

/**
 * Calculate a user's score for their bracket predictions.
 *
 * Rules:
 * - Correct pick in round N earns pointsPerRound[N-1] points
 * - Correctly picking a higher-seed (upset) earns +upsetBonus
 * - Predicting all final-result winners earns +perfectBracketBonus
 */
export function calculateScore(
  predictions: PredictionMap,
  bracket: Bracket,
  rules: ScoringRules
): ScoreResult {
  let totalScore = 0;
  let correctPicks = 0;
  let totalGradable = 0;
  const breakdown: ScoreResult['breakdown'] = [];

  for (const round of bracket.rounds) {
    let roundPoints = 0;
    let roundCorrect = 0;
    let roundTotal = 0;
    const roundMultiplier = rules.pointsPerRound[round.roundNumber - 1] ?? 1;

    for (const match of round.matches) {
      if (!match.winnerId) continue; // not yet decided
      totalGradable++;
      roundTotal++;

      const predicted = predictions[match.id];
      if (!predicted) continue;

      if (predicted === match.winnerId) {
        let points = roundMultiplier;

        // Upset bonus: winner has a higher seed number than loser (upset)
        const winner =
          match.homeTeam?.id === match.winnerId ? match.homeTeam : match.awayTeam;
        const loser =
          match.homeTeam?.id === match.winnerId ? match.awayTeam : match.homeTeam;
        if (
          winner?.seed !== undefined &&
          loser?.seed !== undefined &&
          winner.seed > loser.seed
        ) {
          points += rules.upsetBonus;
        }

        totalScore += points;
        roundPoints += points;
        correctPicks++;
        roundCorrect++;
      }
    }

    breakdown.push({
      round: round.roundNumber,
      label: round.label,
      points: roundPoints,
      correct: roundCorrect,
      total: roundTotal,
    });
  }

  // Perfect bracket bonus
  if (totalGradable > 0 && correctPicks === totalGradable) {
    totalScore += rules.perfectBracketBonus;
  }

  return { score: totalScore, correctPicks, totalGradable, breakdown };
}

/**
 * Calculate leaderboard rankings from an array of scores.
 * Ties share the same rank.
 */
export function calculateRankings<T extends { userId: string; score: number }>(
  scores: T[]
): Array<T & { rank: number }> {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  let currentRank = 1;
  return sorted.map((item, idx) => {
    if (idx > 0 && item.score < sorted[idx - 1].score) {
      currentRank = idx + 1;
    }
    return { ...item, rank: currentRank };
  });
}
