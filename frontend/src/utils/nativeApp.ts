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
  getPending(): Promise<{ items: string[] }>;
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
        enqueueShareText(text);
      })
      .catch(() => {});

    // Tự đọc thông báo: drain HÀNG ĐỢI service bắt được (cold start + mỗi lần resume + khi được đánh thức)
    const drainNotif = () => {
      NotifHelper.getPending()
        .then(({ items }) => { (items ?? []).forEach((t) => { if (t) enqueueShareText(t); }); })
        .catch(() => {});
    };
    drainNotif();
    const resumeHandle = App.addListener('resume', drainNotif);

    // Share khi app đã chạy nền (hot start) — MainActivity inject event kèm text
    const handleLiveShare = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text;
      if (text) enqueueShareText(text);
    };
    window.addEventListener('niyeuoi-share', handleLiveShare);

    // Notif mới lúc app đang mở — MainActivity đánh thức, drain hàng đợi
    const handleNotifWake = () => drainNotif();
    window.addEventListener('niyeuoi-notif', handleNotifWake);

    return () => {
      backHandle.then((h) => h.remove()).catch(() => {});
      resumeHandle.then((h) => h.remove()).catch(() => {});
      window.removeEventListener('niyeuoi-share', handleLiveShare);
      window.removeEventListener('niyeuoi-notif', handleNotifWake);
    };
  }

  return () => {
    backHandle.then((handle) => handle.remove()).catch(() => {});
  };
}

function readQueue(): string[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeQueue(q: string[]) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(q));
}

/**
 * Nối text (share hoặc notif) vào HÀNG ĐỢI rồi phát event `niyeuoi-share-ready`.
 * Xếp hàng để nhiều giao dịch dồn dập không đè mất nhau (Q1). Việc điều hướng
 * sang /expenses do ShareNavigator (trong Router) lo bằng client-side navigation
 * — KHÔNG dùng `window.location.href` vì trong Capacitor điều hướng cứng tới
 * route SPA thường 404.
 */
function enqueueShareText(text: string) {
  const q = readQueue();
  q.push(text);
  writeQueue(q);
  window.dispatchEvent(new CustomEvent('niyeuoi-share-ready'));
}

/** Còn phần tử nào trong hàng đợi không (peek, không xoá). */
export function hasPendingShareText(): boolean {
  return readQueue().length > 0;
}

/** Lấy + xoá phần tử ĐẦU hàng đợi (Expenses xử lý lần lượt từng cái). */
export function dequeueShareText(): string | null {
  const q = readQueue();
  if (q.length === 0) return null;
  const first = q.shift() as string;
  writeQueue(q);
  return first;
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

