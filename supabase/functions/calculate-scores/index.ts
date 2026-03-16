/**
 * Supabase Edge Function: calculate-scores
 *
 * Called via Supabase webhook when a brackets row is updated (new game results).
 * Recalculates scores for all user_predictions in affected groups.
 *
 * Deploy: supabase functions deploy calculate-scores
 * Trigger: Set up a database webhook in Supabase dashboard on brackets table UPDATE
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface BracketRound {
  roundNumber: number;
  matches: Array<{
    id: string;
    round: number;
    winnerId?: string;
    homeTeam?: { id: string; seed?: number };
    awayTeam?: { id: string; seed?: number };
  }>;
}

interface ScoringRules {
  pointsPerRound: number[];
  upsetBonus: number;
  perfectBracketBonus: number;
}

function calculateScore(
  predictions: Record<string, string>,
  rounds: BracketRound[],
  rules: ScoringRules
): { score: number; correctPicks: number } {
  let score = 0;
  let correctPicks = 0;
  let totalGradable = 0;

  for (const round of rounds) {
    const multiplier = rules.pointsPerRound[round.roundNumber - 1] ?? 1;
    for (const match of round.matches) {
      if (!match.winnerId) continue;
      totalGradable++;
      const predicted = predictions[match.id];
      if (!predicted) continue;

      if (predicted === match.winnerId) {
        let pts = multiplier;
        // Upset bonus
        const winner = match.homeTeam?.id === match.winnerId ? match.homeTeam : match.awayTeam;
        const loser = match.homeTeam?.id === match.winnerId ? match.awayTeam : match.homeTeam;
        if (winner?.seed !== undefined && loser?.seed !== undefined && winner.seed > loser.seed) {
          pts += rules.upsetBonus;
        }
        score += pts;
        correctPicks++;
      }
    }
  }

  if (totalGradable > 0 && correctPicks === totalGradable) {
    score += rules.perfectBracketBonus;
  }

  return { score, correctPicks };
}

Deno.serve(async (req) => {
  const payload = await req.json();
  const bracketId: string = payload.record?.id;

  if (!bracketId) {
    return new Response(JSON.stringify({ error: 'No bracket ID' }), { status: 400 });
  }

  // Load the updated bracket
  const { data: bracket } = await supabase
    .from('brackets')
    .select('rounds')
    .eq('id', bracketId)
    .single();

  if (!bracket) {
    return new Response(JSON.stringify({ error: 'Bracket not found' }), { status: 404 });
  }

  const rounds: BracketRound[] = typeof bracket.rounds === 'string'
    ? JSON.parse(bracket.rounds)
    : bracket.rounds;

  // Find all groups using this bracket
  const { data: groups } = await supabase
    .from('groups')
    .select('id, scoring_rules')
    .eq('bracket_id', bracketId);

  if (!groups || groups.length === 0) {
    return new Response(JSON.stringify({ message: 'No groups for this bracket' }));
  }

  const updates: Array<Promise<void>> = [];

  for (const group of groups) {
    const rules: ScoringRules = typeof group.scoring_rules === 'string'
      ? JSON.parse(group.scoring_rules)
      : group.scoring_rules;

    // Get all predictions for this group
    const { data: predictions } = await supabase
      .from('user_predictions')
      .select('id, user_id, predictions')
      .eq('group_id', group.id);

    if (!predictions) continue;

    for (const pred of predictions) {
      const preds: Record<string, string> = typeof pred.predictions === 'string'
        ? JSON.parse(pred.predictions)
        : pred.predictions;

      const { score, correctPicks } = calculateScore(preds, rounds, rules);

      updates.push(
        supabase
          .from('user_predictions')
          .update({ score, correct_picks: correctPicks })
          .eq('id', pred.id)
          .then(() => {})
      );

      // Update global profile stats
      updates.push(
        supabase.rpc('increment_profile_stats', {
          p_user_id: pred.user_id,
          p_correct: correctPicks,
          p_total: Object.keys(preds).length,
        }).then(() => {})
      );
    }
  }

  await Promise.all(updates);

  // Trigger push notifications for leaderboard changes
  await supabase.functions.invoke('send-notifications', {
    body: { type: 'leaderboard_change', bracketId },
  });

  return new Response(JSON.stringify({ success: true, groupsProcessed: groups.length }));
});
