import mongoose, { Document } from 'mongoose';
export interface IMemory extends Document {
    title: string;
    date: Date;
    content: string;
    media: string[];
    mood: string;
}
declare const _default: mongoose.Model<IMemory, {}, {}, {}, mongoose.Document<unknown, {}, IMemory, {}, mongoose.DefaultSchemaOptions> & IMemory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IMemory>;
export default _default;
//# sourceMappingURL=Memory.d.ts.map