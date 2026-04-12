import mongoose, { Document, Schema } from 'mongoose';

export type AppRole = 'boyfriend' | 'girlfriend';
export type EventType = 'anniversary' | 'birthday' | 'date' | 'special';

export interface IEventRecord extends Document {
  title: string;
  date: Date;
  description: string;
  eventType: EventType;
  createdBy: AppRole;
  isRecurring: boolean;
}

const eventRecordSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Tên sự kiện là bắt buộc'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Ngày diễn ra là bắt buộc'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    eventType: {
      type: String,
      enum: ['anniversary', 'birthday', 'date', 'special'],
      default: 'special',
    },
    createdBy: {
      type: String,
      enum: ['boyfriend', 'girlfriend'],
      required: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model<IEventRecord>('EventRecord', eventRecordSchema);
