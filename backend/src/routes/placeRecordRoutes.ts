import express from 'express';
import { validateObjectId } from '../middleware/validateObjectId';
import { getPlaces, getRandomPlace, createPlace, updatePlace, deletePlace } from '../controllers/placeRecordController';

const router = express.Router();

router.get('/random', getRandomPlace);
router.route('/').get(getPlaces).post(createPlace);
router.route('/:id').all(validateObjectId).put(updatePlace).delete(deletePlace);

export default router;
