import { Request, Response } from 'express';
import Challenge, { type IChallenge } from '../models/Challenge';
import challengeService from '../services/challengeService';
import { generateChallenge } from '../services/aiService';
import { resolveCreatePayload, resolveUpdatePayload } from '../utils/requestIdentity';

export const getChallenges = async (_req: Request, res: Response) => {
    try {
        const challenges = await challengeService.getAllChallenges();
        res.status(200).json({ success: true, count: challenges.length, data: challenges });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const createChallenge = async (req: Request, res: Response) => {
    try {
        const payload = resolveCreatePayload<IChallenge>(req, req.body as Partial<IChallenge>);
        const challenge = await challengeService.createChallenge(payload);
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
        const payload = resolveUpdatePayload<IChallenge>(req.body as Partial<IChallenge>);
        const challenge = await challengeService.updateChallenge(req.params.id as string, payload);
        res.status(200).json({ success: true, data: challenge });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy' });
        }

        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const deleteChallenge = async (req: Request, res: Response) => {
    try {
        await challengeService.deleteChallenge(req.params.id as string);
        res.status(200).json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy' });
        }

        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const generateAiChallenge = async (req: Request, res: Response) => {
    try {
        const existing = await Challenge.find({ isCompleted: false }).select('title').lean();
        const existingTitles = existing.map((challenge: any) => challenge.title);

        const data = await generateChallenge(existingTitles);
        if (!data) {
            return res.status(503).json({ success: false, error: 'AI không sinh được challenge, thử lại sau nhé!' });
        }

        const payload = resolveCreatePayload<IChallenge>(req, {
            ...data,
            isAiGenerated: true,
            forWhom: 'both'
        } as Partial<IChallenge>);
        const challenge = await challengeService.createChallenge(payload);
        res.status(201).json({ success: true, data: challenge });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};
