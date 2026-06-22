import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export interface IRecurringRule extends Document {
    name: string;
    type: 'income' | 'expense';
    amount: number;
    walletId: mongoose.Types.ObjectId;
    categoryId?: mongoose.Types.ObjectId;
    frequency: RecurringFrequency;
    dayOfMonth?: number;
    nextRunDate: Date;
    isActive: boolean;
    createdBy: AuthRole;
}

const recurringRuleSchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'Tên là bắt buộc'],
        trim: true,
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: [true, 'Loại giao dịch là bắt buộc'],
    },
    amount: {
        type: Number,
        required: [true, 'Số tiền là bắt buộc'],
        min: [1, 'Số tiền phải lớn hơn 0'],
    },
    walletId: {
        type: Schema.Types.ObjectId,
        ref: 'Wallet',
        required: [true, 'Ví là bắt buộc'],
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'ExpenseCategory',
        default: undefined,
    },
    frequency: {
        type: String,
        enum: ['weekly', 'monthly', 'yearly'],
        required: [true, 'Tần suất là bắt buộc'],
    },
    dayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
        default: undefined,
    },
    nextRunDate: {
        type: Date,
        required: [true, 'Ngày chạy tiếp theo là bắt buộc'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: [true, 'Người tạo là bắt buộc'],
    },
}, { timestamps: true });

export default mongoose.model<IRecurringRule>('RecurringRule', recurringRuleSchema);
