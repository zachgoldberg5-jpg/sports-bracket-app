import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  savePushToken,
  setupNotificationListeners,
} from '../lib/notifications';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'expo-router';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const router = useRouter();
  const notificationListener = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (!user) return;

    // Register for push notifications
    registerForPushNotifications().then((token) => {
      if (token) {
        savePushToken(user.id, token);
        updateProfile({ pushToken: token });
      }
    });

    // Set up listeners
    notificationListener.current = setupNotificationListeners(
      (_notification: Notifications.Notification) => {
        // Notification received while app is open — could show in-app banner
      },
      (response: Notifications.NotificationResponse) => {
        // User tapped a notification
        const data = response.notification.request.content.data as Record<string, unknown>;
        handleNotificationTap(data, router);
      }
    );

    return () => {
      notificationListener.current?.();
    };
  }, [user?.id]);
}

function handleNotificationTap(
  data: Record<string, unknown>,
  router: ReturnType<typeof useRouter>
) {
  const type = data?.type as string | undefined;

  switch (type) {
    case 'game_result':
      if (data.leagueId) router.push(`/(tabs)/leagues/${data.leagueId}` as never);
      break;
    case 'leaderboard_change':
    case 'friend_joined':
      if (data.groupId) router.push(`/(tabs)/groups/${data.groupId}` as never);
      break;
    case 'deadline_reminder':
      if (data.groupId) router.push(`/(tabs)/groups/${data.groupId}/picks` as never);
      break;
    default:
      router.push('/(tabs)/' as never);
  }
}

/**
 * Get the last notification that opened the app (for cold start handling).
 */
export async function getInitialNotification(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}
