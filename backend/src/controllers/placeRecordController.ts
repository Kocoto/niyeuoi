import { Request, Response } from 'express';
import placeRecordService from '../services/placeRecordService';

export const getPlaces = async (_req: Request, res: Response) => {
  try {
    const data = await placeRecordService.getAll();
    res.status(200).json({ success: true, count: data.length, data });
  } catch {
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
};

export const getRandomPlace = async (req: Request, res: Response) => {
  try {
    const isVisitedParam = req.query['isVisited'];
    const isVisited = isVisitedParam === 'true' ? true : isVisitedParam === 'false' ? false : undefined;
    const data = await placeRecordService.getRandom(isVisited);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không có địa điểm nào phù hợp' });
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
};

export const createPlace = async (req: Request, res: Response) => {
  try {
    const data = await placeRecordService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    if (err.message?.startsWith('VALIDATION_ERROR')) {
      return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
    }
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
};

export const updatePlace = async (req: Request, res: Response) => {
  try {
    const data = await placeRecordService.update(req.params['id'] as string, req.body);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
};

export const deletePlace = async (req: Request, res: Response) => {
  try {
    await placeRecordService.delete(req.params['id'] as string);
    res.status(200).json({ success: true, data: {} });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
};
