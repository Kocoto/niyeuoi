import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export interface IPushSubscription extends Document {
    owner: AuthRole;
    endpoint: string;
    keys: { p256dh: string; auth: string };
    createdBy: AuthRole;
}

const pushSubscriptionSchema: Schema = new Schema({
    owner: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: true,
    },
    endpoint: {
        type: String,
        required: true,
        unique: true,
    },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: true,
    },
}, { timestamps: true });

export default mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);
