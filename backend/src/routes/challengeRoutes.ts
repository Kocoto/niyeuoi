import express from 'express';
import { getChallenges, createChallenge, updateChallenge, deleteChallenge } from '../controllers/challengeController';

const router = express.Router();

router.route('/').get(getChallenges).post(createChallenge);
router.route('/:id').put(updateChallenge).delete(deleteChallenge);

export default router;
