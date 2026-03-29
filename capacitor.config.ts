import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rewear.yoavraz',
  appName: 'ReWear',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    backgroundColor: '#0a0a0a',
    scrollEnabled: true,
    allowsLinkPreview: false,
  },
  server: {
    allowNavigation: ['*.supabase.co', '*.google.com', 'accounts.google.com'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a',
    },
  },
};

export default config;
