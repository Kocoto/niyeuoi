import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export const COUPON_TYPE_VALUES = ['personal', 'claimable', 'shared'] as const;
export const COUPON_PARTY_VALUES = ['girlfriend', 'boyfriend', 'both'] as const;
export const COUPON_CREATOR_VALUES = ['girlfriend', 'boyfriend', 'system'] as const;

export type CouponType = (typeof COUPON_TYPE_VALUES)[number];
export type CouponParty = (typeof COUPON_PARTY_VALUES)[number];
export type CouponCreator = AuthRole | 'system';

export interface ICoupon extends Document {
    title: string;
    description: string;
    isUsed: boolean;
    isAiGenerated: boolean;
    createdBy?: CouponCreator;
    couponType?: CouponType;
    receiverRole?: CouponParty;
    holderRole?: CouponParty;
    claimEndsAt?: Date;
}

const couponSchema: Schema = new Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề voucher là bắt buộc'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    isAiGenerated: {
        type: Boolean,
        default: false
    },
    couponType: {
        type: String,
        enum: COUPON_TYPE_VALUES,
        default: undefined
    },
    receiverRole: {
        type: String,
        enum: COUPON_PARTY_VALUES,
        default: undefined
    },
    holderRole: {
        type: String,
        enum: COUPON_PARTY_VALUES,
        default: undefined
    },
    claimEndsAt: {
        type: Date,
        default: undefined
    },
    createdBy: {
        type: String,
        enum: COUPON_CREATOR_VALUES,
        default: undefined
    }
}, {
    timestamps: true
});

export default mongoose.model<ICoupon>('Coupon', couponSchema);
