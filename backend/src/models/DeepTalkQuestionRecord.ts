import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswerRecord {
    text?: string;
    isInPerson: boolean;
    answeredAt?: Date;
}

export interface IDeepTalkQuestionRecord extends Document {
    content: string;
    isAiGenerated: boolean;
    createdBy: 'boyfriend' | 'girlfriend';
    answers: {
        boyfriend: IAnswerRecord;
        girlfriend: IAnswerRecord;
    };
}

const answerSchema = new Schema<IAnswerRecord>({
    text: { type: String, trim: true },
    isInPerson: { type: Boolean, default: false },
    answeredAt: { type: Date },
}, { _id: false });

const deepTalkQuestionSchema = new Schema<IDeepTalkQuestionRecord>({
    content: { type: String, required: [true, 'Nội dung câu hỏi là bắt buộc'], trim: true },
    isAiGenerated: { type: Boolean, default: false },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        default: 'girlfriend',
        required: true
    },
    answers: {
        boyfriend: { type: answerSchema, default: () => ({ isInPerson: false }) },
        girlfriend: { type: answerSchema, default: () => ({ isInPerson: false }) },
    },
}, { timestamps: true });

export default mongoose.model<IDeepTalkQuestionRecord>('DeepTalkQuestion', deepTalkQuestionSchema);
