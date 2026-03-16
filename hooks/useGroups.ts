import { useEffect } from 'react';
import { useGroupStore } from '../store/groupStore';
import { useAuthStore } from '../store/authStore';
import type { PredictionMap, Bracket, LeagueId } from '../types';

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
    store.loadGroup(groupId);
    store.loadMembers(groupId);
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
      if (store.myPrediction) {
        await store.lockPrediction(store.myPrediction.id);
      }
    },
    unlockPrediction: async () => {
      if (store.myPrediction) {
        await store.unlockPrediction(store.myPrediction.id);
      }
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
