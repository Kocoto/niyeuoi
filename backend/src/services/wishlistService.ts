import Wishlist, { IWishlist } from '../models/Wishlist';
import notificationService from './notificationService';
import logger from '../utils/logger';

class WishlistService {
    async getAllWishes() {
        logger.info('Wishlist', 'Lấy danh sách mong muốn');
        const wishes = await Wishlist.find().sort({ createdAt: -1 });
        logger.success('Wishlist', `Trả về ${wishes.length} mong muốn`);
        return wishes;
    }

    async getWishById(id: string) {
        logger.info('Wishlist', 'Lấy mong muốn theo ID', { id });
        const wish = await Wishlist.findById(id);
        if (!wish) {
            logger.warn('Wishlist', 'Không tìm thấy mong muốn', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Wishlist', 'Tìm thấy mong muốn', { itemName: wish.itemName });
        return wish;
    }

    async createWish(data: Partial<IWishlist>) {
        logger.info('Wishlist', 'Tạo mong muốn mới', { itemName: data.itemName, price: data.price, isSecretlyPrepared: data.isSecretlyPrepared });
        try {
            const wish = await Wishlist.create(data);
            logger.success('Wishlist', 'Tạo mong muốn thành công', { id: wish._id, itemName: wish.itemName });

            if (wish.isSecretlyPrepared) {
                logger.info('Wishlist', 'Phát hiện kế hoạch bí mật, gửi thông báo Discord...');
                await notificationService.sendDiscord(
                    '🤫 Kế hoạch bí mật mới!',
                    `Bạn vừa thêm món quà **${wish.itemName}** vào danh sách chuẩn bị bí mật.`,
                    3447003
                );
                logger.success('Wishlist', 'Đã gửi thông báo Discord bí mật');
            }

            return wish;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                logger.error('Wishlist', 'Lỗi validation khi tạo mong muốn', messages);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            logger.error('Wishlist', 'Lỗi khi tạo mong muốn', error);
            throw error;
        }
    }

    async updateWish(id: string, data: Partial<IWishlist>) {
        logger.info('Wishlist', 'Cập nhật mong muốn', { id, fields: Object.keys(data) });
        const oldWish = await Wishlist.findById(id);
        const wish = await Wishlist.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!wish) {
            logger.warn('Wishlist', 'Không tìm thấy mong muốn để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Wishlist', 'Cập nhật thành công', { itemName: wish.itemName, status: wish.status });

        if (!oldWish?.isSecretlyPrepared && wish.isSecretlyPrepared) {
            logger.info('Wishlist', 'Mong muốn chuyển sang bí mật, gửi thông báo Discord...');
            await notificationService.sendDiscord(
                '🤫 Kế hoạch bí mật bắt đầu!',
                `Món quà **${wish.itemName}** đã được chuyển sang trạng thái chuẩn bị bí mật.`,
                3447003
            );
            logger.success('Wishlist', 'Đã gửi thông báo Discord');
        }

        return wish;
    }

    async deleteWish(id: string) {
        logger.info('Wishlist', 'Xóa mong muốn', { id });
        const wish = await Wishlist.findById(id);
        if (!wish) {
            logger.warn('Wishlist', 'Không tìm thấy mong muốn để xóa', { id });
            throw new Error('NOT_FOUND');
        }
        await wish.deleteOne();
        logger.success('Wishlist', 'Đã xóa mong muốn', { itemName: wish.itemName });
        return true;
    }
}

export default new WishlistService();
