import { Request, Response } from 'express';
import reminderService from '../services/reminderService';
import pushService from '../services/pushService';
import { extractSchedule } from '../services/aiService';
import type { IReminder, ReminderOwner } from '../models/Reminder';
import { resolveCreatePayload, getRequestAuthRole, isAuthRole } from '../utils/requestIdentity';

function isOwner(v: unknown): v is ReminderOwner {
    return v === 'boyfriend' || v === 'girlfriend' || v === 'both';
}

export const getReminders = async (req: Request, res: Response) => {
    try {
        const owner = req.query.owner as string;
        const data = await reminderService.getAll(isOwner(owner) ? owner : undefined);
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy nhắc nhở' });
    }
};

export const createReminder = async (req: Request, res: Response) => {
    try {
        const payload = resolveCreatePayload<IReminder>(req, req.body);
        if (!isOwner(payload.owner)) return res.status(400).json({ success: false, error: 'Thiếu owner hợp lệ' });
        const data = await reminderService.create(payload);
        res.status(201).json({ success: true, data });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi khi tạo nhắc nhở' });
    }
};

export const bulkCreateReminders = async (req: Request, res: Response) => {
    try {
        const createdBy = getRequestAuthRole(req) ?? (isAuthRole(req.body?.createdBy) ? req.body.createdBy : undefined);
        if (!createdBy) return res.status(400).json({ success: false, error: 'Thiếu người tạo' });
        const list = Array.isArray(req.body?.reminders) ? req.body.reminders : [];
        const data = await reminderService.bulkCreate(list, createdBy);
        res.status(201).json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi tạo nhắc nhở hàng loạt' });
    }
};

export const updateReminder = async (req: Request, res: Response) => {
    try {
        const data = await reminderService.update(req.params.id as string, req.body);
        res.json({ success: true, data });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy nhắc nhở' });
        res.status(500).json({ success: false, error: 'Lỗi khi cập nhật nhắc nhở' });
    }
};

export const deleteReminder = async (req: Request, res: Response) => {
    try {
        await reminderService.delete(req.params.id as string);
        res.json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy nhắc nhở' });
        res.status(500).json({ success: false, error: 'Lỗi khi xóa nhắc nhở' });
    }
};

export const importSchedule = async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'Không có ảnh được tải lên' });
        const imageBase64 = req.file.buffer.toString('base64');
        const data = await extractSchedule(imageBase64, req.file.mimetype);
        if (!data) return res.status(422).json({ success: false, error: 'Không đọc được lịch từ ảnh' });
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi đọc lịch từ ảnh' });
    }
};

export const subscribePush = async (req: Request, res: Response) => {
    try {
        const owner = getRequestAuthRole(req) ?? (isAuthRole(req.body?.owner) ? req.body.owner : undefined);
        if (!owner) return res.status(400).json({ success: false, error: 'Thiếu vai đăng nhập' });
        await pushService.saveSubscription(req.body?.subscription, owner, owner);
        res.status(201).json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi khi đăng ký thông báo' });
    }
};

export const unsubscribePush = async (req: Request, res: Response) => {
    try {
        await pushService.removeSubscription(req.body?.endpoint);
        res.json({ success: true, data: {} });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi hủy đăng ký thông báo' });
    }
};

export const getChannelStatus = async (_req: Request, res: Response) => {
    try {
        const data = await reminderService.channelStatus();
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy trạng thái kênh' });
    }
};
