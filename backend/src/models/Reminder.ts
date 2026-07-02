import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export type ReminderOwner = 'boyfriend' | 'girlfriend' | 'both';

export interface IReminder extends Document {
    owner: ReminderOwner;
    title: string;
    emoji?: string;
    time: string;              // 'HH:mm'
    daysOfWeek: number[];      // 0=CN … 6=T7; rỗng = hằng ngày
    date?: string;             // 'YYYY-MM-DD' — nếu đặt: nhắc MỘT LẦN đúng ngày (ca lịch làm việc)
    critical: boolean;         // ca quan trọng: máy Android báo kiểu báo thức + nút Gọi
    isActive: boolean;
    note?: string;
    createdBy: AuthRole;
}

const reminderSchema: Schema = new Schema({
    owner: {
        type: String,
        enum: ['boyfriend', 'girlfriend', 'both'],
        required: [true, 'Chủ nhân nhắc nhở là bắt buộc'],
    },
    title: {
        type: String,
        required: [true, 'Tiêu đề là bắt buộc'],
        trim: true,
    },
    emoji: { type: String, default: undefined },
    time: {
        type: String,
        required: [true, 'Giờ là bắt buộc'],
        match: [/^\d{2}:\d{2}$/, 'Giờ phải theo định dạng HH:mm'],
    },
    daysOfWeek: {
        type: [Number],
        default: [],
    },
    date: {
        type: String,
        match: [/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải theo định dạng YYYY-MM-DD'],
        default: undefined,
    },
    critical: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    note: { type: String, trim: true, default: undefined },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: [true, 'Người tạo là bắt buộc'],
    },
}, { timestamps: true });

reminderSchema.index({ owner: 1, isActive: 1 });

export default mongoose.model<IReminder>('Reminder', reminderSchema);
