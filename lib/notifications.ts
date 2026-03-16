import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request permission and register for push notifications.
 * Returns the Expo push token, or null if permission was denied.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[Notifications] Push notifications require a physical device.');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted.');
    return null;
  }

  // Android channel setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
    await Notifications.setNotificationChannelAsync('game-results', {
      name: 'Game Results',
      description: 'Notifications when games finish',
      importance: Notifications.AndroidImportance.HIGH,
    });
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Deadline Reminders',
      description: 'Reminders before pick deadlines',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    });
    return token.data;
  } catch (err) {
    console.warn('[Notifications] Failed to get push token:', err);
    return null;
  }
}

/**
 * Save the push token to the user's profile in Supabase.
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', userId);
  if (error) console.warn('[Notifications] Failed to save push token:', error.message);
}

/**
 * Set up listeners for notification interactions.
 */
export function setupNotificationListeners(
  onNotification?: (notification: Notifications.Notification) => void,
  onResponse?: (response: Notifications.NotificationResponse) => void
) {
  const notifSub = Notifications.addNotificationReceivedListener((notification) => {
    onNotification?.(notification);
  });

  const respSub = Notifications.addNotificationResponseReceivedListener((response) => {
    onResponse?.(response);
  });

  return () => {
    notifSub.remove();
    respSub.remove();
  };
}

/**
 * Schedule a local notification (e.g. for pick deadline reminders).
 */
export async function scheduleDeadlineReminder(
  groupName: string,
  deadline: Date
): Promise<void> {
  const reminderTime = new Date(deadline.getTime() - 24 * 60 * 60 * 1000); // 24h before
  if (reminderTime <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Picks deadline tomorrow!',
      body: `Submit your bracket picks for "${groupName}" before they lock.`,
      data: { type: 'deadline_reminder' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderTime },
  });
}

/**
 * Cancel all scheduled notifications (e.g. when picks are submitted).
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
