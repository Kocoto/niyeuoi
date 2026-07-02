import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export interface ICalorieGoal extends Document {
    owner: AuthRole;          // 1 bản ghi / vai (upsert)
    dailyTarget: number;      // mục tiêu calo mỗi ngày
    createdBy: AuthRole;
}

const calorieGoalSchema: Schema = new Schema({
    owner: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: [true, 'Chủ nhân mục tiêu là bắt buộc'],
        unique: true,
    },
    dailyTarget: {
        type: Number,
        required: [true, 'Mục tiêu calo là bắt buộc'],
        min: [1, 'Mục tiêu phải lớn hơn 0'],
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: [true, 'Người tạo là bắt buộc'],
    },
}, { timestamps: true });

export default mongoose.model<ICalorieGoal>('CalorieGoal', calorieGoalSchema);
