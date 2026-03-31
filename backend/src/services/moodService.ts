import Mood, { IMood } from '../models/Mood';
import notificationService from './notificationService';

class MoodService {
    async getAllMoods() {
        return await Mood.find().sort({ date: -1 });
    }

    async getMoodById(id: string) {
        const mood = await Mood.findById(id);
        if (!mood) throw new Error('NOT_FOUND');
        return mood;
    }

    async createMood(data: Partial<IMood>) {
        try {
            const mood = await Mood.create(data);
            
            // Xác định màu sắc và icon cho thông báo dựa trên mood
            let emoji = '✨';
            let color = 15277667; // Mặc định hồng

            if (mood.mood === 'Hạnh phúc') { emoji = '😊'; color = 16776960; }
            if (mood.mood === 'Đang yêu') { emoji = '❤️'; color = 15548997; }
            if (mood.mood === 'Bình yên') { emoji = '☕'; color = 15105570; }
            if (mood.mood === 'Hơi buồn') { emoji = '🌧️'; color = 3447003; }
            if (mood.mood === 'Mệt mỏi') { emoji = '😫'; color = 9807270; }

            await notificationService.sendDiscord(
                `${emoji} Cập nhật tâm trạng mới!`,
                `Người ấy đang cảm thấy: **${mood.mood}**\n<i>"${mood.note || 'Không có lời nhắn nào'}"</i>`,
                color
            );

            return mood;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async updateMood(id: string, data: Partial<IMood>) {
        const mood = await Mood.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!mood) throw new Error('NOT_FOUND');
        return mood;
    }

    async deleteMood(id: string) {
        const mood = await Mood.findById(id);
        if (!mood) throw new Error('NOT_FOUND');
        await mood.deleteOne();
        return true;
    }
}

export default new MoodService();
