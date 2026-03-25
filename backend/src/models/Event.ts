import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
    name: string;
    date: Date;
    description: string;
    images: string[];
}

const eventSchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'Tên cột mốc là bắt buộc'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Ngày kỉ niệm là bắt buộc']
    },
    description: {
        type: String,
        trim: true
    },
    images: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

export default mongoose.model<IEvent>('Event', eventSchema);
