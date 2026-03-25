import mongoose, { Document } from 'mongoose';
export interface ICoupon extends Document {
    title: string;
    code: string;
    value: string;
    condition: string;
    description: string;
    status: 'Sẵn sàng' | 'Đã dùng' | 'Hết hạn';
    expiryDate: Date;
}
declare const _default: mongoose.Model<ICoupon, {}, {}, {}, mongoose.Document<unknown, {}, ICoupon, {}, mongoose.DefaultSchemaOptions> & ICoupon & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICoupon>;
export default _default;
//# sourceMappingURL=Coupon.d.ts.map