import mongoose, { Document, Schema } from 'mongoose';

export type AppRole = 'boyfriend' | 'girlfriend';

export interface IPlaceRecord extends Document {
  name: string;
  address: string;
  image: string;
  rating: number;
  note: string;
  category: string;
  addedBy: AppRole;
  isVisited: boolean;
  location: {
    type: string;
    coordinates: number[];
  };
}

const placeRecordSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên địa điểm là bắt buộc'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Địa chỉ là bắt buộc'],
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: ['Cafe', 'Trà sữa', 'Nhà hàng', 'Ăn vặt', 'Lẩu & Nướng', 'Hải sản', 'Phở & Bún', 'Bánh & Kem', 'Quán nhậu', 'Khác'],
      default: 'Khác',
    },
    addedBy: {
      type: String,
      enum: ['boyfriend', 'girlfriend'],
      required: true,
    },
    isVisited: {
      type: Boolean,
      default: false,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
  },
  { timestamps: true },
);

placeRecordSchema.index({ location: '2dsphere' });

export default mongoose.model<IPlaceRecord>('PlaceRecord', placeRecordSchema);
