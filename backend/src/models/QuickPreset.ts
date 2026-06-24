import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export interface IQuickPreset extends Document {
    label: string;
    type: 'income' | 'expense';
    amount: number;
    walletId: mongoose.Types.ObjectId;
    categoryId?: mongoose.Types.ObjectId;
    createdBy: AuthRole;
}

const quickPresetSchema: Schema = new Schema({
    label: {
        type: String,
        required: [true, 'Nhãn là bắt buộc'],
        trim: true,
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        default: 'expense',
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
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: [true, 'Người tạo là bắt buộc'],
    },
}, { timestamps: true });

export default mongoose.model<IQuickPreset>('QuickPreset', quickPresetSchema);
