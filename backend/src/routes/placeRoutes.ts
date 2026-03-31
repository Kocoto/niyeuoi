import express from 'express';
import { validateObjectId } from '../middleware/validateObjectId';
const router = express.Router();
import {
    getPlaces,
    getPlace,
    createPlace,
    updatePlace,
    deletePlace,
    getRandomPlace
} from '../controllers/placeController';

router
    .route('/')
    .get(getPlaces)
    .post(createPlace);

router.get('/random', getRandomPlace);

router
    .route('/:id')
    .all(validateObjectId)
    .get(getPlace)
    .put(updatePlace)
    .delete(deletePlace);

export default router;
