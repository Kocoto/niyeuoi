import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface ITransaction extends Document {
    type: TransactionType;
    amount: number;
    note: string;
    walletId: mongoose.Types.ObjectId;
    categoryId?: mongoose.Types.ObjectId;
    toWalletId?: mongoose.Types.ObjectId;
    date: Date;
    isRecurring: boolean;
    recurringRuleId?: mongoose.Types.ObjectId;
    imageUrl?: string;
    createdBy: AuthRole;
}

const transactionSchema: Schema = new Schema({
    type: {
        type: String,
        enum: ['income', 'expense', 'transfer'],
        required: [true, 'Loại giao dịch là bắt buộc'],
    },
    amount: {
        type: Number,
        required: [true, 'Số tiền là bắt buộc'],
        min: [1, 'Số tiền phải lớn hơn 0'],
    },
    note: {
        type: String,
        trim: true,
        default: '',
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
    toWalletId: {
        type: Schema.Types.ObjectId,
        ref: 'Wallet',
        default: undefined,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    isRecurring: {
        type: Boolean,
        default: false,
    },
    recurringRuleId: {
        type: Schema.Types.ObjectId,
        ref: 'RecurringRule',
        default: undefined,
    },
    imageUrl: {
        type: String,
        default: undefined,
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: [true, 'Người tạo là bắt buộc'],
    },
}, { timestamps: true });

transactionSchema.index({ walletId: 1, date: -1 });
transactionSchema.index({ categoryId: 1, date: -1 });
transactionSchema.index({ date: -1 });

export default mongoose.model<ITransaction>('Transaction', transactionSchema);
