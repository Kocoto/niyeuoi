import mongoose, { Document } from 'mongoose';
export interface IPlace extends Document {
    name: string;
    address: string;
    image: string;
    rating: number;
    note: string;
    category: 'Cafe' | 'Nhà hàng' | 'Ăn vặt' | 'Khác';
    location: {
        type: string;
        coordinates: number[];
    };
}
declare const _default: mongoose.Model<IPlace, {}, {}, {}, mongoose.Document<unknown, {}, IPlace, {}, mongoose.DefaultSchemaOptions> & IPlace & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IPlace>;
export default _default;
//# sourceMappingURL=Place.d.ts.map