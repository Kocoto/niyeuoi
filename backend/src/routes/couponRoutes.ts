import express from 'express';
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
    .get(getCoupon)
    .put(updateCoupon)
    .delete(deleteCoupon);

export default router;
