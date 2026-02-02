import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.sleepwell',
  appName: 'SleepWell',
  webDir: 'dist',
  server: {
    url: 'https://8abd20c7-552c-4623-b816-72a1e4cfc477.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
