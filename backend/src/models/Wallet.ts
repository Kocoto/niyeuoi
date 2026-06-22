import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export type WalletOwner = AuthRole | 'shared';

export interface IWallet extends Document {
    name: string;
    owner: WalletOwner;
    balance: number;
    color: string;
    icon: string;
    createdBy: AuthRole;
    isDefault: boolean;
}

const walletSchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'Tên ví là bắt buộc'],
        trim: true,
    },
    owner: {
        type: String,
        enum: ['shared', 'boyfriend', 'girlfriend'],
        required: [true, 'Chủ ví là bắt buộc'],
    },
    balance: {
        type: Number,
        default: 0,
    },
    color: {
        type: String,
        default: 'rose',
    },
    icon: {
        type: String,
        default: 'wallet',
    },
    createdBy: {
        type: String,
        enum: ['boyfriend', 'girlfriend'],
        required: [true, 'Người tạo là bắt buộc'],
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export default mongoose.model<IWallet>('Wallet', walletSchema);
