import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.niyeuoi.app',
  appName: 'Niyeuoi',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0f172a',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    // OTA self-hosted (Capgo plugin trỏ về backend của mình, KHÔNG dùng Capgo Cloud):
    // app tự kiểm tra & tải bản web mới ngầm, áp dụng ở lần mở kế tiếp, chạy offline.
    CapacitorUpdater: {
      autoUpdate: true,
      updateUrl: 'https://niyeuoi.onrender.com/api/ota/updates',
      statsUrl: 'https://niyeuoi.onrender.com/api/ota/stats',
      channelUrl: 'https://niyeuoi.onrender.com/api/ota/channel',
    },
  },
};

export default config;
