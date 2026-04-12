import mongoose, { Document, Schema } from 'mongoose';

export interface IMood extends Document {
    mood: 'Hạnh phúc' | 'Đang yêu' | 'Bình yên' | 'Hơi buồn' | 'Mệt mỏi' | 'Vui' | 'Buồn' | 'Giận' | 'Bình thường';
    note: string;
    date: Date;
    createdBy: 'boyfriend' | 'girlfriend';
}

const moodSchema: Schema = new Schema({
    mood: {
        type: String,
        enum: ['Hạnh phúc', 'Đang yêu', 'Bình yên', 'Hơi buồn', 'Mệt mỏi', 'Vui', 'Buồn', 'Giận', 'Bình thường'],
        required: [true, 'Tâm trạng là bắt buộc']
    },
    note: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        default: 'girlfriend',
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model<IMood>('Mood', moodSchema);
