import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface ICalorieEntry extends Document {
    owner: AuthRole;         // calo của ai (boyfriend/girlfriend)
    date: string;            // 'YYYY-MM-DD' — gom theo ngày
    mealType: MealType;
    name: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    imageUrl?: string;
    note?: string;
    createdBy: AuthRole;
}

const calorieEntrySchema: Schema = new Schema({
    owner: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: [true, 'Chủ nhân bữa ăn là bắt buộc'],
    },
    date: {
        type: String,
        required: [true, 'Ngày là bắt buộc'],
        match: [/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải theo định dạng YYYY-MM-DD'],
    },
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        default: 'snack',
    },
    name: {
        type: String,
        required: [true, 'Tên món là bắt buộc'],
        trim: true,
    },
    calories: {
        type: Number,
        required: [true, 'Lượng calo là bắt buộc'],
        min: [0, 'Calo không được âm'],
    },
    protein: { type: Number, min: 0, default: undefined },
    carbs: { type: Number, min: 0, default: undefined },
    fat: { type: Number, min: 0, default: undefined },
    imageUrl: { type: String, default: undefined },
    note: { type: String, trim: true, default: undefined },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: [true, 'Người tạo là bắt buộc'],
    },
}, { timestamps: true });

calorieEntrySchema.index({ owner: 1, date: 1 });

export default mongoose.model<ICalorieEntry>('CalorieEntry', calorieEntrySchema);
