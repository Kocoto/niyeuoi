import mongoose, { Document, Schema } from 'mongoose';

export interface IPlace extends Document {
    name: string;
    address: string;
    image: string;
    rating: number;
    note: string;
    category: 'Cafe' | 'Nhà hàng' | 'Ăn vặt' | 'Khác';
    location: {
        type: string;
        coordinates: number[];
    };
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
        min: 1,
        max: 5,
        default: 5
    },
    note: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['Cafe', 'Nhà hàng', 'Ăn vặt', 'Khác'],
        default: 'Khác'
    },
    isVisited: {
        type: Boolean,
        default: false
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
    }
}, {
    timestamps: true
});

placeSchema.index({ location: '2dsphere' });

export default mongoose.model<IPlace>('Place', placeSchema);
