import express from 'express';
import { validateObjectId } from '../middleware/validateObjectId';
import {
    getCoupons,
    getCoupon,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    generateAiCoupon
} from '../controllers/couponController';

const router = express.Router();

router.post('/generate', generateAiCoupon);
router.route('/')
    .get(getCoupons)
    .post(createCoupon);

router.route('/:id')
    .all(validateObjectId)
    .get(getCoupon)
    .put(updateCoupon)
    .delete(deleteCoupon);

export default router;
