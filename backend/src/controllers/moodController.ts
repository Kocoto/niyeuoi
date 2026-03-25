import { Request, Response } from 'express';
import moodService from '../services/moodService.js';

export const getMoods = async (req: Request, res: Response) => {
    try {
        const moods = await moodService.getAllMoods();
        res.status(200).json({ success: true, count: moods.length, data: moods });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi lấy danh sách tâm trạng' });
    }
};

export const getMood = async (req: Request, res: Response) => {
    try {
        const mood = await moodService.getMoodById(req.params.id as string);
        res.status(200).json({ success: true, data: mood });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy tâm trạng' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const createMood = async (req: Request, res: Response) => {
    try {
        const mood = await moodService.createMood(req.body);
        res.status(201).json({ success: true, data: mood });
    } catch (err: any) {
        if (err.message.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi tạo tâm trạng' });
    }
};

export const updateMood = async (req: Request, res: Response) => {
    try {
        const mood = await moodService.updateMood(req.params.id as string, req.body);
        res.status(200).json({ success: true, data: mood });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy tâm trạng' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi cập nhật' });
    }
};

export const deleteMood = async (req: Request, res: Response) => {
    try {
        await moodService.deleteMood(req.params.id as string);
        res.status(200).json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy tâm trạng' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi xóa' });
    }
};
