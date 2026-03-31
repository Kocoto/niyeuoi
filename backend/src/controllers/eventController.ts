import { Request, Response } from 'express';
import eventService from '../services/eventService';

export const getEvents = async (req: Request, res: Response) => {
    try {
        const events = await eventService.getAllEvents();
        res.status(200).json({ success: true, count: events.length, data: events });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi lấy sự kiện' });
    }
};

export const getEvent = async (req: Request, res: Response) => {
    try {
        const event = await eventService.getEventById(req.params.id as string);
        res.status(200).json({ success: true, data: event });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy sự kiện' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const createEvent = async (req: Request, res: Response) => {
    try {
        const event = await eventService.createEvent(req.body);
        res.status(201).json({ success: true, data: event });
    } catch (err: any) {
        if (err.message.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi tạo sự kiện' });
    }
};

export const updateEvent = async (req: Request, res: Response) => {
    try {
        const event = await eventService.updateEvent(req.params.id as string, req.body);
        res.status(200).json({ success: true, data: event });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy sự kiện' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi cập nhật' });
    }
};

export const deleteEvent = async (req: Request, res: Response) => {
    try {
        await eventService.deleteEvent(req.params.id as string);
        res.status(200).json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy sự kiện' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi xóa' });
    }
};
