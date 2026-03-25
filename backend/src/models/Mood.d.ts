import mongoose, { Document } from 'mongoose';
export interface IMood extends Document {
    mood: 'Vui' | 'Buồn' | 'Giận' | 'Hạnh phúc' | 'Mệt mỏi' | 'Bình thường';
    note: string;
    date: Date;
}
declare const _default: mongoose.Model<IMood, {}, {}, {}, mongoose.Document<unknown, {}, IMood, {}, mongoose.DefaultSchemaOptions> & IMood & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IMood>;
export default _default;
//# sourceMappingURL=Mood.d.ts.map