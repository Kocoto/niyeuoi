import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export interface IBudget extends Document {
    categoryId: mongoose.Types.ObjectId;
    walletId?: mongoose.Types.ObjectId;
    limitAmount: number;
    month: number;
    year: number;
    createdBy: AuthRole;
}

const budgetSchema: Schema = new Schema({
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'ExpenseCategory',
        required: [true, 'Danh mục là bắt buộc'],
    },
    walletId: {
        type: Schema.Types.ObjectId,
        ref: 'Wallet',
        default: undefined,
    },
    limitAmount: {
        type: Number,
        required: [true, 'Ngân sách là bắt buộc'],
        min: [0, 'Ngân sách không được âm'],
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
    },
    year: {
        type: Number,
        required: true,
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: [true, 'Người tạo là bắt buộc'],
    },
}, { timestamps: true });

budgetSchema.index({ categoryId: 1, month: 1, year: 1, walletId: 1 }, { unique: true });

export default mongoose.model<IBudget>('Budget', budgetSchema);
