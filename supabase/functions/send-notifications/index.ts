/**
 * Supabase Edge Function: send-notifications
 *
 * Sends push notifications via Expo Push Notifications service.
 * Supports: game_result, leaderboard_change, deadline_reminder, friend_joined
 *
 * Deploy: supabase functions deploy send-notifications
 * Call: await supabase.functions.invoke('send-notifications', { body: { ... } })
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
  sound?: string;
  badge?: number;
}

async function sendPushNotifications(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  // Expo push API accepts batches of up to 100
  const batches: PushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    batches.push(messages.slice(i, i + 100));
  }

  for (const batch of batches) {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    });
  }
}

Deno.serve(async (req) => {
  const body = await req.json();
  const { type, bracketId, groupId, userId } = body;

  switch (type) {
    case 'leaderboard_change': {
      if (!bracketId) break;

      // Get all group members with push tokens for groups using this bracket
      const { data: groupMembers } = await supabase
        .from('group_members')
        .select('user_id, groups!inner(bracket_id)')
        .eq('groups.bracket_id', bracketId);

      if (!groupMembers) break;

      const userIds = [...new Set(groupMembers.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, push_token, display_name')
        .in('id', userIds)
        .not('push_token', 'is', null);

      if (!profiles) break;

      const messages: PushMessage[] = profiles
        .filter((p) => p.push_token)
        .map((p) => ({
          to: p.push_token!,
          title: '📊 Leaderboard Updated',
          body: 'Game results are in — check your group standings!',
          data: { type: 'leaderboard_change', bracketId },
          channelId: 'game-results',
          sound: 'default',
        }));

      await sendPushNotifications(messages);
      break;
    }

    case 'friend_joined': {
      if (!groupId || !userId) break;

      // Get the group creator
      const { data: group } = await supabase
        .from('groups')
        .select('name, created_by')
        .eq('id', groupId)
        .single();

      if (!group) break;

      // Get the joining user's name
      const { data: joiner } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();

      // Get creator's push token
      const { data: creator } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', group.created_by)
        .single();

      if (creator?.push_token) {
        await sendPushNotifications([{
          to: creator.push_token,
          title: '👥 New member!',
          body: `${joiner?.display_name ?? 'Someone'} joined your group "${group.name}"`,
          data: { type: 'friend_joined', groupId },
          channelId: 'default',
          sound: 'default',
        }]);
      }
      break;
    }

    case 'deadline_reminder': {
      if (!groupId) break;

      // Get all members who haven't submitted picks
      const { data: group } = await supabase
        .from('groups')
        .select('name, bracket_id')
        .eq('id', groupId)
        .single();

      if (!group) break;

      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (!members) break;

      const memberIds = members.map((m) => m.user_id);

      // Find members who have NOT submitted predictions
      const { data: submitted } = await supabase
        .from('user_predictions')
        .select('user_id')
        .eq('group_id', groupId);

      const submittedIds = new Set(submitted?.map((p) => p.user_id) ?? []);
      const unpickedIds = memberIds.filter((id) => !submittedIds.has(id));

      if (unpickedIds.length === 0) break;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('push_token')
        .in('id', unpickedIds)
        .not('push_token', 'is', null);

      if (!profiles) break;

      const messages: PushMessage[] = profiles
        .filter((p) => p.push_token)
        .map((p) => ({
          to: p.push_token!,
          title: '⏰ Deadline tomorrow!',
          body: `Submit your picks for "${group.name}" before they lock.`,
          data: { type: 'deadline_reminder', groupId },
          channelId: 'reminders',
          sound: 'default',
        }));

      await sendPushNotifications(messages);
      break;
    }
  }

  return new Response(JSON.stringify({ success: true }));
});
