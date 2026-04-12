import express from 'express';
import { validateObjectId } from '../middleware/validateObjectId';
import {
  getCoupons,
  getCoupon,
  createCoupon,
  claimCoupon,
  useCoupon,
  deleteCoupon,
  generateAiCoupon,
} from '../controllers/couponRecordController';

const router = express.Router();

router.post('/generate', generateAiCoupon);

router.route('/')
  .get(getCoupons)
  .post(createCoupon);

router.route('/:id')
  .all(validateObjectId)
  .get(getCoupon)
  .delete(deleteCoupon);

router.post('/:id/claim', validateObjectId, claimCoupon);
router.post('/:id/use', validateObjectId, useCoupon);

export default router;
