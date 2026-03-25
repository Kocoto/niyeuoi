import Wishlist, { IWishlist } from '../models/Wishlist.js';

class WishlistService {
    async getAllWishes() {
        return await Wishlist.find().sort({ createdAt: -1 });
    }

    async getWishById(id: string) {
        const wish = await Wishlist.findById(id);
        if (!wish) throw new Error('NOT_FOUND');
        return wish;
    }

    async createWish(data: Partial<IWishlist>) {
        try {
            return await Wishlist.create(data);
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async updateWish(id: string, data: Partial<IWishlist>) {
        const wish = await Wishlist.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!wish) throw new Error('NOT_FOUND');
        return wish;
    }

    async deleteWish(id: string) {
        const wish = await Wishlist.findById(id);
        if (!wish) throw new Error('NOT_FOUND');
        await wish.deleteOne();
        return true;
    }
}

export default new WishlistService();
