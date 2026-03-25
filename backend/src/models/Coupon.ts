import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
    title: string;
    code: string;
    value: string;
    condition: string;
    description: string;
    status: 'Sẵn sàng' | 'Đã dùng' | 'Hết hạn';
    expiryDate: Date;
}

const couponSchema: Schema = new Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề voucher là bắt buộc'],
        trim: true
    },
    code: {
        type: String,
        unique: true,
        trim: true
    },
    value: {
        type: String,
        required: [true, 'Giá trị voucher là bắt buộc']
    },
    condition: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Sẵn sàng', 'Đã dùng', 'Hết hạn'],
        default: 'Sẵn sàng'
    },
    expiryDate: {
        type: Date
    }
}, {
    timestamps: true
});

export default mongoose.model<ICoupon>('Coupon', couponSchema);
