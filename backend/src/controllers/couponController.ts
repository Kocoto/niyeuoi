import { Request, Response } from 'express';
import { generateCoupon } from '../services/aiService';
import Coupon, { type ICoupon } from '../models/Coupon';
import couponService from '../services/couponService';
import { getRequestAuthRole } from '../utils/requestIdentity';

const isRequestRole = (value: unknown): value is 'boyfriend' | 'girlfriend' =>
    value === 'boyfriend' || value === 'girlfriend';

export const getCoupons = async (_req: Request, res: Response) => {
    try {
        const coupons = await couponService.getAllCoupons();
        res.status(200).json({ success: true, count: coupons.length, data: coupons });
    } catch {
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
        const sessionRole = getRequestAuthRole(req);
        const body = req.body as Partial<ICoupon>;
        const payload: Partial<ICoupon> = {
            ...body,
            createdBy: sessionRole ?? (isRequestRole(body.createdBy) ? body.createdBy : undefined)
        };

        const coupon = await couponService.createCoupon(payload);
        res.status(201).json({ success: true, data: coupon });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }

        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi tạo voucher' });
    }
};

export const updateCoupon = async (req: Request, res: Response) => {
    try {
        const body = req.body as Partial<ICoupon>;
        const payload: Partial<ICoupon> = { ...body };
        const sessionRole = getRequestAuthRole(req);

        if (!isRequestRole(payload.createdBy)) {
            delete payload.createdBy;
        }

        if (sessionRole && payload.holderRole && payload.holderRole !== 'both') {
            payload.holderRole = sessionRole;
        }

        const coupon = await couponService.updateCoupon(req.params.id as string, payload, sessionRole);
        res.status(200).json({ success: true, data: coupon });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }

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
        const existingTitles = existing.map((coupon: any) => coupon.title);

        const data = await generateCoupon(existingTitles);
        if (!data) {
            return res.status(503).json({ success: false, error: 'AI không sinh được voucher, thử lại sau nhé!' });
        }

        const coupon = await couponService.createCoupon({
            ...data,
            isAiGenerated: true,
            createdBy: 'system',
            couponType: 'shared',
            receiverRole: 'both',
            holderRole: 'both'
        } as Partial<ICoupon>);

        res.status(201).json({ success: true, data: coupon });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};
