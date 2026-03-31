import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const DISCORD_WEBHOOK_URL = process.env['DISCORD_WEBHOOK_URL'];

class NotificationService {
    async sendDiscord(title: string, message: string, color: number = 15277667) { // Mặc định màu hồng
        if (!DISCORD_WEBHOOK_URL) {
            console.warn('Discord Webhook URL chưa được cấu hình.');
            return;
        }

        try {
            await axios.post(DISCORD_WEBHOOK_URL, {
                embeds: [{
                    title: title,
                    description: message,
                    color: color,
                    timestamp: new Date()
                }]
            });
        } catch (error: any) {
            console.error('Lỗi gửi thông báo Discord:', error.message);
        }
    }
}

export default new NotificationService();
