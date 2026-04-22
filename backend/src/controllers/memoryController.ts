import { Request, Response } from 'express';
import type { IMemory, MemoryResurfacingReason } from '../models/Memory';
import memoryService from '../services/memoryService';
import { resolveCreatePayload, resolveUpdatePayload } from '../utils/requestIdentity';

export const getMemories = async (req: Request, res: Response) => {
    try {
        const memories = await memoryService.getAllMemories();
        res.status(200).json({ success: true, count: memories.length, data: memories });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi lấy danh sách kỷ niệm' });
    }
};

export const getMemory = async (req: Request, res: Response) => {
    try {
        const memory = await memoryService.getMemoryById(req.params.id as string);
        res.status(200).json({ success: true, data: memory });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy kỷ niệm' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const getResurfacingMemories = async (_req: Request, res: Response) => {
    try {
        const memories = await memoryService.getResurfacingCandidates();
        res.status(200).json({ success: true, count: memories.length, data: memories });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi lấy memory resurfacing' });
    }
};

export const createMemory = async (req: Request, res: Response) => {
    try {
        const payload = resolveCreatePayload<IMemory>(req, req.body as Partial<IMemory>);
        const memory = await memoryService.createMemory(payload);
        res.status(201).json({ success: true, data: memory });
    } catch (err: any) {
        if (err.message.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi tạo kỷ niệm' });
    }
};

export const updateMemory = async (req: Request, res: Response) => {
    try {
        const payload = resolveUpdatePayload<IMemory>(req.body as Partial<IMemory>);
        const memory = await memoryService.updateMemory(req.params.id as string, payload);
        res.status(200).json({ success: true, data: memory });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy kỷ niệm' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi cập nhật' });
    }
};

export const deleteMemory = async (req: Request, res: Response) => {
    try {
        await memoryService.deleteMemory(req.params.id as string);
        res.status(200).json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy kỷ niệm' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi xóa' });
    }
};

export const markMemoryResurfaced = async (req: Request, res: Response) => {
    try {
        const reason = req.body?.reason as MemoryResurfacingReason | undefined;
        const memory = await memoryService.markMemoryResurfaced(req.params.id as string, reason ?? 'anniversary_day');
        res.status(200).json({ success: true, data: memory });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy kỷ niệm' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi đánh dấu memory resurfacing' });
    }
};
