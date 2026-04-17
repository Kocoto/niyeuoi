import Challenge, { CHALLENGE_TARGET_VALUES, IChallenge, type ChallengeTarget } from '../models/Challenge';
import notificationService from './notificationService';
import logger from '../utils/logger';
import type { AuthRole } from '../utils/authToken';

const ROLE_LABEL: Record<AuthRole, string> = {
    boyfriend: 'Được',
    girlfriend: 'Ni'
};

const CHALLENGE_TARGET_LABEL: Record<ChallengeTarget, string> = {
    boyfriend: 'Được',
    girlfriend: 'Ni',
    both: 'cả hai'
};

const isAuthRole = (value: unknown): value is AuthRole =>
    value === 'boyfriend' || value === 'girlfriend';

const isChallengeTarget = (value: unknown): value is ChallengeTarget =>
    typeof value === 'string' && CHALLENGE_TARGET_VALUES.includes(value as ChallengeTarget);

const normalizeChallengePayload = (data: Partial<IChallenge>) => {
    const payload: Partial<IChallenge> = { ...data };

    if (typeof payload.description === 'string') {
        payload.description = payload.description.trim();
    }

    if (!isChallengeTarget(payload.forWhom)) {
        delete payload.forWhom;
    }

    if (typeof payload.points === 'number' && Number.isFinite(payload.points)) {
        payload.points = Math.max(0, payload.points);
    }

    return payload;
};

const getChallengeDirectionLabel = (challenge: Pick<IChallenge, 'createdBy' | 'forWhom'>) => {
    if (challenge.forWhom === 'both') {
        return 'Cùng nhau';
    }

    if (isAuthRole(challenge.createdBy) && isChallengeTarget(challenge.forWhom)) {
        return `${ROLE_LABEL[challenge.createdBy]} dành cho ${CHALLENGE_TARGET_LABEL[challenge.forWhom]}`;
    }

    if (isChallengeTarget(challenge.forWhom)) {
        return `Dành cho ${CHALLENGE_TARGET_LABEL[challenge.forWhom]}`;
    }

    if (isAuthRole(challenge.createdBy)) {
        return `Khởi xướng bởi ${ROLE_LABEL[challenge.createdBy]}`;
    }

    return 'Đang giữ từ trước';
};

const buildChallengeNotificationMessage = (challenge: IChallenge) =>
    `Challenge: **${challenge.title}**\nHướng: ${getChallengeDirectionLabel(challenge)}\nĐộ khó: ${challenge.difficulty}\nNhịp thưởng: ${challenge.points}\n<i>"${challenge.description || 'Giữ lại để cả hai có thêm một điều đáng làm cùng nhau.'}"</i>`;

class ChallengeService {
    async getAllChallenges() {
        logger.info('Challenge', 'Lấy danh sách challenge');
        const challenges = await Challenge.find().sort({ createdAt: -1 });
        logger.success('Challenge', `Trả về ${challenges.length} challenge`);
        return challenges;
    }

    async createChallenge(data: Partial<IChallenge>) {
        const payload = normalizeChallengePayload(data);
        logger.info('Challenge', 'Tạo challenge mới', {
            title: payload.title,
            difficulty: payload.difficulty,
            points: payload.points,
            createdBy: payload.createdBy,
            forWhom: payload.forWhom
        });

        try {
            const challenge = await Challenge.create(payload);
            logger.success('Challenge', 'Tạo challenge thành công', { id: challenge._id, title: challenge.title });

            logger.info('Challenge', 'Gửi thông báo Discord...');
            await notificationService.sendDiscord(
                '💞 Có một challenge mới cho hai bạn',
                buildChallengeNotificationMessage(challenge),
                15105570
            );
            logger.success('Challenge', 'Đã gửi thông báo Discord');

            return challenge;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                logger.error('Challenge', 'Lỗi validation khi tạo challenge', messages);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }

            logger.error('Challenge', 'Lỗi khi tạo challenge', error);
            throw error;
        }
    }

    async updateChallenge(id: string, data: Partial<IChallenge>) {
        logger.info('Challenge', 'Cập nhật challenge', { id, fields: Object.keys(data) });
        const oldChallenge = await Challenge.findById(id);
        const payload = normalizeChallengePayload(data);
        const challenge = await Challenge.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true
        });

        if (!challenge) {
            logger.warn('Challenge', 'Không tìm thấy challenge để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }

        logger.success('Challenge', 'Cập nhật challenge thành công', {
            title: challenge.title,
            isCompleted: challenge.isCompleted,
            createdBy: challenge.createdBy,
            forWhom: challenge.forWhom
        });

        if (!oldChallenge?.isCompleted && challenge.isCompleted) {
            logger.info('Challenge', 'Challenge vừa được hoàn thành, gửi thông báo Discord...', {
                title: challenge.title,
                points: challenge.points
            });
            await notificationService.sendDiscord(
                '🌿 Một challenge vừa được khép lại',
                `Challenge **${challenge.title}** đã hoàn thành.\nHướng: ${getChallengeDirectionLabel(challenge)}\nNhịp thưởng: ${challenge.points}\n🎉`,
                3066993
            );
            logger.success('Challenge', 'Đã gửi thông báo Discord hoàn thành');
        }

        return challenge;
    }

    async deleteChallenge(id: string) {
        logger.info('Challenge', 'Xóa challenge', { id });
        const challenge = await Challenge.findById(id);
        if (!challenge) {
            logger.warn('Challenge', 'Không tìm thấy challenge để xóa', { id });
            throw new Error('NOT_FOUND');
        }

        await challenge.deleteOne();
        logger.success('Challenge', 'Đã xóa challenge', { title: challenge.title });
        return true;
    }
}

export default new ChallengeService();
