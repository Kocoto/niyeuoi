import Coupon, { ICoupon } from '../models/Coupon';
import notificationService from './notificationService';
import logger from '../utils/logger';

class CouponService {
    async getAllCoupons() {
        logger.info('Coupon', 'Lấy danh sách voucher');
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        logger.success('Coupon', `Trả về ${coupons.length} voucher`);
        return coupons;
    }

    async getCouponById(id: string) {
        logger.info('Coupon', 'Lấy voucher theo ID', { id });
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            logger.warn('Coupon', 'Không tìm thấy voucher', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Coupon', 'Tìm thấy voucher', { title: coupon.title });
        return coupon;
    }

    async createCoupon(data: Partial<ICoupon>) {
        logger.info('Coupon', 'Tạo voucher mới', { title: data.title });
        try {
            const coupon = await Coupon.create(data);
            logger.success('Coupon', 'Tạo voucher thành công', { id: coupon._id, title: coupon.title });
            return coupon;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                logger.error('Coupon', 'Lỗi validation khi tạo voucher', messages);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            logger.error('Coupon', 'Lỗi khi tạo voucher', error);
            throw error;
        }
    }

    async updateCoupon(id: string, data: Partial<ICoupon>) {
        logger.info('Coupon', 'Cập nhật voucher', { id, fields: Object.keys(data) });
        const oldCoupon = await Coupon.findById(id);
        const coupon = await Coupon.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!coupon) {
            logger.warn('Coupon', 'Không tìm thấy voucher để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Coupon', 'Cập nhật voucher thành công', { title: coupon.title, isUsed: coupon.isUsed });

        if (!oldCoupon?.isUsed && coupon.isUsed) {
            logger.info('Coupon', `Voucher "${coupon.title}" vừa được sử dụng! Gửi thông báo Discord...`);
            await notificationService.sendDiscord(
                '🎉 Bé yêu vừa sử dụng Voucher!',
                `Voucher: **${coupon.title}**\nChuẩn bị thực hiện lời hứa nhé bạn trai! ❤️`,
                15844367
            );
            logger.success('Coupon', 'Đã gửi thông báo Discord');
        }

        return coupon;
    }

    async deleteCoupon(id: string) {
        logger.info('Coupon', 'Xóa voucher', { id });
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            logger.warn('Coupon', 'Không tìm thấy voucher để xóa', { id });
            throw new Error('NOT_FOUND');
        }
        await coupon.deleteOne();
        logger.success('Coupon', 'Đã xóa voucher', { title: coupon.title });
        return true;
    }
}

export default new CouponService();
