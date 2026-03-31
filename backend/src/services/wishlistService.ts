import Wishlist, { IWishlist } from '../models/Wishlist';
import notificationService from './notificationService';

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
            const wish = await Wishlist.create(data);
            if (wish.isSecretlyPrepared) {
                await notificationService.sendDiscord(
                    '🤫 Kế hoạch bí mật mới!',
                    `Bạn vừa thêm món quà **${wish.itemName}** vào danh sách chuẩn bị bí mật.`,
                    3447003 // Màu xanh dương
                );
            }
            return wish;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async updateWish(id: string, data: Partial<IWishlist>) {
        const oldWish = await Wishlist.findById(id);
        const wish = await Wishlist.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!wish) throw new Error('NOT_FOUND');

        if (!oldWish?.isSecretlyPrepared && wish.isSecretlyPrepared) {
            await notificationService.sendDiscord(
                '🤫 Kế hoạch bí mật bắt đầu!',
                `Món quà **${wish.itemName}** đã được chuyển sang trạng thái chuẩn bị bí mật.`,
                3447003
            );
        }

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
