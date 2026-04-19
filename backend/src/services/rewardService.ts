import Reward, {
    IReward,
    REWARD_KIND_VALUES,
    REWARD_PARTY_VALUES,
    REWARD_RESOURCE_VALUES,
    REWARD_STATUS_VALUES,
    REWARD_SURFACE_VALUES,
    REWARD_TRIGGER_VALUES,
    type RewardKind,
    type RewardParty,
    type RewardResourceType,
    type RewardStatus,
    type RewardSurface,
    type RewardTriggerType
} from '../models/Reward';
import logger from '../utils/logger';
import type { AuthRole } from '../utils/authToken';

type RewardCreateInput = Partial<IReward> & {
    triggerType: RewardTriggerType;
    rewardKind: RewardKind;
    title: string;
    sourceType: RewardResourceType;
    sourceId: string;
};

type RewardListOptions = {
    status?: RewardStatus;
    surfaceHint?: RewardSurface;
    forWhom?: AuthRole;
};

type RewardContractRule = {
    rewardKinds: RewardKind[];
    defaultSurface: RewardSurface;
};

const ACTIVE_REWARD_STATUS: RewardStatus[] = ['pending', 'revealed'];
const TERMINAL_REWARD_STATUS: RewardStatus[] = ['consumed', 'dismissed', 'expired'];

export const REWARD_TRIGGER_RULES: Record<RewardTriggerType, RewardContractRule> = {
    challenge_completed: {
        rewardKinds: ['coupon', 'challenge'],
        defaultSurface: 'challenge'
    },
    deeptalk_paired: {
        rewardKinds: ['coupon', 'prompt', 'date_suggestion'],
        defaultSurface: 'deeptalk'
    },
    mood_weekly_sync: {
        rewardKinds: ['coupon', 'date_suggestion', 'memory_highlight'],
        defaultSurface: 'mood'
    },
    event_completed: {
        rewardKinds: ['coupon', 'date_suggestion', 'memory_highlight'],
        defaultSurface: 'event'
    }
};

const isRewardTriggerType = (value: unknown): value is RewardTriggerType =>
    typeof value === 'string' && REWARD_TRIGGER_VALUES.includes(value as RewardTriggerType);

const isRewardKind = (value: unknown): value is RewardKind =>
    typeof value === 'string' && REWARD_KIND_VALUES.includes(value as RewardKind);

const isRewardStatus = (value: unknown): value is RewardStatus =>
    typeof value === 'string' && REWARD_STATUS_VALUES.includes(value as RewardStatus);

const isRewardSurface = (value: unknown): value is RewardSurface =>
    typeof value === 'string' && REWARD_SURFACE_VALUES.includes(value as RewardSurface);

const isRewardParty = (value: unknown): value is RewardParty =>
    typeof value === 'string' && REWARD_PARTY_VALUES.includes(value as RewardParty);

const isRewardResourceType = (value: unknown): value is RewardResourceType =>
    typeof value === 'string' && REWARD_RESOURCE_VALUES.includes(value as RewardResourceType);

const isRewardCreator = (value: unknown): value is AuthRole | 'system' =>
    value === 'boyfriend' || value === 'girlfriend' || value === 'system';

const trimString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const buildRewardDedupeKey = (payload: Partial<IReward>) =>
    [
        payload.triggerType,
        payload.sourceType,
        payload.sourceId,
        payload.rewardKind,
        payload.rewardType ?? 'none',
        payload.rewardId ?? 'none',
        payload.forWhom ?? 'both'
    ].join(':');

