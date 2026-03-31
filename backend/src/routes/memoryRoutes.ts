import express from 'express';
import { validateObjectId } from '../middleware/validateObjectId';
const router = express.Router();
import {
    getMemories,
    getMemory,
    createMemory,
    updateMemory,
    deleteMemory
} from '../controllers/memoryController';

router
    .route('/')
    .get(getMemories)
    .post(createMemory);

router
    .route('/:id')
    .all(validateObjectId)
    .get(getMemory)
    .put(updateMemory)
    .delete(deleteMemory);

export default router;
