import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// True when real Supabase credentials are configured
export const supabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl !== 'https://your-project-id.supabase.co';

if (!supabaseConfigured) {
  console.warn(
    '[Supabase] Running in demo mode. Copy .env.example to .env and fill in real Supabase credentials to enable auth and data sync.'
  );
}

// On web during SSR, window is undefined — fall back to undefined (in-memory) to avoid crashes.
// In the browser, AsyncStorage maps to localStorage. On native, it uses the native store.
const authStorage =
  Platform.OS === 'web' && typeof window === 'undefined' ? undefined : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Typed DB helpers ─────────────────────────────────────────────────────────

export type DbProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  push_token: string | null;
  subscription_tier: 'free' | 'premium';
  total_correct_predictions: number;
  total_predictions: number;
  created_at: string;
  updated_at: string;
};

export type DbGroup = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  league_id: string;
  bracket_id: string;
  pick_deadline: string;
  scoring_rules: string; // JSON
  created_at: string;
};

export type DbGroupMember = {
  group_id: string;
  user_id: string;
  joined_at: string;
};

export type DbUserPrediction = {
  id: string;
  user_id: string;
  bracket_id: string;
  group_id: string;
  predictions: string; // JSON
  score: number;
  correct_picks: number;
  locked: boolean;
  created_at: string;
  updated_at: string;
};

export type DbBracket = {
  id: string;
  league_id: string;
  season: string;
  rounds: string; // JSON
  champion_id: string | null;
  is_official: boolean;
  updated_at: string;
};
