import mongoose, { Document, Schema } from 'mongoose';

export type AppRole = 'boyfriend' | 'girlfriend';
export type WishCategory = 'item' | 'place' | 'food' | 'experience';

export interface IWishlistRecord extends Document {
  itemName: string;
  link: string;
  price: number;
  category: WishCategory;
  owner: AppRole;
  isSecretlyPrepared: boolean;
  status: 'waiting' | 'done';
  note: string;
}

const wishlistRecordSchema: Schema = new Schema(
  {
    itemName: {
      type: String,
      required: [true, 'Tên mong muốn là bắt buộc'],
      trim: true,
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: ['item', 'place', 'food', 'experience'],
      default: 'item',
    },
    owner: {
      type: String,
      enum: ['boyfriend', 'girlfriend'],
      required: true,
    },
    isSecretlyPrepared: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['waiting', 'done'],
      default: 'waiting',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
);

export default mongoose.model<IWishlistRecord>('WishlistRecord', wishlistRecordSchema);
