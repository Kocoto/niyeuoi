import express from 'express';
import {
    getWishlist,
    getWishlistItem,
    createWishlistItem,
    updateWishlistItem,
    deleteWishlistItem
} from '../controllers/wishlistController.js';

const router = express.Router();

router.route('/')
    .get(getWishlist)
    .post(createWishlistItem);

router.route('/:id')
    .get(getWishlistItem)
    .put(updateWishlistItem)
    .delete(deleteWishlistItem);

export default router;
