import express from 'express';
import multer from 'multer';
import { validateObjectId } from '../middleware/validateObjectId';
import {
    getEntries, createEntry, updateEntry, deleteEntry,
    getSummary, getTrend,
    getGoal, upsertGoal,
    estimate,
} from '../controllers/calorieController';

const router = express.Router();

// In-memory multer cho ảnh món ăn (ước tính calo)
const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Chỉ chấp nhận ảnh JPG, PNG, WEBP'));
    },
});

// Summary / trend / goal / estimate — đặt trước /:id để không bị nuốt
router.get('/summary', getSummary);
router.get('/trend', getTrend);
router.route('/goal')
    .get(getGoal)
    .post(upsertGoal);
router.post('/estimate', memoryUpload.single('image'), estimate);

// Entries
router.route('/')
    .get(getEntries)
    .post(createEntry);
router.route('/:id')
    .put(validateObjectId, updateEntry)
    .delete(validateObjectId, deleteEntry);

export default router;
