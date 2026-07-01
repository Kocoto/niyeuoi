import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export type SavingsGoalType = 'normal' | 'emergency';

export interface ISavingsGoal extends Document {
    name: string;
    type: SavingsGoalType;
    targetAmount: number;
    currentAmount: number;
    deadline?: Date;
    note?: string;
    imageUrl?: string;
    isCompleted: boolean;
    walletId?: mongoose.Types.ObjectId;
    createdBy: AuthRole;
}

const savingsGoalSchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'Tên mục tiêu là bắt buộc'],
        trim: true,
    },
    type: {
        type: String,
        enum: ['normal', 'emergency'],
        default: 'normal',
    },
    targetAmount: {
        type: Number,
        required: [true, 'Số tiền mục tiêu là bắt buộc'],
        min: [1, 'Số tiền phải lớn hơn 0'],
    },
    currentAmount: {
        type: Number,
        default: 0,
    },
    deadline: {
        type: Date,
        default: undefined,
    },
    note: {
        type: String,
        trim: true,
        default: undefined,
    },
    imageUrl: {
        type: String,
        default: undefined,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    walletId: {
        type: Schema.Types.ObjectId,
        ref: 'Wallet',
        default: undefined,
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: [true, 'Người tạo là bắt buộc'],
    },
}, { timestamps: true });

export default mongoose.model<ISavingsGoal>('SavingsGoal', savingsGoalSchema);
