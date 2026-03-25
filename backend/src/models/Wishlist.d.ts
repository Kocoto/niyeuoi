import mongoose, { Document } from 'mongoose';
export interface IWishlist extends Document {
    itemName: string;
    link: string;
    price: number;
    isSecretlyPrepared: boolean;
    status: 'Đang đợi' | 'Đã mua' | 'Đã đi';
    note: string;
}
declare const _default: mongoose.Model<IWishlist, {}, {}, {}, mongoose.Document<unknown, {}, IWishlist, {}, mongoose.DefaultSchemaOptions> & IWishlist & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IWishlist>;
export default _default;
//# sourceMappingURL=Wishlist.d.ts.map