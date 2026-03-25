import mongoose, { Document, Schema } from 'mongoose';

export interface IMemory extends Document {
    title: string;
    date: Date;
    content: string;
    media: string[];
    mood: string;
}

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
    }
}, {
    timestamps: true
});

export default mongoose.model<IMemory>('Memory', memorySchema);
