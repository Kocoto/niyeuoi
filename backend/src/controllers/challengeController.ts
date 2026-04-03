import { Request, Response } from 'express';
import challengeService from '../services/challengeService';
import { generateChallenge } from '../services/aiService';
import Challenge from '../models/Challenge';

export const getChallenges = async (req: Request, res: Response) => {
    try {
        const challenges = await challengeService.getAllChallenges();
        res.status(200).json({ success: true, count: challenges.length, data: challenges });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const createChallenge = async (req: Request, res: Response) => {
    try {
        const challenge = await challengeService.createChallenge(req.body);
        res.status(201).json({ success: true, data: challenge });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const updateChallenge = async (req: Request, res: Response) => {
    try {
        const challenge = await challengeService.updateChallenge(req.params.id as string, req.body);
        res.status(200).json({ success: true, data: challenge });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy' });
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const deleteChallenge = async (req: Request, res: Response) => {
    try {
        await challengeService.deleteChallenge(req.params.id as string);
        res.status(200).json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy' });
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const generateAiChallenge = async (_req: Request, res: Response) => {
    try {
        const existing = await Challenge.find({ isCompleted: false }).select('title').lean();
        const existingTitles = existing.map((c: any) => c.title);

        const data = await generateChallenge(existingTitles);
        if (!data) {
            return res.status(503).json({ success: false, error: 'AI không sinh được thử thách, thử lại sau nhé!' });
        }

        const challenge = await challengeService.createChallenge({ ...data, isAiGenerated: true } as any);
        res.status(201).json({ success: true, data: challenge });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};
