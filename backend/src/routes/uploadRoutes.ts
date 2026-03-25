import express from 'express';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/', upload.single('image'), (req: any, res: any) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Không tìm thấy file để upload'
        });
    }

    res.status(200).json({
        success: true,
        data: {
            url: req.file.path,
            public_id: req.file.filename
        }
    });
});

export default router;
