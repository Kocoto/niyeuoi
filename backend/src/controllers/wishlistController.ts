import { Request, Response } from 'express';
import type { IWishlist } from '../models/Wishlist';
import wishlistService from '../services/wishlistService';
import { getRequestAuthRole, resolveCreatePayload, resolveUpdatePayload } from '../utils/requestIdentity';

export const getWishlist = async (req: Request, res: Response) => {
    try {
        const wishes = await wishlistService.getAllWishes(getRequestAuthRole(req));
        res.status(200).json({ success: true, count: wishes.length, data: wishes });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi lấy danh sách wishlist' });
    }
};

export const getWishlistItem = async (req: Request, res: Response) => {
    try {
        const wish = await wishlistService.getWishById(req.params.id as string, getRequestAuthRole(req));
        res.status(200).json({ success: true, data: wish });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy mục trong wishlist' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const createWishlistItem = async (req: Request, res: Response) => {
    try {
        const payload = resolveCreatePayload<IWishlist>(req, req.body as Partial<IWishlist>);
        const wish = await wishlistService.createWish(payload);
        res.status(201).json({ success: true, data: wish });
    } catch (err: any) {
        if (err.message.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi tạo mục' });
    }
};

export const updateWishlistItem = async (req: Request, res: Response) => {
    try {
        const payload = resolveUpdatePayload<IWishlist>(req.body as Partial<IWishlist>);
        const wish = await wishlistService.updateWish(req.params.id as string, payload);
        res.status(200).json({ success: true, data: wish });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy mục trong wishlist' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi cập nhật' });
    }
};

export const deleteWishlistItem = async (req: Request, res: Response) => {
    try {
        await wishlistService.deleteWish(req.params.id as string);
        res.status(200).json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, error: 'Không tìm thấy mục trong wishlist' });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi xóa' });
    }
};
