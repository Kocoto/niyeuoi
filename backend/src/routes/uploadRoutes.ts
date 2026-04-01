import express, { Request, Response } from 'express';
import upload from '../middleware/uploadMiddleware';
import logger from '../utils/logger';

const router = express.Router();

router.post('/', (req: Request, res: Response) => {
    upload.single('image')(req, res, (err: any) => {
        if (err) {
            logger.error('Upload', 'Multer/Cloudinary error', err);
            return res.status(500).json({
                success: false,
                message: `Lỗi upload: ${err.message || 'Unknown error'}`,
            });
        }

        const file = (req as any).file;
        if (!file) {
            logger.warn('Upload', 'Không tìm thấy file trong request');
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy file để upload',
            });
        }

        logger.success('Upload', 'Upload thành công', { url: file.path, public_id: file.filename });
        res.status(200).json({
            success: true,
            data: {
                url: file.path,
                public_id: file.filename,
            },
        });
    });
});

export default router;
