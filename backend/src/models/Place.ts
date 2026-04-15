import mongoose, { Document, Schema } from 'mongoose';

import type { AuthRole } from '../utils/authToken';

export const PLACE_STATUS_VALUES = ['want_to_go', 'next_time', 'visited'] as const;

export type PlaceStatus = (typeof PLACE_STATUS_VALUES)[number];

export interface IPlace extends Document {
    name: string;
    address: string;
    image: string;
    rating: number | null;
    note: string;
    category: 'Cafe' | 'Trà sữa' | 'Nhà hàng' | 'Ăn vặt' | 'Lẩu & Nướng' | 'Hải sản' | 'Phở & Bún' | 'Bánh & Kem' | 'Quán nhậu' | 'Khác';
    isVisited: boolean;
    status?: PlaceStatus;
    location: {
        type: string;
        coordinates: number[];
    };
    createdBy?: AuthRole;
}

const placeSchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'Tên địa điểm là bắt buộc'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Địa chỉ là bắt buộc'],
        trim: true
    },
    image: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        default: null
    },
    note: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['Cafe', 'Trà sữa', 'Nhà hàng', 'Ăn vặt', 'Lẩu & Nướng', 'Hải sản', 'Phở & Bún', 'Bánh & Kem', 'Quán nhậu', 'Khác'],
        default: 'Khác'
    },
    isVisited: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: PLACE_STATUS_VALUES,
        default: undefined
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend']
    }
}, {
    timestamps: true
});

placeSchema.index({ location: '2dsphere' });

export default mongoose.model<IPlace>('Place', placeSchema);
