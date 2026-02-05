import { useCallback, useEffect } from 'react';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface AlarmNotification {
  id: number;
  title: string;
  body: string;
  scheduledAt: Date;
  sound?: string;
}

export const useNativeAlarm = () => {
  const isNative = Capacitor.isNativePlatform();

  // Request permissions and register actions on mount
  useEffect(() => {
    if (isNative) {
      // Request permissions
      LocalNotifications.requestPermissions().then(result => {
        console.log('Notification permissions:', result);
      });
      
      // Register action types for notifications
      LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'ALARM_ACTIONS',
            actions: [
              {
                id: 'snooze',
                title: 'Snooze (5 min)',
                foreground: false,
              },
              {
                id: 'dismiss',
                title: 'Dismiss',
                destructive: true,
                foreground: false,
              },
            ],
          },
        ],
      }).then(() => {
        console.log('Alarm actions registered on mount');
      }).catch(err => {
        console.error('Failed to register alarm actions:', err);
      });
    }
  }, [isNative]);

  const requestPermissions = useCallback(async () => {
    if (!isNative) return { granted: false };
    
    const result = await LocalNotifications.requestPermissions();
    return { granted: result.display === 'granted' };
  }, [isNative]);

  const scheduleAlarm = useCallback(async (alarm: AlarmNotification) => {
    if (!isNative) {
      console.log('Native notifications not available in web');
      return null;
    }

    const options: ScheduleOptions = {
      notifications: [
        {
          id: alarm.id,
          title: alarm.title,
          body: alarm.body,
          schedule: { at: alarm.scheduledAt },
          sound: alarm.sound || 'beep.wav',
          actionTypeId: 'ALARM_ACTIONS',
          extra: { alarmId: alarm.id },
          // iOS specific options
          attachments: undefined,
          threadIdentifier: 'alarms',
          summaryArgument: alarm.title,
        },
      ],
    };

    try {
      const result = await LocalNotifications.schedule(options);
      console.log('Alarm scheduled:', result);
      return result;
    } catch (error) {
      console.error('Failed to schedule alarm:', error);
      return null;
    }
  }, [isNative]);

  const cancelAlarm = useCallback(async (id: number) => {
    if (!isNative) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
      console.log('Alarm cancelled:', id);
    } catch (error) {
      console.error('Failed to cancel alarm:', error);
    }
  }, [isNative]);

  const cancelAllAlarms = useCallback(async () => {
    if (!isNative) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
      console.log('All alarms cancelled');
    } catch (error) {
      console.error('Failed to cancel alarms:', error);
    }
  }, [isNative]);

  const getPendingAlarms = useCallback(async () => {
    if (!isNative) return [];

    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Failed to get pending alarms:', error);
      return [];
    }
  }, [isNative]);

  // Schedule a repeating alarm for specific days
  const scheduleRepeatingAlarm = useCallback(async (
    id: number,
    title: string,
    body: string,
    hour: number,
    minute: number,
    daysOfWeek: number[] // 1 = Sunday, 2 = Monday, etc.
  ) => {
    if (!isNative) {
      console.log('Native notifications not available in web');
      return null;
    }

    // For repeating alarms, we schedule one for each day
    const notifications = daysOfWeek.map((day, index) => ({
      id: id * 10 + index, // Unique ID per day
      title,
      body,
      schedule: {
        on: {
          weekday: day,
          hour,
          minute,
        },
        repeats: true,
        allowWhileIdle: true,
      },
      sound: 'beep.wav',
      actionTypeId: 'ALARM_ACTIONS',
      extra: { alarmId: id, dayOfWeek: day },
      // iOS specific
      threadIdentifier: 'alarms',
      summaryArgument: title,
    }));

    try {
      const result = await LocalNotifications.schedule({ notifications });
      console.log('Repeating alarms scheduled:', result);
      return result;
    } catch (error) {
      console.error('Failed to schedule repeating alarm:', error);
      return null;
    }
  }, [isNative]);

  // Register action types for the alarm
  const registerAlarmActions = useCallback(async () => {
    if (!isNative) return;

    try {
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'ALARM_ACTIONS',
            actions: [
              {
                id: 'snooze',
                title: 'Snooze',
                foreground: false,
              },
              {
                id: 'dismiss',
                title: 'Dismiss',
                destructive: true,
                foreground: false,
              },
            ],
          },
        ],
      });
      console.log('Alarm actions registered');
    } catch (error) {
      console.error('Failed to register alarm actions:', error);
    }
  }, [isNative]);

  // Listen for notification actions
  const addNotificationListeners = useCallback((
    onReceived: (notification: any) => void,
    onAction: (action: any) => void
  ) => {
    if (!isNative) return () => {};

    const receivedListener = LocalNotifications.addListener(
      'localNotificationReceived',
      onReceived
    );

    const actionListener = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      onAction
    );

    return () => {
      receivedListener.then(l => l.remove());
      actionListener.then(l => l.remove());
    };
  }, [isNative]);

  return {
    isNative,
    requestPermissions,
    scheduleAlarm,
    cancelAlarm,
    cancelAllAlarms,
    getPendingAlarms,
    scheduleRepeatingAlarm,
    registerAlarmActions,
    addNotificationListeners,
  };
};
