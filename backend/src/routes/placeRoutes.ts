import express from 'express';
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
    .get(getPlace)
    .put(updatePlace)
    .delete(deletePlace);

export default router;
