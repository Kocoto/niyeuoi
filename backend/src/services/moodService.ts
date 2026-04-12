import Mood, { IMood } from '../models/Mood';
import notificationService from './notificationService';
import logger from '../utils/logger';

const ROLE_LABEL: Record<'boyfriend' | 'girlfriend', string> = {
    boyfriend: 'Được',
    girlfriend: 'Ni'
};

class MoodService {
    async getAllMoods() {
        logger.info('Mood', 'Lấy danh sách tâm trạng');
        const moods = await Mood.find().sort({ date: -1 });
        logger.success('Mood', `Trả về ${moods.length} tâm trạng`);
        return moods;
    }

    async getMoodById(id: string) {
        logger.info('Mood', 'Lấy tâm trạng theo ID', { id });
        const mood = await Mood.findById(id);
        if (!mood) {
            logger.warn('Mood', 'Không tìm thấy tâm trạng', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Mood', 'Tìm thấy tâm trạng', { mood: mood.mood });
        return mood;
    }

    async createMood(data: Partial<IMood>) {
        logger.info('Mood', 'Ghi tâm trạng mới', { mood: data.mood, date: data.date, createdBy: data.createdBy });
        try {
            const payload = {
                ...data,
                createdBy: data.createdBy === 'boyfriend' ? 'boyfriend' : 'girlfriend',
            };
            const mood = await Mood.create(payload);
            logger.success('Mood', 'Ghi tâm trạng thành công', { id: mood._id, mood: mood.mood, createdBy: mood.createdBy });

            let emoji = '✨';
            let color = 15277667;

            if (mood.mood === 'Hạnh phúc') { emoji = '😊'; color = 16776960; }
            if (mood.mood === 'Đang yêu') { emoji = '❤️'; color = 15548997; }
            if (mood.mood === 'Bình yên') { emoji = '☕'; color = 15105570; }
            if (mood.mood === 'Hơi buồn') { emoji = '🌧️'; color = 3447003; }
            if (mood.mood === 'Mệt mỏi') { emoji = '😫'; color = 9807270; }

            const owner = ROLE_LABEL[mood.createdBy as 'boyfriend' | 'girlfriend'] || 'Ai đó';
            logger.info('Mood', `Gửi thông báo Discord với emoji ${emoji}...`);
            await notificationService.sendDiscord(
                `${emoji} Cập nhật tâm trạng mới!`,
                `Người đang cảm thấy điều này là: **${owner}**\nTâm trạng: **${mood.mood}**\n<i>"${mood.note || 'Không có lời nhắn nào'}"</i>`,
                color
            );
            logger.success('Mood', 'Đã gửi thông báo Discord');

            return mood;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                logger.error('Mood', 'Lỗi validation khi ghi tâm trạng', messages);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            logger.error('Mood', 'Lỗi khi ghi tâm trạng', error);
            throw error;
        }
    }

    async updateMood(id: string, data: Partial<IMood>) {
        logger.info('Mood', 'Cập nhật tâm trạng', { id, fields: Object.keys(data) });
        const mood = await Mood.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!mood) {
            logger.warn('Mood', 'Không tìm thấy tâm trạng để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Mood', 'Cập nhật tâm trạng thành công', { mood: mood.mood });
        return mood;
    }

    async deleteMood(id: string) {
        logger.info('Mood', 'Xóa tâm trạng', { id });
        const mood = await Mood.findById(id);
        if (!mood) {
            logger.warn('Mood', 'Không tìm thấy tâm trạng để xóa', { id });
            throw new Error('NOT_FOUND');
        }
        await mood.deleteOne();
        logger.success('Mood', 'Đã xóa tâm trạng', { mood: mood.mood });
        return true;
    }
}

export default new MoodService();
