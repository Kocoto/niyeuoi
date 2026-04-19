import mongoose, { Document, Schema } from 'mongoose';
import type { AuthRole } from '../utils/authToken';

export const REWARD_TRIGGER_VALUES = [
    'challenge_completed',
    'deeptalk_paired',
    'mood_weekly_sync',
    'event_completed'
] as const;

export const REWARD_KIND_VALUES = [
    'coupon',
    'prompt',
    'challenge',
    'date_suggestion',
    'memory_highlight'
] as const;

export const REWARD_STATUS_VALUES = ['pending', 'revealed', 'consumed', 'dismissed', 'expired'] as const;
export const REWARD_SURFACE_VALUES = ['home', 'challenge', 'deeptalk', 'mood', 'event'] as const;
export const REWARD_PARTY_VALUES = ['girlfriend', 'boyfriend', 'both'] as const;
export const REWARD_RESOURCE_VALUES = [
    'challenge',
    'deep_talk_question',
    'mood',
    'event',
    'coupon',
    'memory'
] as const;
export const REWARD_CREATOR_VALUES = ['girlfriend', 'boyfriend', 'system'] as const;

export type RewardTriggerType = (typeof REWARD_TRIGGER_VALUES)[number];
export type RewardKind = (typeof REWARD_KIND_VALUES)[number];
export type RewardStatus = (typeof REWARD_STATUS_VALUES)[number];
export type RewardSurface = (typeof REWARD_SURFACE_VALUES)[number];
export type RewardParty = (typeof REWARD_PARTY_VALUES)[number];
export type RewardResourceType = (typeof REWARD_RESOURCE_VALUES)[number];
export type RewardCreator = AuthRole | 'system';

export interface IReward extends Document {
    triggerType: RewardTriggerType;
    rewardKind: RewardKind;
    status: RewardStatus;
    title: string;
    description?: string;
    sourceType: RewardResourceType;
    sourceId: string;
    sourceLabel?: string;
    rewardType?: RewardResourceType;
    rewardId?: string;
    surfaceHint: RewardSurface;
    forWhom?: RewardParty;
    dedupeKey?: string;
    createdBy?: RewardCreator;
    openedAt?: Date;
    resolvedAt?: Date;
    expiresAt?: Date;
}

const rewardSchema: Schema = new Schema(
    {
        triggerType: {
            type: String,
            enum: REWARD_TRIGGER_VALUES,
            required: [true, 'Trigger reward là bắt buộc']
        },
        rewardKind: {
            type: String,
            enum: REWARD_KIND_VALUES,
            required: [true, 'Loại reward là bắt buộc']
        },
        status: {
            type: String,
            enum: REWARD_STATUS_VALUES,
            default: 'pending'
        },
        title: {
            type: String,
            trim: true,
            required: [true, 'Tiêu đề reward là bắt buộc']
        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        sourceType: {
            type: String,
            enum: REWARD_RESOURCE_VALUES,
            required: [true, 'Nguồn mở reward là bắt buộc']
        },
        sourceId: {
            type: String,
            trim: true,
            required: [true, 'ID nguồn mở reward là bắt buộc']
        },
        sourceLabel: {
            type: String,
            trim: true,
            default: undefined
        },
        rewardType: {
            type: String,
            enum: REWARD_RESOURCE_VALUES,
            default: undefined
        },
        rewardId: {
            type: String,
            trim: true,
            default: undefined
        },
        surfaceHint: {
            type: String,
            enum: REWARD_SURFACE_VALUES,
            required: [true, 'Điểm đọc reward là bắt buộc']
        },
        forWhom: {
            type: String,
            enum: REWARD_PARTY_VALUES,
            default: 'both'
        },
        dedupeKey: {
            type: String,
            trim: true,
            default: undefined
        },
        createdBy: {
            type: String,
            enum: REWARD_CREATOR_VALUES,
            default: 'system'
        },
        openedAt: {
            type: Date,
            default: undefined
        },
        resolvedAt: {
            type: Date,
            default: undefined
        },
        expiresAt: {
            type: Date,
            default: undefined
        }
    },
    {
        timestamps: true
    }
);

rewardSchema.index({ status: 1, surfaceHint: 1, createdAt: -1 });
rewardSchema.index({ dedupeKey: 1, status: 1 });

export default mongoose.model<IReward>('Reward', rewardSchema);
