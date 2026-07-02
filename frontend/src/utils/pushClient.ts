import { Capacitor } from '@capacitor/core';
import reminderApi from '../api/reminderApi';
import type { Role } from '../constants/roles';

const VAPID_PUBLIC = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim();

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Web Push chỉ chạy trên web/PWA (service worker), không chạy trong app native. */
export function isPushSupported(): boolean {
  return (
    !Capacitor.isNativePlatform() &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window &&
    !!VAPID_PUBLIC
  );
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

/** Xin quyền + đăng ký Web Push cho vai đang đăng nhập. Trả về true nếu thành công. */
export async function subscribePush(role: Role): Promise<boolean> {
  if (!isPushSupported() || !VAPID_PUBLIC) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      });
    }
    await reminderApi.subscribe(sub.toJSON(), role);
    return true;
  } catch {
    return false;
  }
}

export async function unsubscribePush(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await reminderApi.unsubscribe(sub.endpoint).catch(() => {});
      await sub.unsubscribe();
    }
  } catch {
    /* ignore */
  }
}
