import express from 'express';
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
    .get(getMood)
    .put(updateMood)
    .delete(deleteMood);

export default router;
