import express from 'express';
import { validateObjectId } from '../middleware/validateObjectId';
import { getRewards, updateRewardStatus } from '../controllers/rewardController';

const router = express.Router();

router.route('/').get(getRewards);
router.patch('/:id/status', validateObjectId, updateRewardStatus);

export default router;
