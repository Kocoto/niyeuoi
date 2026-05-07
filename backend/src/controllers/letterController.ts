import { Request, Response } from 'express';
import letterService from '../services/letterService';
import type { ILetter } from '../models/Letter';
import { resolveCreatePayload, getRequestAuthRole, isAuthRole } from '../utils/requestIdentity';

export const getLetters = async (_req: Request, res: Response) => {
    try {
        const letters = await letterService.getAllLetters();
        res.status(200).json({ success: true, count: letters.length, data: letters });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi lấy danh sách' });
    }
};

export const createLetter = async (req: Request, res: Response) => {
    try {
        const payload = resolveCreatePayload<ILetter>(req, req.body as Partial<ILetter>);
        const letter = await letterService.createLetter(payload);
        res.status(201).json({ success: true, data: letter });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi tạo lời' });
    }
};

export const replyToLetter = async (req: Request, res: Response) => {
    try {
        const { reply } = req.body as { reply: string };
        if (!reply?.trim()) {
            return res.status(400).json({ success: false, error: 'Nội dung trả lời không được để trống.' });
        }
        const sessionRole = getRequestAuthRole(req);
        const repliedBy = sessionRole ?? (isAuthRole(req.body.repliedBy) ? req.body.repliedBy : undefined);
        if (!repliedBy) {
            return res.status(400).json({ success: false, error: 'Không xác định được người trả lời.' });
        }
        const letter = await letterService.replyToLetter(req.params.id as string, reply.trim(), repliedBy);
        res.status(200).json({ success: true, data: letter });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy lời muốn nói.' });
        }
        if (err.message === 'ALREADY_REPLIED') {
            return res.status(400).json({ success: false, error: 'Lời này đã có trả lời rồi.' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi trả lời' });
    }
};

export const deleteLetter = async (req: Request, res: Response) => {
    try {
        await letterService.deleteLetter(req.params.id as string);
        res.status(200).json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy lời muốn nói.' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi xóa' });
    }
};
