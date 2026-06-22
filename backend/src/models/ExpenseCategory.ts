import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export interface IExpenseCategory extends Document {
    name: string;
    icon: string;
    color: string;
    createdBy: AuthRole;
    isDefault: boolean;
}

const expenseCategorySchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'Tên danh mục là bắt buộc'],
        trim: true,
    },
    icon: {
        type: String,
        default: 'circle-ellipsis',
    },
    color: {
        type: String,
        default: 'rose',
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: [true, 'Người tạo là bắt buộc'],
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export default mongoose.model<IExpenseCategory>('ExpenseCategory', expenseCategorySchema);
