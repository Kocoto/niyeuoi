import express, { Request, Response } from 'express';
import Location from '../models/Location';
import logger from '../utils/logger';

const router = express.Router();

// Girlfriend gửi vị trí lên
router.post('/', async (req: Request, res: Response) => {
    const { lat, lng, accuracy } = req.body;
    if (lat === undefined || lng === undefined) {
        return res.status(400).json({ success: false, error: 'Thiếu lat/lng' });
    }
    try {
        const location = await Location.findOneAndUpdate(
            {},
            { lat, lng, accuracy },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        logger.info('Location', 'Cập nhật vị trí', { lat, lng, accuracy });
        res.status(200).json({ success: true, data: location });
    } catch (err: any) {
        logger.error('Location', 'Lỗi cập nhật vị trí', err);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
});

// Boyfriend lấy vị trí hiện tại
router.get('/', async (_req: Request, res: Response) => {
    try {
        const location = await Location.findOne().sort({ updatedAt: -1 });
        if (!location) {
            return res.status(404).json({ success: false, error: 'Chưa có vị trí nào' });
        }
        res.status(200).json({ success: true, data: location });
    } catch (err: any) {
        logger.error('Location', 'Lỗi lấy vị trí', err);
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
});

export default router;
