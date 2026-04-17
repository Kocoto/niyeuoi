import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export const CHALLENGE_TARGET_VALUES = ['girlfriend', 'boyfriend', 'both'] as const;

export type ChallengeTarget = (typeof CHALLENGE_TARGET_VALUES)[number];

export interface IChallenge extends Document {
    title: string;
    description: string;
    points: number;
    isCompleted: boolean;
    difficulty: 'Dễ' | 'Trung bình' | 'Khó';
    isAiGenerated: boolean;
    createdBy?: AuthRole;
    forWhom?: ChallengeTarget;
}

const challengeSchema: Schema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    points: { type: Number, default: 10 },
    isCompleted: { type: Boolean, default: false },
    difficulty: { type: String, enum: ['Dễ', 'Trung bình', 'Khó'], default: 'Dễ' },
    isAiGenerated: { type: Boolean, default: false },
    forWhom: {
        type: String,
        enum: CHALLENGE_TARGET_VALUES,
        default: undefined
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend']
    }
}, { timestamps: true });

export default mongoose.model<IChallenge>('Challenge', challengeSchema);
