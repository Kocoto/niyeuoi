import Challenge, { IChallenge } from '../models/Challenge';
import notificationService from './notificationService';

class ChallengeService {
    async getAllChallenges() {
        return await Challenge.find().sort({ createdAt: -1 });
    }

    async createChallenge(data: Partial<IChallenge>) {
        const challenge = await Challenge.create(data);
        await notificationService.sendDiscord(
            '🔥 Thử thách Tình yêu mới!',
            `Nhiệm vụ: **${challenge.title}**\nĐộ khó: ${challenge.difficulty}\nĐiểm thưởng: **${challenge.points} ✨**\nCùng nhau thực hiện nhé!`,
            15105570 // Cam
        );
        return challenge;
    }

    async updateChallenge(id: string, data: Partial<IChallenge>) {
        const oldChallenge = await Challenge.findById(id);
        const challenge = await Challenge.findByIdAndUpdate(id, data, { new: true });
        if (!challenge) throw new Error('NOT_FOUND');

        if (!oldChallenge?.isCompleted && challenge.isCompleted) {
            await notificationService.sendDiscord(
                '🏆 Thử thách đã hoàn thành!',
                `Chúc mừng hai bạn đã vượt qua thử thách: **${challenge.title}**\nCộng ngay **${challenge.points} điểm** vào quỹ hạnh phúc! 🎉`,
                3066993 // Xanh lá
            );
        }

        return challenge;
    }

    async deleteChallenge(id: string) {
        const challenge = await Challenge.findById(id);
        if (!challenge) throw new Error('NOT_FOUND');
        await challenge.deleteOne();
        return true;
    }
}

export default new ChallengeService();
