import mongoose, { Document, Schema } from 'mongoose';

export type VoucherType = 'personal' | 'grab' | 'shared';
export type AppRole = 'boyfriend' | 'girlfriend';

export interface ICouponRecord extends Document {
  title: string;
  description: string;
  voucherType: VoucherType;
  createdBy: AppRole;
  /** Đích danh: người nhận cố định (personal). Null cho grab/shared cho đến khi được nhận */
  recipientRole?: AppRole;
  /** Ai đang giữ voucher (grab được nhận rồi, hoặc personal = recipientRole) */
  ownedBy?: AppRole;
  isUsed: boolean;
  isAiGenerated: boolean;
  expiresAt?: Date;
}

const couponRecordSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề voucher là bắt buộc'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    voucherType: {
      type: String,
      enum: ['personal', 'grab', 'shared'],
      default: 'personal',
    },
    createdBy: {
      type: String,
      enum: ['boyfriend', 'girlfriend'],
      required: true,
    },
    recipientRole: {
      type: String,
      enum: ['boyfriend', 'girlfriend'],
      default: null,
    },
    ownedBy: {
      type: String,
      enum: ['boyfriend', 'girlfriend'],
      default: null,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model<ICouponRecord>('CouponRecord', couponRecordSchema);
