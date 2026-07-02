import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription';
import logger from '../utils/logger';
import type { AuthRole } from '../utils/authToken';
import type { ReminderOwner } from '../models/Reminder';

const VAPID_PUBLIC = (process.env['VAPID_PUBLIC_KEY'] || '').trim();
const VAPID_PRIVATE = (process.env['VAPID_PRIVATE_KEY'] || '').trim();
const VAPID_SUBJECT = (process.env['VAPID_SUBJECT'] || 'mailto:admin@niyeuoi.app').trim();

const configured = !!(VAPID_PUBLIC && VAPID_PRIVATE);
if (configured) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
    logger.success('Push', 'VAPID đã cấu hình');
} else {
    logger.warn('Push', 'Thiếu VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY — Web Push tắt');
}

interface SubInput {
    endpoint: string;
    keys: { p256dh: string; auth: string };
}

function ownerRoles(owner: ReminderOwner): AuthRole[] {
    return owner === 'both' ? ['boyfriend', 'girlfriend'] : [owner];
}

class PushService {
    isConfigured(): boolean {
        return configured;
    }

    async saveSubscription(sub: SubInput, owner: AuthRole, createdBy: AuthRole): Promise<void> {
        if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error('VALIDATION_ERROR: Subscription không hợp lệ');
        await PushSubscription.findOneAndUpdate(
            { endpoint: sub.endpoint },
            { endpoint: sub.endpoint, keys: sub.keys, owner, createdBy },
            { upsert: true, new: true },
        );
        logger.info('Push', 'Đã lưu subscription', { owner });
    }

    async removeSubscription(endpoint: string): Promise<void> {
        if (!endpoint) return;
        await PushSubscription.deleteOne({ endpoint });
    }

    async countByOwner(owner: AuthRole): Promise<number> {
        return PushSubscription.countDocuments({ owner });
    }

    async sendToOwner(owner: ReminderOwner, payload: { title: string; body: string; url?: string }): Promise<void> {
        if (!configured) return;
        const roles = ownerRoles(owner);
        const subs = await PushSubscription.find({ owner: { $in: roles } });
        if (subs.length === 0) return;

        const data = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url || '/reminders' });
        await Promise.all(subs.map(async (s) => {
            try {
                await webpush.sendNotification(
                    { endpoint: s.endpoint, keys: s.keys as any },
                    data,
                );
            } catch (err: any) {
                // 404/410 = subscription hết hạn → xoá
                if (err?.statusCode === 404 || err?.statusCode === 410) {
                    await PushSubscription.deleteOne({ endpoint: s.endpoint }).catch(() => {});
                } else {
                    logger.warn('Push', 'Gửi push lỗi', err?.statusCode || err?.message);
                }
            }
        }));
    }
}

export default new PushService();
