import express from 'express';
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
    .get(getMemory)
    .put(updateMemory)
    .delete(deleteMemory);

export default router;
