import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
    title: string;
    description: string;
    isUsed: boolean;
    isAiGenerated: boolean;
    createdBy: 'boyfriend' | 'girlfriend';
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
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        default: 'boyfriend'
    }
}, {
    timestamps: true
});

export default mongoose.model<ICoupon>('Coupon', couponSchema);
