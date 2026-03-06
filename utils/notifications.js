import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Set up Android notification channel
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('task-alarms', {
    name: 'Task Alarms',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function requestNotificationPermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a daily repeating notification for a task.
 * Uses the task ID as the notification identifier so we can cancel it later.
 */
export async function scheduleTaskAlarm(taskId, taskName, hour, minute) {
  // Cancel any existing alarm for this task first
  await cancelTaskAlarm(taskId);

  await Notifications.scheduleNotificationAsync({
    identifier: taskId,
    content: {
      title: 'Task Reminder',
      body: taskName,
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'task-alarms' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Cancel a scheduled notification for a task.
 */
export async function cancelTaskAlarm(taskId) {
  await Notifications.cancelScheduledNotificationAsync(taskId);
}

/**
 * Cancel all scheduled notifications (useful for cleanup).
 */
export async function cancelAllAlarms() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
