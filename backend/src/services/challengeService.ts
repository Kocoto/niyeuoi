import Challenge, { IChallenge } from '../models/Challenge';
import notificationService from './notificationService';
import logger from '../utils/logger';

class ChallengeService {
    async getAllChallenges() {
        logger.info('Challenge', 'Lấy danh sách thử thách');
        const challenges = await Challenge.find().sort({ createdAt: -1 });
        logger.success('Challenge', `Trả về ${challenges.length} thử thách`);
        return challenges;
    }

    async createChallenge(data: Partial<IChallenge>) {
        logger.info('Challenge', 'Tạo thử thách mới', { title: data.title, difficulty: data.difficulty, points: data.points });
        try {
            const challenge = await Challenge.create(data);
            logger.success('Challenge', 'Tạo thử thách thành công', { id: challenge._id, title: challenge.title });

            logger.info('Challenge', 'Gửi thông báo Discord...');
            await notificationService.sendDiscord(
                '🔥 Thử thách Tình yêu mới!',
                `Nhiệm vụ: **${challenge.title}**\nĐộ khó: ${challenge.difficulty}\nĐiểm thưởng: **${challenge.points} ✨**\nCùng nhau thực hiện nhé!`,
                15105570
            );
            logger.success('Challenge', 'Đã gửi thông báo Discord');

            return challenge;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                logger.error('Challenge', 'Lỗi validation khi tạo thử thách', messages);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            logger.error('Challenge', 'Lỗi khi tạo thử thách', error);
            throw error;
        }
    }

    async updateChallenge(id: string, data: Partial<IChallenge>) {
        logger.info('Challenge', 'Cập nhật thử thách', { id, fields: Object.keys(data) });
        const oldChallenge = await Challenge.findById(id);
        const challenge = await Challenge.findByIdAndUpdate(id, data, { new: true });
        if (!challenge) {
            logger.warn('Challenge', 'Không tìm thấy thử thách để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Challenge', 'Cập nhật thành công', { title: challenge.title, isCompleted: challenge.isCompleted });

        if (!oldChallenge?.isCompleted && challenge.isCompleted) {
            logger.info('Challenge', `Thử thách "${challenge.title}" vừa hoàn thành! +${challenge.points} điểm. Gửi thông báo...`);
            await notificationService.sendDiscord(
                '🏆 Thử thách đã hoàn thành!',
                `Chúc mừng hai bạn đã vượt qua thử thách: **${challenge.title}**\nCộng ngay **${challenge.points} điểm** vào quỹ hạnh phúc! 🎉`,
                3066993
            );
            logger.success('Challenge', 'Đã gửi thông báo Discord hoàn thành');
        }

        return challenge;
    }

    async deleteChallenge(id: string) {
        logger.info('Challenge', 'Xóa thử thách', { id });
        const challenge = await Challenge.findById(id);
        if (!challenge) {
            logger.warn('Challenge', 'Không tìm thấy thử thách để xóa', { id });
            throw new Error('NOT_FOUND');
        }
        await challenge.deleteOne();
        logger.success('Challenge', 'Đã xóa thử thách', { title: challenge.title });
        return true;
    }
}

export default new ChallengeService();
