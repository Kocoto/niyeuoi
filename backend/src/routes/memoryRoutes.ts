import express from 'express';
import { validateObjectId } from '../middleware/validateObjectId';
const router = express.Router();
import {
    getMemories,
    getMemory,
    getResurfacingMemories,
    createMemory,
    updateMemory,
    deleteMemory,
    markMemoryResurfaced
} from '../controllers/memoryController';

router.get('/resurfacing', getResurfacingMemories);
router.post('/:id/resurfacing/mark', validateObjectId, markMemoryResurfaced);

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
