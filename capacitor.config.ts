import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.sleepwell',
  appName: 'SleepWell',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      sound: 'alarm_sound.wav',
      smallIcon: 'ic_stat_alarm',
      iconColor: '#6366f1',
    },
    BackgroundRunner: {
      label: 'app.lovable.sleepwell.alarm-check',
      src: 'background.js',
      event: 'checkAlarms',
      repeat: true,
      interval: 1,
      autoStart: true,
    },
  },
};

export default config;
