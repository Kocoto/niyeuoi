import express from 'express';
import { getChallenges, createChallenge, updateChallenge, deleteChallenge } from '../controllers/challengeController';
import { validateObjectId } from '../middleware/validateObjectId';

const router = express.Router();

router.route('/').get(getChallenges).post(createChallenge);
router.route('/:id').all(validateObjectId).put(updateChallenge).delete(deleteChallenge);

export default router;
