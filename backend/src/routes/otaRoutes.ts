import express from 'express';
import multer from 'multer';
import { checkUpdate, noop, publishBundle } from '../controllers/otaController';

const router = express.Router();

// Zip bundle có thể vài MB -> giữ trong RAM rồi đẩy thẳng lên Cloudinary.
const uploadZip = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
});

// Capgo plugin (self-hosted auto-update) gọi các endpoint này:
router.post('/updates', checkUpdate); // kiểm tra có bản mới không
router.post('/stats', noop);          // thống kê -> bỏ qua
router.post('/channel', noop);        // channel -> bỏ qua

// Phát hành bản mới (chạy từ script release, bảo vệ bằng x-ota-secret).
router.post('/bundles', uploadZip.single('bundle'), publishBundle);

export default router;
