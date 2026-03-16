import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getBracket } from '../lib/sportsApi';
import { calculateScore, calculateRankings } from '../lib/scoring';
import { DEFAULT_SCORING_RULES } from '../constants/scoring';
import type {
  Group,
  GroupMember,
  UserPrediction,
  PredictionMap,
  LeagueId,
  Bracket,
  ScoringRules,
} from '../types';

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  members: GroupMember[];
  myPrediction: UserPrediction | null;
  loading: boolean;
  savingPrediction: boolean;
  lastError: string | null;

  loadGroups: (userId: string) => Promise<void>;
  loadGroup: (groupId: string) => Promise<void>;
  createGroup: (
    name: string,
    leagueId: LeagueId,
    bracketId: string,
    pickDeadline: Date,
    userId: string
  ) => Promise<Group | null>;
  joinGroup: (inviteCode: string, userId: string) => Promise<Group | null>;
  leaveGroup: (groupId: string, userId: string) => Promise<void>;
  loadMembers: (groupId: string) => Promise<void>;
  loadMyPrediction: (groupId: string, bracketId: string, userId: string) => Promise<void>;
  savePrediction: (
    groupId: string,
    bracketId: string,
    userId: string,
    predictions: PredictionMap,
    bracket: Bracket
  ) => Promise<void>;
  lockPrediction: (predictionId: string) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  members: [],
  myPrediction: null,
  loading: false,
  savingPrediction: false,
  lastError: null,

  loadGroups: async (userId) => {
    set({ loading: true });
    try {
      // Get group IDs the user is a member of
      const { data: memberRows } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (!memberRows || memberRows.length === 0) {
        set({ groups: [], loading: false });
        return;
      }

      const groupIds = memberRows.map((r) => r.group_id);
      const { data: groupRows } = await supabase
        .from('groups')
        .select('*, group_members(count)')
        .in('id', groupIds);

      if (!groupRows) return;

      // Get user's scores in each group
      const { data: predRows } = await supabase
        .from('user_predictions')
        .select('group_id, score')
        .eq('user_id', userId)
        .in('group_id', groupIds);

      const scoreMap = new Map(predRows?.map((p) => [p.group_id, p.score]) ?? []);

      const groups: Group[] = groupRows.map((row) => ({
        id: row.id,
        name: row.name,
        inviteCode: row.invite_code,
        createdBy: row.created_by,
        leagueId: row.league_id as LeagueId,
        bracketId: row.bracket_id,
        pickDeadline: row.pick_deadline,
        memberCount: (row.group_members as Array<{ count: number }>)?.[0]?.count ?? 0,
        scoringRules: typeof row.scoring_rules === 'string'
          ? JSON.parse(row.scoring_rules)
          : row.scoring_rules as ScoringRules,
        createdAt: row.created_at,
        userScore: scoreMap.get(row.id),
      }));

      set({ groups });
    } catch (err) {
      console.warn('[GroupStore] loadGroups error:', err);
    } finally {
      set({ loading: false });
    }
  },

  loadGroup: async (groupId) => {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (data) {
      set({
        currentGroup: {
          id: data.id,
          name: data.name,
          inviteCode: data.invite_code,
          createdBy: data.created_by,
          leagueId: data.league_id as LeagueId,
          bracketId: data.bracket_id,
          pickDeadline: data.pick_deadline,
          memberCount: 0,
          scoringRules: typeof data.scoring_rules === 'string'
            ? JSON.parse(data.scoring_rules)
            : data.scoring_rules as ScoringRules,
          createdAt: data.created_at,
        },
      });
    }
  },

  createGroup: async (name, leagueId, bracketId, pickDeadline, userId) => {
    // Check free tier limit (max 2 groups)
    const { groups } = get();
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profile?.subscription_tier === 'free' && groups.length >= 2) {
      return null; // caller should show PremiumGate
    }

    const { data, error } = await supabase
      .from('groups')
      .insert({
        name,
        league_id: leagueId,
        bracket_id: bracketId,
        created_by: userId,
        pick_deadline: pickDeadline.toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      set({ lastError: error?.message ?? 'Unknown error' });
      return null;
    }
    set({ lastError: null });

    // Auto-join creator
    await supabase.from('group_members').insert({
      group_id: data.id,
      user_id: userId,
    });

    await get().loadGroups(userId);
    return get().groups.find((g) => g.id === data.id) ?? null;
  },

  joinGroup: async (inviteCode, userId) => {
    const { data: group } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (!group) return null;

    // Check free tier limit
    const { groups } = get();
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profile?.subscription_tier === 'free' && groups.length >= 2) {
      return null; // caller should show PremiumGate
    }

    const { error } = await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: userId,
    });

    if (error) return null;

    await get().loadGroups(userId);
    return get().groups.find((g) => g.id === group.id) ?? null;
  },

  leaveGroup: async (groupId, userId) => {
    await supabase.from('group_members').delete().match({
      group_id: groupId,
      user_id: userId,
    });
    set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) }));
  },

  loadMembers: async (groupId) => {
    const { data: memberRows } = await supabase
      .from('group_members')
      .select('user_id, joined_at')
      .eq('group_id', groupId);

    if (!memberRows || memberRows.length === 0) return;

    const userIds = memberRows.map((m) => m.user_id);

    const [profilesRes, predictionsRes] = await Promise.all([
      supabase.from('profiles').select('*').in('id', userIds),
      supabase
        .from('user_predictions')
        .select('user_id, score, correct_picks, predictions')
        .eq('group_id', groupId),
    ]);

    const predMap = new Map(predictionsRes.data?.map((p) => [p.user_id, p]) ?? []);

    const { currentGroup } = get();

    // Try to recalculate live scores against current bracket results
    let liveBracket: Awaited<ReturnType<typeof getBracket>> | null = null;
    if (currentGroup?.leagueId) {
      try {
        liveBracket = await getBracket(currentGroup.leagueId);
      } catch {
        // use stored scores as fallback
      }
    }
    const rules = currentGroup?.scoringRules ?? DEFAULT_SCORING_RULES;

    const members: GroupMember[] = (profilesRes.data ?? []).map((p, idx) => {
      const pred = predMap.get(p.id);
      const predParsed: PredictionMap =
        typeof pred?.predictions === 'string'
          ? JSON.parse(pred.predictions)
          : pred?.predictions ?? {};

      let score = pred?.score ?? 0;
      let correctPicks = pred?.correct_picks ?? 0;

      if (liveBracket && Object.keys(predParsed).length > 0) {
        const live = calculateScore(predParsed, liveBracket, rules);
        score = live.score;
        correctPicks = live.correctPicks;
      }

      return {
        userId: p.id,
        profile: {
          id: p.id,
          username: p.username,
          displayName: p.display_name,
          avatarUrl: p.avatar_url ?? undefined,
          subscriptionTier: p.subscription_tier,
          totalCorrectPredictions: p.total_correct_predictions,
          totalPredictions: p.total_predictions,
          createdAt: p.created_at,
        },
        score,
        rank: idx + 1,
        correctPicks,
        totalPicks: Object.keys(predParsed).length,
      };
    });

    const ranked = calculateRankings(members);
    set({ members: ranked });
  },

  loadMyPrediction: async (groupId, bracketId, userId) => {
    const { data } = await supabase
      .from('user_predictions')
      .select('*')
      .match({ group_id: groupId, bracket_id: bracketId, user_id: userId })
      .single();

    if (data) {
      set({
        myPrediction: {
          id: data.id,
          userId: data.user_id,
          bracketId: data.bracket_id,
          groupId: data.group_id,
          predictions:
            typeof data.predictions === 'string'
              ? JSON.parse(data.predictions)
              : data.predictions,
          score: data.score,
          correctPicks: data.correct_picks,
          locked: data.locked,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
      });
    } else {
      set({ myPrediction: null });
    }
  },

  savePrediction: async (groupId, bracketId, userId, predictions, bracket) => {
    set({ savingPrediction: true });
    try {
      const { currentGroup } = get();
      const rules = currentGroup?.scoringRules ?? DEFAULT_SCORING_RULES;
      const { score, correctPicks } = calculateScore(predictions, bracket, rules);

      const { data } = await supabase
        .from('user_predictions')
        .upsert(
          {
            user_id: userId,
            bracket_id: bracketId,
            group_id: groupId,
            predictions,
            score,
            correct_picks: correctPicks,
          },
          { onConflict: 'user_id,bracket_id,group_id' }
        )
        .select()
        .single();

      if (data) {
        set({
          myPrediction: {
            id: data.id,
            userId: data.user_id,
            bracketId: data.bracket_id,
            groupId: data.group_id,
            predictions,
            score: data.score,
            correctPicks: data.correct_picks,
            locked: data.locked,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          },
        });
      }
    } finally {
      set({ savingPrediction: false });
    }
  },

  lockPrediction: async (predictionId) => {
    await supabase
      .from('user_predictions')
      .update({ locked: true })
      .eq('id', predictionId);

    set((s) => ({
      myPrediction: s.myPrediction
        ? { ...s.myPrediction, locked: true }
        : null,
    }));
  },
}));
