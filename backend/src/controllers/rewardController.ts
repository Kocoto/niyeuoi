import { Request, Response } from 'express';
import rewardService from '../services/rewardService';
import { REWARD_STATUS_VALUES, REWARD_SURFACE_VALUES } from '../models/Reward';
import type { RewardStatus, RewardSurface } from '../models/Reward';
import { isAuthRole } from '../utils/requestIdentity';

const isRewardStatus = (value: unknown): value is RewardStatus =>
    typeof value === 'string' && REWARD_STATUS_VALUES.includes(value as RewardStatus);

const isRewardSurface = (value: unknown): value is RewardSurface =>
    typeof value === 'string' && REWARD_SURFACE_VALUES.includes(value as RewardSurface);

export const getRewards = async (req: Request, res: Response) => {
    try {
        const status = isRewardStatus(req.query.status) ? req.query.status : undefined;
        const surfaceHint = isRewardSurface(req.query.surface) ? req.query.surface : undefined;
        const forWhom = isAuthRole(req.query.forWhom) ? req.query.forWhom : undefined;

        const rewards = await rewardService.getAllRewards({ status, surfaceHint, forWhom });
        res.status(200).json({ success: true, count: rewards.length, data: rewards });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi lấy reward' });
    }
};

export const updateRewardStatus = async (req: Request, res: Response) => {
    try {
        const status = req.body?.status;
        if (!isRewardStatus(status)) {
            return res.status(400).json({ success: false, error: 'trạng thái reward không hợp lệ' });
        }

        const reward = await rewardService.updateRewardStatus(req.params.id as string, status);
        res.status(200).json({ success: true, data: reward });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }

        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy reward' });
        }

        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi cập nhật reward' });
    }
};
