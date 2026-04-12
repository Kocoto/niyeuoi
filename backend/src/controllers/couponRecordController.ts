import { Request, Response } from 'express';
import couponRecordService from '../services/couponRecordService';
import { generateCoupon } from '../services/aiService';

export const getCoupons = async (_req: Request, res: Response) => {
  try {
    const data = await couponRecordService.getAll();
    res.status(200).json({ success: true, count: data.length, data });
  } catch {
    res.status(500).json({ success: false, error: 'Lỗi máy chủ khi lấy danh sách voucher' });
  }
};

export const getCoupon = async (req: Request, res: Response) => {
  try {
    const data = await couponRecordService.getById(req.params['id'] as string);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy voucher' });
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const data = await couponRecordService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    if (err.message?.startsWith('VALIDATION_ERROR')) {
      return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
    }
    res.status(500).json({ success: false, error: 'Lỗi máy chủ khi tạo voucher' });
  }
};

export const claimCoupon = async (req: Request, res: Response) => {
  try {
    const { claimerRole } = req.body;
    if (!claimerRole) return res.status(400).json({ success: false, error: 'Thiếu claimerRole' });
    const data = await couponRecordService.claim(req.params['id'] as string, claimerRole);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    const errMap: Record<string, [number, string]> = {
      NOT_FOUND: [404, 'Không tìm thấy voucher'],
      NOT_GRAB_TYPE: [400, 'Voucher này không phải loại nhanh tay'],
      ALREADY_CLAIMED: [409, 'Voucher đã được nhận rồi'],
      ALREADY_USED: [409, 'Voucher đã được dùng rồi'],
    };
    const [status, error] = errMap[err.message] ?? [500, 'Lỗi máy chủ'];
    res.status(status).json({ success: false, error });
  }
};

export const useCoupon = async (req: Request, res: Response) => {
  try {
    const data = await couponRecordService.use(req.params['id'] as string);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    const errMap: Record<string, [number, string]> = {
      NOT_FOUND: [404, 'Không tìm thấy voucher'],
      ALREADY_USED: [409, 'Voucher đã được dùng rồi'],
    };
    const [status, error] = errMap[err.message] ?? [500, 'Lỗi máy chủ'];
    res.status(status).json({ success: false, error });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    await couponRecordService.delete(req.params['id'] as string);
    res.status(200).json({ success: true, data: {} });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy voucher' });
    res.status(500).json({ success: false, error: 'Lỗi máy chủ khi xóa' });
  }
};

export const generateAiCoupon = async (_req: Request, res: Response) => {
  try {
    const { default: CouponRecord } = await import('../models/CouponRecord');
    const existing = await CouponRecord.find({ isUsed: false }).select('title').lean();
    const existingTitles = existing.map((c: any) => c.title);

    const aiData = await generateCoupon(existingTitles);
    if (!aiData) {
      return res.status(503).json({ success: false, error: 'AI không sinh được voucher, thử lại sau nhé!' });
    }

    // AI-generated: loại grab, chưa ai sở hữu
    const data = await couponRecordService.create({
      ...aiData,
      voucherType: 'grab',
      createdBy: 'boyfriend',
      isAiGenerated: true,
    } as any);
    res.status(201).json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
  }
};
