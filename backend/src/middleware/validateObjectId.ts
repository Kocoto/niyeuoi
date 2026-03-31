import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';

export const validateObjectId = (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (id && !mongoose.isValidObjectId(id)) {
        logger.warn('Middleware', 'ID không hợp lệ', { id, url: req.originalUrl });
        return res.status(400).json({ success: false, error: 'ID không hợp lệ' });
    }
    next();
};
