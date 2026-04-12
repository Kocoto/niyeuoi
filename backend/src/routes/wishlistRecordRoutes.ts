import express from 'express';
import { validateObjectId } from '../middleware/validateObjectId';
import { getWishes, createWish, updateWish, deleteWish } from '../controllers/wishlistRecordController';

const router = express.Router();

router.route('/').get(getWishes).post(createWish);
router.route('/:id').all(validateObjectId).put(updateWish).delete(deleteWish);

export default router;
