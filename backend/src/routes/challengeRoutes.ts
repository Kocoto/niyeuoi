import express from 'express';
import { getChallenges, createChallenge, updateChallenge, deleteChallenge, generateAiChallenge } from '../controllers/challengeController';
import { validateObjectId } from '../middleware/validateObjectId';

const router = express.Router();

router.post('/generate', generateAiChallenge);
router.route('/').get(getChallenges).post(createChallenge);
router.route('/:id').all(validateObjectId).put(updateChallenge).delete(deleteChallenge);

export default router;
