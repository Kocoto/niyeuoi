import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import type { IReminder } from '../api/reminderApi';
import type { Role } from '../constants/roles';

const CH_NORMAL = 'reminders';
const CH_ALARM = 'reminders-alarm';

const PHONE: Record<Role, string | undefined> = {
  boyfriend: (import.meta.env.VITE_PHONE_BOYFRIEND as string | undefined)?.trim() || undefined,
  girlfriend: (import.meta.env.VITE_PHONE_GIRLFRIEND as string | undefined)?.trim() || undefined,
};

let initialized = false;

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** id số 32-bit ổn định từ chuỗi (để cancel/schedule lại). */
function hashId(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 2000000000;
}

/** Số cần gọi cho 1 nhắc critical, xét theo vai đang đăng nhập. undefined nếu không có/không cần. */
function callPhoneFor(r: IReminder, role: Role): string | undefined {
  if (!r.critical) return undefined;
  const other: Role = role === 'boyfriend' ? 'girlfriend' : 'boyfriend';
  if (r.owner === 'both') return PHONE[other];
  if (r.owner !== role) return PHONE[r.owner as Role]; // nhắc cho người kia → gọi người đó
  return undefined; // nhắc của chính mình → không cần gọi
}

/** Khởi tạo channel Android + action "Gọi" + listener (chạy 1 lần). */
export async function initLocalReminders(): Promise<void> {
  if (!isNative() || initialized) return;
  initialized = true;

  if (Capacitor.getPlatform() === 'android') {
    await LocalNotifications.createChannel({
      id: CH_NORMAL, name: 'Nhắc nhở', importance: 4, visibility: 1,
    }).catch(() => {});
    await LocalNotifications.createChannel({
      id: CH_ALARM, name: 'Nhắc quan trọng', importance: 5, visibility: 1,
      sound: undefined, vibration: true,
    }).catch(() => {});
  }

  await LocalNotifications.registerActionTypes({
    types: [{ id: 'reminder-call', actions: [{ id: 'call', title: '📞 Gọi' }] }],
  }).catch(() => {});

  LocalNotifications.addListener('localNotificationActionPerformed', (payload) => {
    const phone = payload.notification?.extra?.phone as string | undefined;
    if (phone) window.open(`tel:${phone}`, '_system');
  }).catch(() => {});
}

/** Đồng bộ nhắc nhở → local notification trên máy (lịch cho vai đang đăng nhập + mọi ca critical). */
export async function syncLocalReminders(reminders: IReminder[], role: Role): Promise<void> {
  if (!isNative()) return;
  await initLocalReminders();

  const perm = await LocalNotifications.checkPermissions().catch(() => ({ display: 'denied' as const }));
  if (perm.display !== 'granted') return;

  // Huỷ các notif đã lên lịch trước đó (do app đặt).
  const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] }));
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) }).catch(() => {});
  }

  // Lịch cho: nhắc của mình (owner ∈ {role,'both'}) + mọi nhắc critical (để nhắc gọi).
  const relevant = reminders.filter(
    (r) => r.isActive && (r.owner === role || r.owner === 'both' || r.critical),
  );

  const toSchedule: LocalNotificationSchema[] = [];
  for (const r of relevant) {
    const [hh, mm] = r.time.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) continue;
    const phone = callPhoneFor(r, role);
    const base = {
      title: `${r.emoji || (r.critical ? '🔔' : '⏰')} ${r.title}`,
      body: r.note?.trim() || (r.critical ? 'Nhắc quan trọng — đến giờ rồi!' : 'Đến giờ rồi!'),
      channelId: r.critical ? CH_ALARM : CH_NORMAL,
      ...(r.critical && phone ? { actionTypeId: 'reminder-call', extra: { phone } } : {}),
    };

    if (r.date) {
      // Ca một lần đúng ngày
      const at = new Date(`${r.date}T${r.time}:00`);
      if (at.getTime() > Date.now()) {
        toSchedule.push({ id: hashId(`${r._id}-once`), ...base, schedule: { at, allowWhileIdle: true } });
      }
    } else if (!r.daysOfWeek || r.daysOfWeek.length === 0) {
      // Hằng ngày
      toSchedule.push({ id: hashId(`${r._id}-daily`), ...base, schedule: { on: { hour: hh, minute: mm }, allowWhileIdle: true } });
    } else {
      // Theo thứ (Capacitor weekday: 1=CN … 7=T7 = ourDay+1)
      for (const d of r.daysOfWeek) {
        toSchedule.push({
          id: hashId(`${r._id}-${d}`), ...base,
          schedule: { on: { weekday: (d + 1) as any, hour: hh, minute: mm }, allowWhileIdle: true },
        });
      }
    }
  }

  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({ notifications: toSchedule }).catch(() => {});
  }
}

export async function ensureReminderPermission(): Promise<boolean> {
  if (!isNative()) return false;
  const res = await LocalNotifications.requestPermissions().catch(() => ({ display: 'denied' as const }));
  return res.display === 'granted';
}
