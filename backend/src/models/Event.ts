import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
    title: string;
    date: Date;
    description: string;
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
    }
}, {
    timestamps: true
});

export default mongoose.model<IEvent>('Event', eventSchema);
