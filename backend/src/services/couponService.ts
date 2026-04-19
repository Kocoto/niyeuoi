import Coupon, {
    COUPON_PARTY_VALUES,
    COUPON_TYPE_VALUES,
    type CouponCreator,
    type CouponParty,
    type CouponType,
    ICoupon
} from '../models/Coupon';
import notificationService from './notificationService';
import logger from '../utils/logger';
import type { AuthRole } from '../utils/authToken';

const ROLE_LABEL: Record<AuthRole, string> = {
    boyfriend: 'Được',
    girlfriend: 'Ni'
};

const PARTY_LABEL: Record<CouponParty, string> = {
    boyfriend: 'Được',
    girlfriend: 'Ni',
    both: 'cả hai'
};

const COUPON_TYPE_LABEL: Record<CouponType, string> = {
    personal: 'Đích danh',
    claimable: 'Nhanh tay',
    shared: 'Dùng chung'
};

const CLAIMABLE_DEFAULT_WINDOW_HOURS = 72;

const isAuthRole = (value: unknown): value is AuthRole =>
    value === 'boyfriend' || value === 'girlfriend';

const isCouponCreator = (value: unknown): value is CouponCreator =>
    value === 'system' || isAuthRole(value);

const isCouponType = (value: unknown): value is CouponType =>
    typeof value === 'string' && COUPON_TYPE_VALUES.includes(value as CouponType);

const isCouponParty = (value: unknown): value is CouponParty =>
    typeof value === 'string' && COUPON_PARTY_VALUES.includes(value as CouponParty);

const getOppositeRole = (role: AuthRole): AuthRole =>
    role === 'boyfriend' ? 'girlfriend' : 'boyfriend';

const getDefaultClaimEndsAt = () => new Date(Date.now() + CLAIMABLE_DEFAULT_WINDOW_HOURS * 60 * 60 * 1000);

const normalizeCouponPayload = (data: Partial<ICoupon>) => {
    const payload: Partial<ICoupon> = { ...data };

    if (typeof payload.title === 'string') {
        payload.title = payload.title.trim();
    }

    if (typeof payload.description === 'string') {
        payload.description = payload.description.trim();
    }

    if (!isCouponCreator(payload.createdBy)) {
        if (payload.isAiGenerated) {
            payload.createdBy = 'system';
        } else {
            delete payload.createdBy;
        }
    }

    if (!isCouponType(payload.couponType)) {
        delete payload.couponType;
    }

    if (!isCouponParty(payload.receiverRole)) {
        delete payload.receiverRole;
    }

    if (!isCouponParty(payload.holderRole)) {
        delete payload.holderRole;
    }

    if (payload.claimEndsAt) {
        const claimEndsAt = new Date(payload.claimEndsAt);

        if (Number.isNaN(claimEndsAt.getTime())) {
            delete payload.claimEndsAt;
        } else {
            payload.claimEndsAt = claimEndsAt;
        }
    } else {
        delete payload.claimEndsAt;
    }

    if (!payload.couponType) {
        if (payload.receiverRole === 'both' || payload.holderRole === 'both') {
            payload.couponType = 'shared';
        } else if (payload.receiverRole || payload.holderRole) {
            payload.couponType = 'personal';
        } else if (payload.isAiGenerated && payload.createdBy === 'system') {
            payload.couponType = 'shared';
        }
    }

    if (payload.couponType === 'shared') {
        payload.receiverRole = 'both';
        payload.holderRole = 'both';
        delete payload.claimEndsAt;
        return payload;
    }

    if (payload.couponType === 'personal') {
        if (payload.receiverRole === 'both') {
            delete payload.receiverRole;
        }

        if (payload.holderRole === 'both') {
            delete payload.holderRole;
        }

        if (!isAuthRole(payload.receiverRole) && isAuthRole(payload.createdBy)) {
            payload.receiverRole = getOppositeRole(payload.createdBy);
        }

        if (!isAuthRole(payload.receiverRole) && isAuthRole(payload.holderRole)) {
            payload.receiverRole = payload.holderRole;
        }

        if (!isAuthRole(payload.holderRole) && isAuthRole(payload.receiverRole)) {
            payload.holderRole = payload.receiverRole;
        }

        delete payload.claimEndsAt;
        return payload;
    }

    if (payload.couponType === 'claimable') {
        if (payload.receiverRole === 'both') {
            delete payload.receiverRole;
        }

        if (payload.holderRole === 'both') {
            delete payload.holderRole;
        }

        if (isAuthRole(payload.holderRole)) {
            payload.receiverRole = payload.holderRole;
        } else {
            delete payload.receiverRole;

            if (!(payload.claimEndsAt instanceof Date)) {
                payload.claimEndsAt = getDefaultClaimEndsAt();
            }
        }
    }

    return payload;
};

