import { Request, Response } from 'express';
import wishlistRecordService from '../services/wishlistRecordService';

export const getWishes = async (_req: Request, res: Response) => {
  try {
    const data = await wishlistRecordService.getAll();
    res.status(200).json({ success: true, count: data.length, data });
  } catch {
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
};

export const createWish = async (req: Request, res: Response) => {
  try {
    const data = await wishlistRecordService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    if (err.message?.startsWith('VALIDATION_ERROR')) {
      return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
    }
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
};

export const updateWish = async (req: Request, res: Response) => {
  try {
    const data = await wishlistRecordService.update(req.params['id'] as string, req.body);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
};

export const deleteWish = async (req: Request, res: Response) => {
  try {
    await wishlistRecordService.delete(req.params['id'] as string);
    res.status(200).json({ success: true, data: {} });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
};
