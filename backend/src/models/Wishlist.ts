import mongoose, { Document, Schema } from 'mongoose';

import type { AuthRole } from '../utils/authToken';

export interface IWishlist extends Document {
    itemName: string;
    link: string;
    price: number;
    isSecretlyPrepared: boolean;
    status: 'Đang đợi' | 'Đã mua' | 'Đã đi';
    note: string;
    createdBy?: AuthRole;
    owner?: AuthRole;
}

const wishlistSchema: Schema = new Schema({
    itemName: {
        type: String,
        required: [true, 'Tên món đồ/địa điểm là bắt buộc'],
        trim: true
    },
    link: {
        type: String,
        trim: true,
        default: ''
    },
    price: {
        type: Number,
        default: 0
    },
    isSecretlyPrepared: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Đang đợi', 'Đã mua', 'Đã đi'],
        default: 'Đang đợi'
    },
    note: {
        type: String,
        trim: true
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend']
    },
    owner: {
        type: String,
        enum: ['boyfriend', 'girlfriend']
    }
}, {
    timestamps: true
});

export default mongoose.model<IWishlist>('Wishlist', wishlistSchema);