const normalizeRewardPayload = (data: Partial<IReward>) => {
    const payload: Partial<IReward> = { ...data };

    if (!isRewardTriggerType(payload.triggerType)) {
        throw new Error('VALIDATION_ERROR: trigger reward không hợp lệ');
    }

    if (!isRewardKind(payload.rewardKind)) {
        throw new Error('VALIDATION_ERROR: loại reward không hợp lệ');
    }

    const rule = REWARD_TRIGGER_RULES[payload.triggerType];
    if (!rule.rewardKinds.includes(payload.rewardKind)) {
        throw new Error('VALIDATION_ERROR: reward này không phù hợp với trigger đã chọn');
    }

    payload.title = trimString(payload.title);
    if (!payload.title) {
        throw new Error('VALIDATION_ERROR: tiêu đề reward là bắt buộc');
    }

    payload.description = trimString(payload.description);

    if (!isRewardResourceType(payload.sourceType)) {
        throw new Error('VALIDATION_ERROR: nguồn mở reward không hợp lệ');
    }

    payload.sourceId = trimString(payload.sourceId);
    if (!payload.sourceId) {
        throw new Error('VALIDATION_ERROR: ID nguồn mở reward là bắt buộc');
    }

    payload.sourceLabel = trimString(payload.sourceLabel) || undefined;

    if (payload.rewardType && !isRewardResourceType(payload.rewardType)) {
        throw new Error('VALIDATION_ERROR: loại resource reward không hợp lệ');
    }

    payload.rewardId = trimString(payload.rewardId) || undefined;

    if (payload.surfaceHint && !isRewardSurface(payload.surfaceHint)) {
        throw new Error('VALIDATION_ERROR: điểm đọc reward không hợp lệ');
    }
    payload.surfaceHint = payload.surfaceHint ?? rule.defaultSurface;

    if (payload.forWhom && !isRewardParty(payload.forWhom)) {
        throw new Error('VALIDATION_ERROR: đối tượng nhận reward không hợp lệ');
    }
    payload.forWhom = payload.forWhom ?? 'both';

    if (payload.createdBy && !isRewardCreator(payload.createdBy)) {
        delete payload.createdBy;
    }
    payload.createdBy = payload.createdBy ?? 'system';

    if (payload.status && !isRewardStatus(payload.status)) {
        throw new Error('VALIDATION_ERROR: trạng thái reward không hợp lệ');
    }
    payload.status = payload.status ?? 'pending';

    if (payload.expiresAt && Number.isNaN(new Date(payload.expiresAt).getTime())) {
        delete payload.expiresAt;
    }

    payload.dedupeKey = trimString(payload.dedupeKey) || buildRewardDedupeKey(payload);

    return payload;
};

class RewardService {
    async getAllRewards(options: RewardListOptions = {}) {
        logger.info('Reward', 'Lấy danh sách reward', options);

        const query: Record<string, unknown> = {};

        if (options.status && isRewardStatus(options.status)) {
            query.status = options.status;
        }

        if (options.surfaceHint && isRewardSurface(options.surfaceHint)) {
            query.surfaceHint = options.surfaceHint;
        }

        if (options.forWhom) {
            query.forWhom = { $in: [options.forWhom, 'both'] };
        }

        const rewards = await Reward.find(query).sort({ createdAt: -1 });
        logger.success('Reward', `Trả về ${rewards.length} reward`);
        return rewards;
    }

    async createReward(data: RewardCreateInput) {
        const payload = normalizeRewardPayload(data);
        logger.info('Reward', 'Tạo reward mới', {
            triggerType: payload.triggerType,
            rewardKind: payload.rewardKind,
            sourceType: payload.sourceType,
            sourceId: payload.sourceId,
            surfaceHint: payload.surfaceHint
        });

        const existing = await Reward.findOne({
            dedupeKey: payload.dedupeKey,
            status: { $in: ACTIVE_REWARD_STATUS }
        });

        if (existing) {
            logger.info('Reward', 'Reward đang còn active, giữ lại record cũ', {
                id: existing._id,
                dedupeKey: existing.dedupeKey
            });
            return existing;
        }

        try {
            const reward = await Reward.create(payload);
            logger.success('Reward', 'Tạo reward thành công', {
                id: reward._id,
                triggerType: reward.triggerType,
                rewardKind: reward.rewardKind
            });
            return reward;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                logger.error('Reward', 'Lỗi validation khi tạo reward', messages);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }

            logger.error('Reward', 'Lỗi khi tạo reward', error);
            throw error;
        }
    }

    async updateRewardStatus(id: string, status: RewardStatus) {
        if (!isRewardStatus(status)) {
            throw new Error('VALIDATION_ERROR: trạng thái reward không hợp lệ');
        }

        logger.info('Reward', 'Cập nhật trạng thái reward', { id, status });
        const reward = await Reward.findById(id);

        if (!reward) {
            logger.warn('Reward', 'Không tìm thấy reward để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }

        reward.status = status;

        if (status === 'revealed' && !reward.openedAt) {
            reward.openedAt = new Date();
        }

        if (TERMINAL_REWARD_STATUS.includes(status)) {
            reward.resolvedAt = new Date();
        }

        await reward.save();
        logger.success('Reward', 'Đã cập nhật trạng thái reward', {
            id: reward._id,
            status: reward.status
        });
        return reward;
    }
}

export default new RewardService();
