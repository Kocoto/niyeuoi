import Coupon, { ICoupon } from '../models/Coupon.js';

class CouponService {
    async getAllCoupons() {
        return await Coupon.find().sort({ createdAt: -1 });
    }

    async getCouponById(id: string) {
        const coupon = await Coupon.findById(id);
        if (!coupon) throw new Error('NOT_FOUND');
        return coupon;
    }

    async createCoupon(data: Partial<ICoupon>) {
        try {
            return await Coupon.create(data);
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async updateCoupon(id: string, data: Partial<ICoupon>) {
        const coupon = await Coupon.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!coupon) throw new Error('NOT_FOUND');
        return coupon;
    }

    async deleteCoupon(id: string) {
        const coupon = await Coupon.findById(id);
        if (!coupon) throw new Error('NOT_FOUND');
        await coupon.deleteOne();
        return true;
    }
}

export default new CouponService();
