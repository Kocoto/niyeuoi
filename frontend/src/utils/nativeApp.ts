import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

/**
 * Khởi tạo các hành vi native khi app chạy trong Capacitor (Android/iOS):
 * style status bar, ẩn splash, và nút Back vật lý Android.
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

  // OTA (Capgo): báo bản web hiện tại đã chạy OK. BẮT BUỘC — nếu không gọi,
  // plugin sẽ coi bản cập nhật là lỗi và tự rollback về bản trước.
  CapacitorUpdater.notifyAppReady().catch(() => {});

  // Ẩn splash sau khi React đã mount.
  SplashScreen.hide().catch(() => {});

  // Nút Back vật lý Android: lùi trong lịch sử app, chỉ thoát khi đã ở màn gốc.
  // window.history.back() hoạt động đúng với BrowserRouter.
  const backHandle = App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  return () => {
    backHandle.then((handle) => handle.remove()).catch(() => {});
  };
}
