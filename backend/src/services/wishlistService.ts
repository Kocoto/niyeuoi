import Wishlist, { IWishlist } from '../models/Wishlist';
import notificationService from './notificationService';
import logger from '../utils/logger';
import type { AuthRole } from '../utils/authToken';

const ROLE_LABEL: Record<AuthRole, string> = {
    boyfriend: 'Được',
    girlfriend: 'Ni'
};

const isAuthRole = (value: unknown): value is AuthRole =>
    value === 'boyfriend' || value === 'girlfriend';

const getOppositeRole = (role: AuthRole): AuthRole =>
    role === 'boyfriend' ? 'girlfriend' : 'boyfriend';

const resolveWishlistOwner = (wish: Partial<IWishlist>): AuthRole | undefined => {
    if (isAuthRole(wish.owner)) {
        return wish.owner;
    }

    if (wish.isSecretlyPrepared && isAuthRole(wish.createdBy)) {
        return getOppositeRole(wish.createdBy);
    }

    if (isAuthRole(wish.createdBy)) {
        return wish.createdBy;
    }

    return undefined;
};

const normalizeCreatePayload = (data: Partial<IWishlist>) => {
    const payload: Partial<IWishlist> = { ...data };
    const owner = resolveWishlistOwner(payload);
    if (owner) {
        payload.owner = owner;
    }
    return payload;
};

const normalizeUpdatePayload = (existingWish: IWishlist, data: Partial<IWishlist>) => {
    const merged = {
        ...existingWish.toObject(),
        ...data,
    } as Partial<IWishlist>;
    const owner = resolveWishlistOwner(merged);
    const payload: Partial<IWishlist> = { ...data };

    if (owner) {
        payload.owner = owner;
    }

    return payload;
};

const serializeWishForViewer = (wish: IWishlist, viewerRole?: AuthRole) => {
    const owner = resolveWishlistOwner(wish);
    const isOwnerViewing = owner && viewerRole === owner;

    return {
        ...wish.toObject(),
        owner,
        isSecretlyPrepared: isOwnerViewing ? false : Boolean(wish.isSecretlyPrepared)
    };
};

const buildSecretPlanMessage = (wish: IWishlist) => {
    const owner = resolveWishlistOwner(wish);
    const ownerLabel = owner ? ROLE_LABEL[owner] : 'người ấy';
    return `Món **${wish.itemName}** đang được chuẩn bị cho ${ownerLabel}.`;
};

class WishlistService {
    async getAllWishes(viewerRole?: AuthRole) {
        logger.info('Wishlist', 'Lấy danh sách mong muốn', { viewerRole });
        const wishes = await Wishlist.find().sort({ createdAt: -1 });
        logger.success('Wishlist', `Trả về ${wishes.length} mong muốn`);
        return wishes.map((wish) => serializeWishForViewer(wish, viewerRole));
    }

    async getWishById(id: string, viewerRole?: AuthRole) {
        logger.info('Wishlist', 'Lấy mong muốn theo ID', { id, viewerRole });
        const wish = await Wishlist.findById(id);
        if (!wish) {
            logger.warn('Wishlist', 'Không tìm thấy mong muốn', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Wishlist', 'Tìm thấy mong muốn', { itemName: wish.itemName });
        return serializeWishForViewer(wish, viewerRole);
    }

    async createWish(data: Partial<IWishlist>) {
        const payload = normalizeCreatePayload(data);
        logger.info('Wishlist', 'Tạo mong muốn mới', {
            itemName: payload.itemName,
            price: payload.price,
            isSecretlyPrepared: payload.isSecretlyPrepared,
            createdBy: payload.createdBy,
            owner: payload.owner
        });
        try {
            const wish = await Wishlist.create(payload);
            logger.success('Wishlist', 'Tạo mong muốn thành công', { id: wish._id, itemName: wish.itemName });

            if (wish.isSecretlyPrepared) {
                logger.info('Wishlist', 'Phát hiện kế hoạch bí mật, gửi thông báo Discord...');
                await notificationService.sendDiscord(
                    '🤫 Kế hoạch bí mật mới!',
                    buildSecretPlanMessage(wish),
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
        if (!oldWish) {
            logger.warn('Wishlist', 'Không tìm thấy mong muốn để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }

        const payload = normalizeUpdatePayload(oldWish, data);
        const wish = await Wishlist.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true
        });
        if (!wish) {
            logger.warn('Wishlist', 'Không tìm thấy mong muốn để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }

        logger.success('Wishlist', 'Cập nhật thành công', {
            itemName: wish.itemName,
            status: wish.status,
            owner: resolveWishlistOwner(wish),
            isSecretlyPrepared: wish.isSecretlyPrepared
        });

        if (!oldWish.isSecretlyPrepared && wish.isSecretlyPrepared) {
            logger.info('Wishlist', 'Mong muốn chuyển sang bí mật, gửi thông báo Discord...');
            await notificationService.sendDiscord(
                '🤫 Kế hoạch bí mật bắt đầu!',
                buildSecretPlanMessage(wish),
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
