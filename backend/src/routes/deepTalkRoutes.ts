import express from 'express';
import {
    getQuestions, createQuestion, deleteQuestion, generateAiQuestion, answerQuestion,
    getJournalEntries, createJournalEntry, deleteJournalEntry,
} from '../controllers/deepTalkController';
import { validateObjectId } from '../middleware/validateObjectId';

const router = express.Router();

// Questions
router.post('/questions/generate', generateAiQuestion);
router.route('/questions').get(getQuestions).post(createQuestion);
router.delete('/questions/:id', validateObjectId, deleteQuestion);
router.put('/questions/:id/answer', validateObjectId, answerQuestion);

// Journal
router.route('/journal').get(getJournalEntries).post(createJournalEntry);
router.delete('/journal/:id', validateObjectId, deleteJournalEntry);

export default router;
