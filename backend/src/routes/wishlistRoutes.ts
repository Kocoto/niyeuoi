import express from 'express';
import { validateObjectId } from '../middleware/validateObjectId';
import {
    getWishlist,
    getWishlistItem,
    createWishlistItem,
    updateWishlistItem,
    deleteWishlistItem
} from '../controllers/wishlistController';

const router = express.Router();

router.route('/')
    .get(getWishlist)
    .post(createWishlistItem);

router.route('/:id')
    .all(validateObjectId)
    .get(getWishlistItem)
    .put(updateWishlistItem)
    .delete(deleteWishlistItem);

export default router;
