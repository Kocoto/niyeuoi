import { Request, Response } from 'express';
import calorieService from '../services/calorieService';
import { estimateCalories } from '../services/aiService';
import cloudinary from '../config/cloudinary';
import type { ICalorieEntry } from '../models/CalorieEntry';
import { resolveCreatePayload, getRequestAuthRole, isAuthRole } from '../utils/requestIdentity';
import type { AuthRole } from '../utils/authToken';

function parseOwner(req: Request): AuthRole | null {
    const owner = req.query.owner as string;
    if (isAuthRole(owner)) return owner;
    // fallback: vai của phiên đăng nhập
    const session = getRequestAuthRole(req);
    return session ?? null;
}

function todayStr(): string {
    return new Date().toISOString().slice(0, 10);
}

// ─── Entries ─────────────────────────────────────────────────────────────────

export const getEntries = async (req: Request, res: Response) => {
    try {
        const owner = parseOwner(req);
        if (!owner) return res.status(400).json({ success: false, error: 'Thiếu owner' });
        const date = (req.query.date as string) || todayStr();
        const data = await calorieService.getEntries(owner, date);
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy bữa ăn' });
    }
};

export const createEntry = async (req: Request, res: Response) => {
    try {
        const payload = resolveCreatePayload<ICalorieEntry>(req, req.body);
        if (!isAuthRole(payload.owner)) return res.status(400).json({ success: false, error: 'Thiếu owner hợp lệ' });
        const data = await calorieService.createEntry(payload);
        res.status(201).json({ success: true, data });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi khi thêm bữa ăn' });
    }
};

export const updateEntry = async (req: Request, res: Response) => {
    try {
        const data = await calorieService.updateEntry(req.params.id as string, req.body);
        res.json({ success: true, data });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy bữa ăn' });
        res.status(500).json({ success: false, error: 'Lỗi khi cập nhật bữa ăn' });
    }
};

export const deleteEntry = async (req: Request, res: Response) => {
    try {
        await calorieService.deleteEntry(req.params.id as string);
        res.json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy bữa ăn' });
        res.status(500).json({ success: false, error: 'Lỗi khi xóa bữa ăn' });
    }
};

// ─── Summary / Trend ───────────────────────────────────────────────────────────

export const getSummary = async (req: Request, res: Response) => {
    try {
        const owner = parseOwner(req);
        if (!owner) return res.status(400).json({ success: false, error: 'Thiếu owner' });
        const date = (req.query.date as string) || todayStr();
        const data = await calorieService.getDailySummary(owner, date);
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi tính tổng kết calo' });
    }
};

export const getTrend = async (req: Request, res: Response) => {
    try {
        const owner = parseOwner(req);
        if (!owner) return res.status(400).json({ success: false, error: 'Thiếu owner' });
        const date = (req.query.date as string) || undefined;
        const data = await calorieService.getWeekTrend(owner, date);
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy xu hướng calo' });
    }
};

// ─── Goal ────────────────────────────────────────────────────────────────────

export const getGoal = async (req: Request, res: Response) => {
    try {
        const owner = parseOwner(req);
        if (!owner) return res.status(400).json({ success: false, error: 'Thiếu owner' });
        const data = await calorieService.getGoal(owner);
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy mục tiêu calo' });
    }
};

export const upsertGoal = async (req: Request, res: Response) => {
    try {
        const { owner, dailyTarget } = req.body as { owner?: string; dailyTarget?: number };
        if (!isAuthRole(owner)) return res.status(400).json({ success: false, error: 'Thiếu owner hợp lệ' });
        const createdBy = getRequestAuthRole(req) ?? owner;
        const data = await calorieService.upsertGoal(owner, Number(dailyTarget), createdBy);
        res.json({ success: true, data });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi khi đặt mục tiêu calo' });
    }
};

// ─── AI ước tính calo ──────────────────────────────────────────────────────────

export const estimate = async (req: Request, res: Response) => {
    try {
        let imageBase64: string | undefined;
        let mimeType: string | undefined;
        let imageUrl: string | undefined;

        if (req.file) {
            imageBase64 = req.file.buffer.toString('base64');
            mimeType = req.file.mimetype;
        }
        const description = (req.body?.description as string) || undefined;

        if (!imageBase64 && !description?.trim()) {
            return res.status(400).json({ success: false, error: 'Cần ảnh hoặc mô tả món ăn' });
        }

        const [est, url] = await Promise.all([
            estimateCalories({ description, imageBase64, mimeType }),
            imageBase64 && mimeType
                ? cloudinary.uploader.upload(`data:${mimeType};base64,${imageBase64}`, { folder: 'niyeuoi/meals' })
                    .then((r) => r.secure_url).catch(() => undefined)
                : Promise.resolve(undefined),
        ]);
        imageUrl = url;

        if (!est) return res.status(422).json({ success: false, error: 'AI chưa ước tính được, nhập tay nhé', data: { imageUrl } });
        res.json({ success: true, data: { ...est, imageUrl } });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi ước tính calo' });
    }
};
