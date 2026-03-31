import { Request, Response } from 'express';
import challengeService from '../services/challengeService.js';

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
    } catch (err) {
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
