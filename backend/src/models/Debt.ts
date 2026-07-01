import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export type DebtOwner = AuthRole | 'shared';

// Khoản nợ (vd nợ tín dụng): tổng nợ + số phải trả hàng tháng.
// Service/CRUD/pay/cron ở expenseDebtService (A3). Model tạo sớm vì
// budgetPlanService.getAllocation cần tổng monthlyPayment để "trừ nợ trước".
export interface IDebt extends Document {
    name: string;
    creditor?: string;
    totalAmount: number;
    remainingAmount: number;
    monthlyPayment: number;
    dueDayOfMonth?: number;
    interestRate?: number; // %/năm, tuỳ chọn — dùng cho dự báo (A6)
    owner: DebtOwner;
    walletId?: mongoose.Types.ObjectId;
    isActive: boolean;
    createdBy: AuthRole;
}

const debtSchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'Tên khoản nợ là bắt buộc'],
        trim: true,
    },
    creditor: {
        type: String,
        trim: true,
    },
    totalAmount: {
        type: Number,
        required: [true, 'Tổng nợ là bắt buộc'],
        min: [0, 'Tổng nợ không được âm'],
    },
    remainingAmount: {
        type: Number,
        required: true,
        min: [0, 'Số còn lại không được âm'],
    },
    monthlyPayment: {
        type: Number,
        required: [true, 'Số phải trả hàng tháng là bắt buộc'],
        min: [0, 'Số phải trả không được âm'],
    },
    dueDayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
    },
    interestRate: {
        type: Number,
        min: 0,
    },
    owner: {
        type: String,
        enum: ['shared', 'boyfriend', 'girlfriend'],
        default: 'shared',
    },
    walletId: {
        type: Schema.Types.ObjectId,
        ref: 'Wallet',
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

debtSchema.index({ owner: 1, isActive: 1 });

export default mongoose.model<IDebt>('Debt', debtSchema);
