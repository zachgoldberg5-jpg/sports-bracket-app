import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  isGuest: boolean;

  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<string | null>;
  setSession: (session: Session | null) => void;
  signInAsGuest: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: false,
  initialized: false,
  isGuest: false,

  initialize: async () => {
    if (!supabaseConfigured) {
      // Demo mode — no Supabase, start unauthenticated
      set({ loading: false, initialized: true });
      return;
    }

    set({ loading: true });
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null });

    if (session?.user) {
      await fetchProfile(session.user.id, set);
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        await fetchProfile(session.user.id, set);
      } else {
        set({ profile: null });
      }
    });

    set({ loading: false, initialized: true });
  },

  signInWithEmail: async (email, password) => {
    if (!supabaseConfigured) {
      // Demo mode: accept any credentials and create a local profile
      const profile: Profile = {
        id: email,
        username: email.split('@')[0],
        displayName: email.split('@')[0],
        subscriptionTier: 'free',
        totalCorrectPredictions: 0,
        totalPredictions: 0,
        createdAt: new Date().toISOString(),
      };
      set({ isGuest: true, profile, initialized: true });
      return null;
    }
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    return error?.message ?? null;
  },

  signUpWithEmail: async (email, password, username) => {
    if (!supabaseConfigured) {
      // Demo mode: create a local profile with the provided display name
      const profile: Profile = {
        id: email,
        username: username.toLowerCase().replace(/\s+/g, '_'),
        displayName: username,
        subscriptionTier: 'free',
        totalCorrectPredictions: 0,
        totalPredictions: 0,
        createdAt: new Date().toISOString(),
      };
      set({ isGuest: true, profile, initialized: true });
      return null;
    }
    set({ loading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, full_name: username } },
    });
    set({ loading: false });
    return error?.message ?? null;
  },

  signOut: async () => {
    if (supabaseConfigured) {
      await supabase.auth.signOut();
    }
    set({ session: null, user: null, profile: null, isGuest: false });
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return 'Not logged in.';

    const dbUpdates: Record<string, unknown> = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.pushToken !== undefined) dbUpdates.push_token = updates.pushToken;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', user.id);

    if (error) return error.message;

    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    }));
    return null;
  },

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },

  signInAsGuest: () => {
    const guestProfile: Profile = {
      id: 'guest',
      username: 'guest',
      displayName: 'Guest',
      subscriptionTier: 'free',
      totalCorrectPredictions: 0,
      totalPredictions: 0,
      createdAt: new Date().toISOString(),
    };
    set({ isGuest: true, profile: guestProfile, initialized: true });
  },
}));

async function fetchProfile(
  userId: string,
  set: (partial: Partial<AuthState>) => void
): Promise<void> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return;

  const profile: Profile = {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url ?? undefined,
    pushToken: data.push_token ?? undefined,
    subscriptionTier: data.subscription_tier,
    totalCorrectPredictions: data.total_correct_predictions,
    totalPredictions: data.total_predictions,
    createdAt: data.created_at,
  };

  set({ profile });
}
