import mongoose, { Document, Schema } from 'mongoose';

import type { AuthRole } from '../utils/authToken';

export const EVENT_TYPE_VALUES = ['birthday', 'anniversary', 'date_plan', 'special_plan'] as const;
export const EVENT_TARGET_VALUES = ['girlfriend', 'boyfriend', 'both'] as const;

export type EventType = (typeof EVENT_TYPE_VALUES)[number];
export type EventTarget = (typeof EVENT_TARGET_VALUES)[number];

export interface IEvent extends Document {
    title: string;
    date: Date;
    description: string;
    createdBy?: AuthRole;
    eventType?: EventType;
    forWhom?: EventTarget;
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
    eventType: {
        type: String,
        enum: EVENT_TYPE_VALUES,
        default: undefined
    },
    forWhom: {
        type: String,
        enum: EVENT_TARGET_VALUES,
        default: undefined
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend']
    }
}, {
    timestamps: true
});

export default mongoose.model<IEvent>('Event', eventSchema);
