import express from 'express';
import multer from 'multer';
import { validateObjectId } from '../middleware/validateObjectId';
import {
    getReminders, createReminder, bulkCreateReminders, updateReminder, deleteReminder,
    importSchedule, subscribePush, unsubscribePush, getChannelStatus,
} from '../controllers/reminderController';

const router = express.Router();

const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Chỉ chấp nhận ảnh JPG, PNG, WEBP'));
    },
});

// Đặt route cụ thể trước /:id
router.post('/bulk', bulkCreateReminders);
router.post('/import', memoryUpload.single('image'), importSchedule);
router.post('/subscribe', subscribePush);
router.post('/unsubscribe', unsubscribePush);
router.get('/channels/status', getChannelStatus);

router.route('/')
    .get(getReminders)
    .post(createReminder);
router.route('/:id')
    .put(validateObjectId, updateReminder)
    .delete(validateObjectId, deleteReminder);

export default router;