const ensureCouponTransitionAllowed = (currentCoupon: ICoupon, payload: Partial<ICoupon>, actorRole?: AuthRole) => {
    if (!actorRole || currentCoupon.isUsed) {
        return;
    }

    const nextHolder = isCouponParty(payload.holderRole) ? payload.holderRole : currentCoupon.holderRole;
    const nextReceiver = isCouponParty(payload.receiverRole) ? payload.receiverRole : currentCoupon.receiverRole;

    if (currentCoupon.couponType === 'claimable' && isAuthRole(payload.holderRole)) {
        if (currentCoupon.claimEndsAt && currentCoupon.claimEndsAt.getTime() <= Date.now() && !isAuthRole(currentCoupon.holderRole)) {
            throw new Error('VALIDATION_ERROR: Tấm vé nhanh tay này đã hết hạn nhận.');
        }

        if (isAuthRole(currentCoupon.holderRole) && currentCoupon.holderRole !== actorRole) {
            throw new Error('VALIDATION_ERROR: Tấm vé này đã được người kia nhận trước rồi.');
        }
    }

    if (payload.isUsed) {
        if (currentCoupon.couponType === 'shared') {
            return;
        }

        const ownerRole = isAuthRole(nextHolder)
            ? nextHolder
            : isAuthRole(nextReceiver)
                ? nextReceiver
                : undefined;

        if (!ownerRole && currentCoupon.couponType === 'claimable') {
            throw new Error('VALIDATION_ERROR: Hãy nhận tấm vé này trước khi dùng.');
        }

        if (ownerRole && ownerRole !== actorRole) {
            throw new Error('VALIDATION_ERROR: Chỉ người đang giữ voucher mới có thể đánh dấu đã dùng.');
        }
    }
};

const getCouponDirectionLabel = (coupon: Pick<ICoupon, 'createdBy' | 'couponType' | 'receiverRole' | 'holderRole'>) => {
    if (coupon.couponType === 'shared') {
        return 'Cả hai cùng dùng';
    }

    if (coupon.couponType === 'claimable') {
        if (isAuthRole(coupon.holderRole)) {
            return `${ROLE_LABEL[coupon.holderRole]} đang giữ`;
        }

        return 'Đang chờ ai nhận trước';
    }

    if (coupon.couponType === 'personal') {
        if (isAuthRole(coupon.createdBy) && isAuthRole(coupon.receiverRole)) {
            return `${ROLE_LABEL[coupon.createdBy]} tặng ${ROLE_LABEL[coupon.receiverRole]}`;
        }

        if (isAuthRole(coupon.receiverRole)) {
            return `Dành cho ${ROLE_LABEL[coupon.receiverRole]}`;
        }
    }

    if (coupon.createdBy === 'system') {
        return 'Hệ thống mở ra từ lượt mới';
    }

    if (isAuthRole(coupon.createdBy)) {
        return `Giữ lại từ ${ROLE_LABEL[coupon.createdBy]}`;
    }

    return 'Dữ liệu cũ chưa ghi rõ hướng voucher';
};

const buildCouponNotificationMessage = (coupon: ICoupon) => {
    const typeLabel = coupon.couponType ? COUPON_TYPE_LABEL[coupon.couponType] : 'Lượt cũ';
    const holderLabel = isCouponParty(coupon.holderRole) ? PARTY_LABEL[coupon.holderRole] : null;

    return [
        `Voucher: **${coupon.title}**`,
        `Loại: ${typeLabel}`,
        `Hướng: ${getCouponDirectionLabel(coupon)}`,
        holderLabel ? `Đang giữ: ${holderLabel}` : 'Đang giữ: chưa ghi rõ',
        'Một tấm vé vừa được dùng xong.'
    ].join('\n');
};

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
        const payload = normalizeCouponPayload(data);
        logger.info('Coupon', 'Tạo voucher mới', {
            title: payload.title,
            createdBy: payload.createdBy,
            couponType: payload.couponType,
            receiverRole: payload.receiverRole,
            holderRole: payload.holderRole
        });

        try {
            const coupon = await Coupon.create(payload);
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

    async updateCoupon(id: string, data: Partial<ICoupon>, actorRole?: AuthRole) {
        logger.info('Coupon', 'Cập nhật voucher', { id, fields: Object.keys(data) });
        const oldCoupon = await Coupon.findById(id);
        if (!oldCoupon) {
            logger.warn('Coupon', 'Không tìm thấy voucher để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }

        const payload = normalizeCouponPayload(data);
        ensureCouponTransitionAllowed(oldCoupon, payload, actorRole);
        const coupon = await Coupon.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true
        });
        if (!coupon) {
            logger.warn('Coupon', 'Không tìm thấy voucher để cập nhật sau khi validate', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Coupon', 'Cập nhật voucher thành công', {
            title: coupon.title,
            isUsed: coupon.isUsed,
            couponType: coupon.couponType,
            receiverRole: coupon.receiverRole,
            holderRole: coupon.holderRole
        });

        if (!oldCoupon?.isUsed && coupon.isUsed) {
            logger.info('Coupon', `Voucher "${coupon.title}" vừa được sử dụng! Gửi thông báo Discord...`);
            await notificationService.sendDiscord(
                '🎟️ Một voucher vừa được dùng',
                buildCouponNotificationMessage(coupon),
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
