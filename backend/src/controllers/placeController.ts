import { Request, Response } from 'express';
import placeService from '../services/placeService';

export const getPlaces = async (req: Request, res: Response) => {
    try {
        const places = await placeService.getAllPlaces();
        res.status(200).json({ success: true, count: places.length, data: places });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi lấy danh sách địa điểm' });
    }
};

export const getPlace = async (req: Request, res: Response) => {
    try {
        const place = await placeService.getPlaceById(req.params.id as string);
        res.status(200).json({ success: true, data: place });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy địa điểm' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const createPlace = async (req: Request, res: Response) => {
    try {
        const place = await placeService.createPlace(req.body);
        res.status(201).json({ success: true, data: place });
    } catch (err: any) {
        if (err.message.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi tạo địa điểm' });
    }
};

export const updatePlace = async (req: Request, res: Response) => {
    try {
        const place = await placeService.updatePlace(req.params.id as string, req.body);
        res.status(200).json({ success: true, data: place });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy địa điểm' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi cập nhật' });
    }
};

export const deletePlace = async (req: Request, res: Response) => {
    try {
        await placeService.deletePlace(req.params.id as string);
        res.status(200).json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy địa điểm' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi xóa' });
    }
};

export const getRandomPlace = async (req: Request, res: Response) => {
    try {
        const { category, isVisited } = req.query;
        const isVisitedBool = isVisited === 'true' ? true : isVisited === 'false' ? false : undefined;
        const place = await placeService.getRandomPlace(category as string, isVisitedBool);
        res.status(200).json({ success: true, data: place });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND_LIST') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy địa điểm nào trong danh sách' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi lấy địa điểm ngẫu nhiên' });
    }
};
