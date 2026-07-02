import axios from 'axios';
import logger from '../utils/logger';
import type { AuthRole } from '../utils/authToken';
import type { ReminderOwner } from '../models/Reminder';

const BOT_TOKEN = (process.env['TELEGRAM_BOT_TOKEN'] || '').trim();
const CHAT: Record<AuthRole, string> = {
    boyfriend: (process.env['TELEGRAM_CHAT_BOYFRIEND'] || '').trim(),
    girlfriend: (process.env['TELEGRAM_CHAT_GIRLFRIEND'] || '').trim(),
};

function ownerRoles(owner: ReminderOwner): AuthRole[] {
    return owner === 'both' ? ['boyfriend', 'girlfriend'] : [owner];
}

class TelegramService {
    isConfigured(role?: AuthRole): boolean {
        if (!BOT_TOKEN) return false;
        return role ? !!CHAT[role] : !!(CHAT.boyfriend || CHAT.girlfriend);
    }

    async sendToOwner(owner: ReminderOwner, text: string): Promise<void> {
        if (!BOT_TOKEN) return;
        const roles = ownerRoles(owner).filter((r) => CHAT[r]);
        await Promise.all(roles.map(async (r) => {
            try {
                await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    chat_id: CHAT[r],
                    text,
                });
            } catch (err: any) {
                logger.warn('Telegram', `Gửi lỗi (${r})`, err?.response?.status || err?.message);
            }
        }));
    }
}

export default new TelegramService();
