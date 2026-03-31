import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const DISCORD_WEBHOOK_URL = process.env['DISCORD_WEBHOOK_URL'];

class NotificationService {
    async sendDiscord(title: string, message: string, color: number = 15277667) {
        if (!DISCORD_WEBHOOK_URL) {
            logger.warn('Discord', 'Webhook URL chưa được cấu hình, bỏ qua thông báo');
            return;
        }

        logger.info('Discord', `Gửi embed: "${title}"`);
        try {
            await axios.post(DISCORD_WEBHOOK_URL, {
                embeds: [{
                    title: title,
                    description: message,
                    color: color,
                    timestamp: new Date()
                }]
            });
            logger.success('Discord', `Gửi thành công: "${title}"`);
        } catch (error: any) {
            logger.error('Discord', `Gửi thất bại: "${title}"`, error);
        }
    }
}

export default new NotificationService();
