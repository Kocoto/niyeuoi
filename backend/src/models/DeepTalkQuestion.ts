import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswer {
    text?: string;
    isInPerson: boolean;
    answeredAt?: Date;
}

export interface IDeepTalkQuestion extends Document {
    content: string;
    isAiGenerated: boolean;
    answers: {
        boyfriend: IAnswer;
        girlfriend: IAnswer;
    };
}

const answerSchema = new Schema<IAnswer>({
    text: { type: String, trim: true },
    isInPerson: { type: Boolean, default: false },
    answeredAt: { type: Date },
}, { _id: false });

const deepTalkQuestionSchema = new Schema<IDeepTalkQuestion>({
    content: { type: String, required: [true, 'Nội dung câu hỏi là bắt buộc'], trim: true },
    isAiGenerated: { type: Boolean, default: false },
    answers: {
        boyfriend: { type: answerSchema, default: () => ({ isInPerson: false }) },
        girlfriend: { type: answerSchema, default: () => ({ isInPerson: false }) },
    },
}, { timestamps: true });

export default mongoose.model<IDeepTalkQuestion>('DeepTalkQuestion', deepTalkQuestionSchema);
