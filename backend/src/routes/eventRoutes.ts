import express from 'express';
import { validateObjectId } from '../middleware/validateObjectId';
import {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent
} from '../controllers/eventController';

const router = express.Router();

router.route('/')
    .get(getEvents)
    .post(createEvent);

router.route('/:id')
    .all(validateObjectId)
    .get(getEvent)
    .put(updateEvent)
    .delete(deleteEvent);

export default router;
