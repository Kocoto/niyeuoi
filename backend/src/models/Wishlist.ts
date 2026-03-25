import mongoose, { Document, Schema } from 'mongoose';

export interface IWishlist extends Document {
    itemName: string;
    link: string;
    price: number;
    isSecretlyPrepared: boolean;
    status: 'Đang đợi' | 'Đã mua' | 'Đã đi';
    note: string;
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
    }
}, {
    timestamps: true
});

export default mongoose.model<IWishlist>('Wishlist', wishlistSchema);
