import express, { Request, Response } from 'express';
import Location from '../models/Location';
import logger from '../utils/logger';
import { getExpectedPin } from '../utils/authToken';
import { getRequestAuthRole } from '../utils/requestIdentity';
import { createPrivateAccessToken, readPrivateAccessToken } from '../utils/privateAccessToken';

const router = express.Router();
const PRIVATE_ACCESS_SCOPE = 'location-private';

function readPrivateAccessHeader(value: string | string[] | undefined): string | null {
    if (typeof value === 'string') {
        return value;
    }

    if (Array.isArray(value)) {
        return value[0] || null;
    }

    return null;
}

router.post('/private-access', async (req: Request, res: Response) => {
    const sessionRole = getRequestAuthRole(req);
    if (sessionRole !== 'boyfriend') {
        return res.status(403).json({ success: false, error: 'Khong du quyen mo che do rieng' });
    }

    const pin = typeof req.body?.pin === 'string' ? req.body.pin : '';
    const expectedPin = getExpectedPin('boyfriend');

    if (!expectedPin || pin !== expectedPin) {
        return res.status(401).json({ success: false, error: 'Ma PIN khong chinh xac' });
    }

    return res.status(200).json({
        success: true,
        data: createPrivateAccessToken('boyfriend', PRIVATE_ACCESS_SCOPE),
    });
});

// Girlfriend gửi vị trí lên
router.post('/', async (req: Request, res: Response) => {
    const sessionRole = getRequestAuthRole(req);
    if (sessionRole !== 'girlfriend') {
        return res.status(403).json({ success: false, error: 'Khong du quyen cap nhat vi tri' });
    }

    const { lat, lng, accuracy } = req.body;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
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
router.get('/', async (req: Request, res: Response) => {
    const sessionRole = getRequestAuthRole(req);
    if (sessionRole !== 'boyfriend') {
        return res.status(403).json({ success: false, error: 'Khong du quyen xem vi tri hien tai' });
    }

    const privateAccessToken = readPrivateAccessHeader(req.headers['x-private-access-token']);
    if (!privateAccessToken || !readPrivateAccessToken(privateAccessToken, PRIVATE_ACCESS_SCOPE)) {
        return res.status(401).json({ success: false, error: 'Private mode chua duoc mo hoac da het han' });
    }

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
