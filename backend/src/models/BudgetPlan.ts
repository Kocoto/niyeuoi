import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export type PlanOwner = AuthRole | 'shared';

// Hồ sơ thu nhập + tỉ lệ 50/30/20 cho từng owner (1 bản ghi / owner).
export interface IBudgetPlan extends Document {
    owner: PlanOwner;
    monthlyIncome: number;
    needsPct: number;
    wantsPct: number;
    savingsPct: number;
    createdBy: AuthRole;
}

const budgetPlanSchema: Schema = new Schema({
    owner: {
        type: String,
        enum: ['shared', 'boyfriend', 'girlfriend'],
        required: [true, 'Owner là bắt buộc'],
        unique: true,
    },
    monthlyIncome: {
        type: Number,
        required: [true, 'Thu nhập hàng tháng là bắt buộc'],
        min: [0, 'Thu nhập không được âm'],
    },
    needsPct: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
    },
    wantsPct: {
        type: Number,
        default: 30,
        min: 0,
        max: 100,
    },
    savingsPct: {
        type: Number,
        default: 20,
        min: 0,
        max: 100,
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: [true, 'Người tạo là bắt buộc'],
    },
}, { timestamps: true });

export default mongoose.model<IBudgetPlan>('BudgetPlan', budgetPlanSchema);
