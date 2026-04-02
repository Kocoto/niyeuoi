import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
    lat: number;
    lng: number;
    accuracy?: number;
}

const locationSchema: Schema = new Schema({
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: { type: Number },
}, { timestamps: true });

export default mongoose.model<ILocation>('Location', locationSchema);
