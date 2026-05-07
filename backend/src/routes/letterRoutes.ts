import express from 'express';
import { validateObjectId } from '../middleware/validateObjectId';
import { getLetters, createLetter, replyToLetter, deleteLetter } from '../controllers/letterController';

const router = express.Router();

router.route('/')
    .get(getLetters)
    .post(createLetter);

router.put('/:id/reply', validateObjectId, replyToLetter);

router.delete('/:id', validateObjectId, deleteLetter);

export default router;
