import mongoose, { Document, Schema } from 'mongoose';

import type { AuthRole } from '../utils/authToken';

export const MEMORY_RESURFACING_REASON_VALUES = ['anniversary_day', 'pinned_highlight'] as const;

export type MemoryResurfacingReason = (typeof MEMORY_RESURFACING_REASON_VALUES)[number];

export interface IMemoryResurfacingState {
    isPinned?: boolean;
    lastSurfacedAt?: Date;
    surfacedCount?: number;
    lastReason?: MemoryResurfacingReason;
}

export interface IMemory extends Document {
    title: string;
    date: Date;
    content: string;
    media: string[];
    mood: string;
    createdBy?: AuthRole;
    resurfacing?: IMemoryResurfacingState;
}

const resurfacingSchema = new Schema<IMemoryResurfacingState>({
    isPinned: {
        type: Boolean,
        default: undefined
    },
    lastSurfacedAt: {
        type: Date,
        default: undefined
    },
    surfacedCount: {
        type: Number,
        default: undefined,
        min: 0
    },
    lastReason: {
        type: String,
        enum: MEMORY_RESURFACING_REASON_VALUES,
        default: undefined
    }
}, { _id: false });

const memorySchema: Schema = new Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề kỷ niệm là bắt buộc'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Ngày kỷ niệm là bắt buộc'],
        default: Date.now
    },
    content: {
        type: String,
        required: [true, 'Nội dung kỷ niệm là bắt buộc'],
        trim: true
    },
    media: [{
        type: String, // Lưu URL từ Cloudinary
        required: true
    }],
    mood: {
        type: String,
        default: 'Hạnh phúc'
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend']
    },
    resurfacing: {
        type: resurfacingSchema,
        default: undefined
    }
}, {
    timestamps: true
});

export default mongoose.model<IMemory>('Memory', memorySchema);
