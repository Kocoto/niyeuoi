import express from 'express';
import { validateObjectId } from '../middleware/validateObjectId';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/eventRecordController';

const router = express.Router();

router.route('/').get(getEvents).post(createEvent);
router.route('/:id').all(validateObjectId).put(updateEvent).delete(deleteEvent);

export default router;
