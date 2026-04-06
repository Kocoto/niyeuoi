import mongoose, { Document, Schema } from 'mongoose';

export interface IJournalEntry extends Document {
    content: string;
    createdBy: 'boyfriend' | 'girlfriend';
}

const journalEntrySchema = new Schema<IJournalEntry>({
    content: { type: String, required: [true, 'Nội dung nhật ký là bắt buộc'], trim: true, maxlength: 500 },
    createdBy: { type: String, enum: ['boyfriend', 'girlfriend'], required: true },
}, { timestamps: true });

export default mongoose.model<IJournalEntry>('JournalEntry', journalEntrySchema);
