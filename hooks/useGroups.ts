import { useEffect } from 'react';
import { useGroupStore } from '../store/groupStore';
import { useAuthStore } from '../store/authStore';
import type { PredictionMap, Bracket, LeagueId } from '../types';

// Helper to get fresh store state, avoiding stale closure bugs
const freshStore = () => useGroupStore.getState();

export function useGroups() {
  const store = useGroupStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && store.groups.length === 0) {
      store.loadGroups(user.id);
    }
  }, [user?.id]);

  return {
    groups: store.groups,
    loading: store.loading,
    refresh: () => user && store.loadGroups(user.id),
  };
}

export function useGroup(groupId: string) {
  const store = useGroupStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const init = async () => {
      await store.loadGroup(groupId);
      await store.loadMembers(groupId);
    };
    init();
  }, [groupId]);

  useEffect(() => {
    if (user && store.currentGroup) {
      store.loadMyPrediction(groupId, store.currentGroup.bracketId, user.id);
    }
  }, [groupId, store.currentGroup?.bracketId, user?.id]);

  return {
    group: store.currentGroup,
    members: store.members,
    myPrediction: store.myPrediction,
    loading: store.loading,
    savingPrediction: store.savingPrediction,
    savePrediction: async (predictions: PredictionMap, bracket: Bracket) => {
      if (!user || !store.currentGroup) return;
      await store.savePrediction(
        groupId,
        store.currentGroup.bracketId,
        user.id,
        predictions,
        bracket
      );
    },
    lockPrediction: async () => {
      const pred = freshStore().myPrediction;
      if (pred) await store.lockPrediction(pred.id);
    },
    unlockPrediction: async () => {
      const pred = freshStore().myPrediction;
      if (pred) await store.unlockPrediction(pred.id);
    },
    createGroup: async (
      name: string,
      leagueId: LeagueId,
      bracketId: string,
      pickDeadline: Date
    ) => {
      if (!user) return null;
      return store.createGroup(name, leagueId, bracketId, pickDeadline, user.id);
    },
    joinGroup: async (inviteCode: string) => {
      if (!user) return null;
      return store.joinGroup(inviteCode, user.id);
    },
    leaveGroup: async () => {
      if (!user) return;
      await store.leaveGroup(groupId, user.id);
    },
  };
}
