-- ============================================================
-- Row Level Security Policies
-- Run AFTER schema.sql
-- ============================================================

-- ─── Enable RLS ───────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_predictions ENABLE ROW LEVEL SECURITY;

-- ─── Profiles ─────────────────────────────────────────────────────────────────
-- Anyone authenticated can read profiles (for leaderboards, group members)
CREATE POLICY "profiles_read_all" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ─── Leagues ──────────────────────────────────────────────────────────────────
-- Public read
CREATE POLICY "leagues_read_all" ON leagues
  FOR SELECT USING (true);

-- Only service role can write (managed by backend/edge functions)
-- No INSERT/UPDATE/DELETE policies for authenticated users

-- ─── Brackets ─────────────────────────────────────────────────────────────────
-- Public read
CREATE POLICY "brackets_read_all" ON brackets
  FOR SELECT USING (true);

-- ─── Groups ───────────────────────────────────────────────────────────────────
-- Members can read groups they belong to
CREATE POLICY "groups_read_members" ON groups
  FOR SELECT USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

-- Anyone can read a group by invite code (for join flow)
CREATE POLICY "groups_read_invite" ON groups
  FOR SELECT USING (invite_code IS NOT NULL);

-- Authenticated users can create groups
CREATE POLICY "groups_insert" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Only creator can update/delete their group
CREATE POLICY "groups_update_own" ON groups
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "groups_delete_own" ON groups
  FOR DELETE USING (auth.uid() = created_by);

-- ─── Group Members ────────────────────────────────────────────────────────────
-- Members of a group can see all members
CREATE POLICY "group_members_read" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id
        AND gm2.user_id = auth.uid()
    )
  );

-- Users can join groups (insert themselves)
CREATE POLICY "group_members_join" ON group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave groups (delete their own membership)
CREATE POLICY "group_members_leave" ON group_members
  FOR DELETE USING (auth.uid() = user_id);

-- ─── User Predictions ─────────────────────────────────────────────────────────
-- Users can CRUD their own predictions
CREATE POLICY "predictions_read_own" ON user_predictions
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = user_predictions.group_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "predictions_insert_own" ON user_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update only if not locked
CREATE POLICY "predictions_update_unlocked" ON user_predictions
  FOR UPDATE USING (auth.uid() = user_id AND locked = false);

CREATE POLICY "predictions_delete_own" ON user_predictions
  FOR DELETE USING (auth.uid() = user_id AND locked = false);
