import { Request, Response } from 'express';
import couponService from '../services/couponService';
import { generateCoupon } from '../services/aiService';
import Coupon from '../models/Coupon';

export const getCoupons = async (req: Request, res: Response) => {
    try {
        const coupons = await couponService.getAllCoupons();
        res.status(200).json({ success: true, count: coupons.length, data: coupons });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi lấy danh sách voucher' });
    }
};

export const getCoupon = async (req: Request, res: Response) => {
    try {
        const coupon = await couponService.getCouponById(req.params.id as string);
        res.status(200).json({ success: true, data: coupon });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy voucher' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const createCoupon = async (req: Request, res: Response) => {
    try {
        const coupon = await couponService.createCoupon(req.body);
        res.status(201).json({ success: true, data: coupon });
    } catch (err: any) {
        if (err.message.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi tạo voucher' });
    }
};

export const updateCoupon = async (req: Request, res: Response) => {
    try {
        const coupon = await couponService.updateCoupon(req.params.id as string, req.body);
        res.status(200).json({ success: true, data: coupon });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy voucher' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi cập nhật' });
    }
};

export const deleteCoupon = async (req: Request, res: Response) => {
    try {
        await couponService.deleteCoupon(req.params.id as string);
        res.status(200).json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy voucher' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi xóa' });
    }
};

export const generateAiCoupon = async (_req: Request, res: Response) => {
    try {
        const existing = await Coupon.find({ isUsed: false }).select('title').lean();
        const existingTitles = existing.map((c: any) => c.title);

        const data = await generateCoupon(existingTitles);
        if (!data) {
            return res.status(503).json({ success: false, error: 'AI không sinh được voucher, thử lại sau nhé!' });
        }

        const coupon = await couponService.createCoupon({ ...data, isAiGenerated: true } as any);
        res.status(201).json({ success: true, data: coupon });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};
