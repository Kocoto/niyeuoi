import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export interface ILetter extends Document {
    content: string;
    createdBy: AuthRole;
    reply?: string;
    repliedBy?: AuthRole;
    repliedAt?: Date;
}

const letterSchema: Schema = new Schema({
    content: {
        type: String,
        required: [true, 'Nội dung là bắt buộc'],
        trim: true
    },
    createdBy: {
        type: String,
        enum: ['girlfriend', 'boyfriend'],
        required: [true, 'Người viết là bắt buộc']
    },
    reply: {
        type: String,
        trim: true,
        default: undefined
    },
    repliedBy: {
        type: String,
        enum: ['girlfriend', 'boyfriend'],
        default: undefined
    },
    repliedAt: {
        type: Date,
        default: undefined
    }
}, {
    timestamps: true
});

export default mongoose.model<ILetter>('Letter', letterSchema);
