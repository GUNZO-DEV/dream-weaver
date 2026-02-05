import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.sleepwell',
  appName: 'SleepWell',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      // Use custom sound for alarms
      sound: 'alarm_sound.wav',
      // Android: high priority for alarm-style notifications
      smallIcon: 'ic_stat_alarm',
      iconColor: '#6366f1',
    },
  },
};

export default config;
