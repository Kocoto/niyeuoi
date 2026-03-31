import mongoose, { Document, Schema } from 'mongoose';

export interface IChallenge extends Document {
    title: string;
    description: string;
    points: number;
    isCompleted: boolean;
    difficulty: 'Dễ' | 'Trung bình' | 'Khó';
}

const challengeSchema: Schema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    points: { type: Number, default: 10 },
    isCompleted: { type: Boolean, default: false },
    difficulty: { type: String, enum: ['Dễ', 'Trung bình', 'Khó'], default: 'Dễ' }
}, { timestamps: true });

export default mongoose.model<IChallenge>('Challenge', challengeSchema);
