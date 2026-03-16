-- ============================================================
-- Sports Bracket App — Supabase PostgreSQL Schema
-- Run in Supabase SQL Editor or via `supabase db push`
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users. Created automatically on sign-up via trigger.

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  push_token TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'premium')),
  total_correct_predictions INT NOT NULL DEFAULT 0,
  total_predictions INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Leagues ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leagues (
  id TEXT PRIMARY KEY,  -- 'nba', 'nfl', 'nhl', 'mlb', 'mls', 'ncaa_mm', 'ucl', 'fifa_wc'
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'off_season'
    CHECK (status IN ('live', 'upcoming', 'completed', 'off_season')),
  season TEXT NOT NULL,
  playoff_start_date DATE,
  season_start_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial league rows
INSERT INTO leagues (id, name, sport, status, season) VALUES
  ('nba',      'NBA',               'Basketball',        'live',       '2024-25'),
  ('nfl',      'NFL',               'Football',          'completed',  '2024-25'),
  ('nhl',      'NHL',               'Hockey',            'live',       '2024-25'),
  ('mlb',      'MLB',               'Baseball',          'upcoming',   '2025'),
  ('mls',      'MLS',               'Soccer',            'upcoming',   '2025'),
  ('ncaa_mm',  'March Madness',     'College Basketball','upcoming',   '2025'),
  ('ucl',      'Champions League',  'Soccer',            'live',       '2024-25'),
  ('fifa_wc',  'FIFA World Cup',    'Soccer',            'off_season', '2026')
ON CONFLICT (id) DO NOTHING;

-- ─── Brackets ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS brackets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id TEXT NOT NULL REFERENCES leagues(id),
  season TEXT NOT NULL,
  rounds JSONB NOT NULL DEFAULT '[]',
  champion_id TEXT,
  is_official BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(league_id, season, is_official)
);

CREATE INDEX IF NOT EXISTS idx_brackets_league ON brackets(league_id);

-- ─── Groups ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL
    DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  created_by UUID NOT NULL REFERENCES profiles(id),
  league_id TEXT NOT NULL REFERENCES leagues(id),
  bracket_id UUID NOT NULL REFERENCES brackets(id),
  pick_deadline TIMESTAMPTZ NOT NULL,
  scoring_rules JSONB NOT NULL DEFAULT
    '{"pointsPerRound":[1,2,4,8,16,32],"upsetBonus":1,"perfectBracketBonus":100}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Group Members ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- ─── User Predictions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bracket_id UUID NOT NULL REFERENCES brackets(id),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  predictions JSONB NOT NULL DEFAULT '{}',  -- { matchId: winnerId }
  score INT NOT NULL DEFAULT 0,
  correct_picks INT NOT NULL DEFAULT 0,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, bracket_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_user_predictions_group ON user_predictions(group_id);
CREATE INDEX IF NOT EXISTS idx_user_predictions_user ON user_predictions(user_id);

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER user_predictions_updated_at
  BEFORE UPDATE ON user_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
