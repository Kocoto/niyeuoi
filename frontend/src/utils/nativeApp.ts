import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

interface ShareHelperPlugin {
  getPendingText(): Promise<{ text: string }>;
}

interface NotifHelperPlugin {
  isEnabled(): Promise<{ enabled: boolean }>;
  openSettings(): Promise<void>;
  getPending(): Promise<{ text: string }>;
}

// Plugin nội bộ — được đăng ký trong MainActivity.java (không cần npm package)
const ShareHelper = registerPlugin<ShareHelperPlugin>('ShareHelper');
const NotifHelper = registerPlugin<NotifHelperPlugin>('NotifHelper');

const SESSION_KEY = 'niyeuoi:pending-share';

/**
 * Khởi tạo các hành vi native khi app chạy trong Capacitor (Android/iOS):
 * style status bar, ẩn splash, nút Back vật lý Android, và xử lý share intent.
 *
 * No-op khi chạy trên web nên gọi vô điều kiện cũng an toàn.
 *
 * @returns hàm cleanup gỡ listener.
 */
export function initNativeApp(): () => void {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  // Status bar: chữ tối trên nền sáng (theme app nền hồng/trắng).
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  if (Capacitor.getPlatform() === 'android') {
    StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});
  }

  // OTA (Capgo): báo bản web hiện tại đã chạy OK.
  CapacitorUpdater.notifyAppReady().catch(() => {});

  // Ẩn splash sau khi React đã mount.
  SplashScreen.hide().catch(() => {});

  // Nút Back vật lý Android.
  const backHandle = App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  // Share intent: lấy text đang chờ từ lần mở app này (cold start)
  if (Capacitor.getPlatform() === 'android') {
    ShareHelper.getPendingText()
      .then(({ text }) => {
        if (!text) return;
        dispatchShareText(text);
      })
      .catch(() => {});

    // Tự đọc thông báo: drain thông báo giao dịch service bắt được (cold start + mỗi lần resume)
    const drainNotif = () => {
      NotifHelper.getPending()
        .then(({ text }) => { if (text) dispatchShareText(text); })
        .catch(() => {});
    };
    drainNotif();
    const resumeHandle = App.addListener('resume', drainNotif);

    // Share/notif khi app đã chạy nền (hot start) — MainActivity inject event này
    const handleLiveShare = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text;
      if (text) dispatchShareText(text);
    };
    window.addEventListener('niyeuoi-share', handleLiveShare);

    return () => {
      backHandle.then((h) => h.remove()).catch(() => {});
      resumeHandle.then((h) => h.remove()).catch(() => {});
      window.removeEventListener('niyeuoi-share', handleLiveShare);
    };
  }

  return () => {
    backHandle.then((handle) => handle.remove()).catch(() => {});
  };
}

/**
 * Lưu shared text vào sessionStorage rồi phát event `niyeuoi-share-ready`.
 * Việc điều hướng sang /expenses do ShareNavigator (trong Router) lo bằng
 * client-side navigation của react-router — KHÔNG dùng `window.location.href`
 * vì trong Capacitor điều hướng cứng tới route SPA thường 404.
 */
function dispatchShareText(text: string) {
  sessionStorage.setItem(SESSION_KEY, text);
  window.dispatchEvent(new CustomEvent('niyeuoi-share-ready'));
}

/** Có shared text đang chờ hay không (peek, không xoá). */
export function hasPendingShareText(): boolean {
  return sessionStorage.getItem(SESSION_KEY) !== null;
}

/** App đã được cấp quyền tự đọc thông báo (Notification access) chưa. */
export async function isNotifCaptureEnabled(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return false;
  try {
    const { enabled } = await NotifHelper.isEnabled();
    return enabled;
  } catch {
    return false;
  }
}

/** Mở màn cấp quyền Notification access của hệ thống. */
export async function openNotifSettings(): Promise<void> {
  try { await NotifHelper.openSettings(); } catch { /* ignore */ }
}

/** Đọc và xoá pending share text (gọi từ Expenses.tsx khi mount). */
export function consumePendingShareText(): string | null {
  const text = sessionStorage.getItem(SESSION_KEY);
  if (text) sessionStorage.removeItem(SESSION_KEY);
  return text;
}
