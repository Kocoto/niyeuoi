import express from 'express';
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
    .get(getEvent)
    .put(updateEvent)
    .delete(deleteEvent);

export default router;
