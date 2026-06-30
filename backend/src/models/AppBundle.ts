import mongoose, { Document, Schema } from 'mongoose';

/**
 * Một bản web bundle (OTA) đã phát hành cho app mobile (Capgo self-hosted).
 * App gọi /api/ota/updates để hỏi xem có bản mới hơn version đang chạy không.
 */
export interface IAppBundle extends Document {
    appId: string;
    channel: string;
    version: string;
    url: string;
    checksum: string;
    cloudinaryPublicId?: string;
}

const appBundleSchema: Schema = new Schema({
    appId: { type: String, required: true, index: true },
    channel: { type: String, required: true, default: 'production', index: true },
    version: { type: String, required: true },
    url: { type: String, required: true },
    checksum: { type: String, required: true },
    cloudinaryPublicId: { type: String },
}, { timestamps: true });

export default mongoose.model<IAppBundle>('AppBundle', appBundleSchema);
