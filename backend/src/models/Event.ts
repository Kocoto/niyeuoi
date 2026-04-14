import mongoose, { Document, Schema } from 'mongoose';

import type { AuthRole } from '../utils/authToken';

export interface IEvent extends Document {
    title: string;
    date: Date;
    description: string;
    createdBy?: AuthRole;
}

const eventSchema: Schema = new Schema({
    title: {
        type: String,
        required: [true, 'Tên sự kiện là bắt buộc'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Ngày diễn ra là bắt buộc']
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend']
    }
}, {
    timestamps: true
});

export default mongoose.model<IEvent>('Event', eventSchema);
