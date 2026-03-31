import express from 'express';
import { validateObjectId } from '../middleware/validateObjectId';
import {
    getMoods,
    getMood,
    createMood,
    updateMood,
    deleteMood
} from '../controllers/moodController';

const router = express.Router();

router.route('/')
    .get(getMoods)
    .post(createMood);

router.route('/:id')
    .all(validateObjectId)
    .get(getMood)
    .put(updateMood)
    .delete(deleteMood);

export default router;
