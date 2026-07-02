import Reminder, { IReminder, ReminderOwner } from '../models/Reminder';
import pushService from './pushService';
import telegramService from './telegramService';
import notificationService from './notificationService';
import { getDisplayName } from '../utils/authToken';
import logger from '../utils/logger';
import type { AuthRole } from '../utils/authToken';

function ownerLabel(owner: ReminderOwner): string {
    if (owner === 'both') return 'cả hai';
    return getDisplayName(owner as AuthRole);
}

/** Giờ VN hiện tại theo dạng cần cho việc so khớp. */
function vnNow(): { time: string; date: string; weekday: number } {
    const now = new Date();
    const time = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(now); // 'HH:mm'
    const date = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now); // 'YYYY-MM-DD'
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0=CN … 6=T7
    return { time, date, weekday };
}

class ReminderService {
    async getAll(owner?: ReminderOwner): Promise<IReminder[]> {
        const filter = owner ? { owner } : {};
        return Reminder.find(filter).sort({ time: 1, createdAt: 1 });
    }

    async create(data: Partial<IReminder>): Promise<IReminder> {
        try {
            const reminder = await Reminder.create(data);
            logger.success('Reminder', 'Đã tạo nhắc nhở', { id: reminder._id, title: reminder.title });
            return reminder;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((v: any) => v.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async bulkCreate(list: Partial<IReminder>[], createdBy: AuthRole): Promise<IReminder[]> {
        const docs = list
            .filter((r) => r.title && r.time)
            .map((r) => ({ ...r, createdBy }));
        if (docs.length === 0) return [];
        const created = await Reminder.insertMany(docs, { ordered: false });
        logger.success('Reminder', `Đã tạo ${created.length} nhắc nhở (bulk)`);
        return created as unknown as IReminder[];
    }

    async update(id: string, data: Partial<IReminder>): Promise<IReminder> {
        const reminder = await Reminder.findById(id);
        if (!reminder) throw new Error('NOT_FOUND');
        const { createdBy: _c, ...safe } = data as any;
        Object.assign(reminder, safe);
        await reminder.save();
        return reminder;
    }

    async delete(id: string): Promise<void> {
        const reminder = await Reminder.findById(id);
        if (!reminder) throw new Error('NOT_FOUND');
        await reminder.deleteOne();
    }

    /** Chạy mỗi phút: bắn các nhắc tới giờ ra kênh nhẹ (push + Discord + Telegram). */
    async fireDue(): Promise<void> {
        const { time, date, weekday } = vnNow();
        const dueByTime = await Reminder.find({ isActive: true, time });
        if (dueByTime.length === 0) return;

        for (const r of dueByTime) {
            const match = r.date
                ? r.date === date
                : (r.daysOfWeek.length === 0 || r.daysOfWeek.includes(weekday));
            if (!match) continue;

            const emoji = r.emoji || (r.critical ? '🔔' : '⏰');
            const title = `${emoji} ${r.title}`;
            const body = r.note?.trim()
                ? r.note
                : (r.critical ? 'Nhắc quan trọng — đến giờ rồi!' : 'Đến giờ rồi!');

            pushService.sendToOwner(r.owner, { title, body, url: '/reminders' }).catch(() => {});
            telegramService.sendToOwner(r.owner, `${title}\n${body}\n(nhắc ${ownerLabel(r.owner)})`).catch(() => {});
            notificationService.sendDiscord(
                title,
                `${body}\n\n*Nhắc ${ownerLabel(r.owner)}${r.critical ? ' · QUAN TRỌNG' : ''}*`,
                r.critical ? 15158332 : 3447003,
            ).catch(() => {});

            if (r.date) {
                r.isActive = false;
                await r.save().catch(() => {});
            }
        }
        logger.info('Reminder', `fireDue ${time} — xét ${dueByTime.length} nhắc`);
    }

    async channelStatus(): Promise<{
        webPush: { configured: boolean; boyfriendSubs: number; girlfriendSubs: number };
        telegram: { configured: boolean; boyfriend: boolean; girlfriend: boolean };
        discord: boolean;
    }> {
        const [bf, gf] = await Promise.all([
            pushService.countByOwner('boyfriend'),
            pushService.countByOwner('girlfriend'),
        ]);
        return {
            webPush: { configured: pushService.isConfigured(), boyfriendSubs: bf, girlfriendSubs: gf },
            telegram: {
                configured: telegramService.isConfigured(),
                boyfriend: telegramService.isConfigured('boyfriend'),
                girlfriend: telegramService.isConfigured('girlfriend'),
            },
            discord: !!process.env['DISCORD_WEBHOOK_URL'],
        };
    }
}

export default new ReminderService();
