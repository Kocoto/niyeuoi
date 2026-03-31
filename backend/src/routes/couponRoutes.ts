import express from 'express';
import { validateObjectId } from '../middleware/validateObjectId';
import {
    getCoupons,
    getCoupon,
    createCoupon,
    updateCoupon,
    deleteCoupon
} from '../controllers/couponController';

const router = express.Router();

router.route('/')
    .get(getCoupons)
    .post(createCoupon);

router.route('/:id')
    .all(validateObjectId)
    .get(getCoupon)
    .put(updateCoupon)
    .delete(deleteCoupon);

export default router;
