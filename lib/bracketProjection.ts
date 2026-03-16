/**
 * Projects a bracket forward by filling TBD slots with predicted winners
 * from earlier rounds, so users can see their picks cascade through the bracket.
 */

import type { Bracket, Match, PredictionMap, Team } from '../types';

/** Returns the predicted winner Team for a match, if one has been picked. */
function getPredictedWinner(match: Match, predictions: PredictionMap): Team | undefined {
  const winnerId = predictions[match.id];
  if (!winnerId) return undefined;
  if (match.homeTeam?.id === winnerId) return match.homeTeam;
  if (match.awayTeam?.id === winnerId) return match.awayTeam;
  return undefined;
}

/**
 * Returns a new bracket where TBD participants in later rounds are filled
 * with predicted winners from earlier rounds.
 *
 * Round mapping:
 *  - If round[r] has half as many matches as round[r-1]:  2:1 pairing
 *    (matches 2p and 2p+1 in round r-1 feed match p in round r)
 *  - If round[r] has the same count as round[r-1]:  1:1 mapping
 *    (match p in round r-1 feeds one participant slot in match p of round r)
 */
export function projectBracket(bracket: Bracket, predictions: PredictionMap): Bracket {
  if (!bracket.rounds.length) return bracket;

  // Deep-copy rounds so we don't mutate the original
  const rounds = bracket.rounds.map((r) => ({
    ...r,
    matches: r.matches.map((m) => ({ ...m })),
  }));

  for (let r = 1; r < rounds.length; r++) {
    const prev = rounds[r - 1];
    const curr = rounds[r];
    const prevN = prev.matches.length;
    const currN = curr.matches.length;

    for (let p = 0; p < currN; p++) {
      const match = curr.matches[p];

      if (currN * 2 === prevN) {
        // 2:1 — each pair of prev-round matches feeds one curr match
        if (!match.homeTeam) {
          const feeder = prev.matches[2 * p];
          if (feeder) match.homeTeam = getPredictedWinner(feeder, predictions);
        }
        if (!match.awayTeam) {
          const feeder = prev.matches[2 * p + 1];
          if (feeder) match.awayTeam = getPredictedWinner(feeder, predictions);
        }
      } else if (currN === prevN) {
        // 1:1 — each prev match feeds one slot in the corresponding curr match
        // In UCL, the KO Playoffs winner becomes one participant in R16
        const feeder = prev.matches[p];
        if (feeder) {
          const winner = getPredictedWinner(feeder, predictions);
          if (winner) {
            // Fill whichever slot is empty
            if (!match.homeTeam) match.homeTeam = winner;
            else if (!match.awayTeam) match.awayTeam = winner;
          }
        }
      }
    }
  }

  return { ...bracket, rounds };
}
