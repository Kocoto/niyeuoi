import { Request, Response } from 'express';
import relationshipStateService from '../services/relationshipStateService';
import { getRequestAuthRole, isAuthRole } from '../utils/requestIdentity';

const parseDate = (value: unknown) => {
    if (typeof value !== 'string' || !value.trim()) return undefined;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const getRelationshipState = async (req: Request, res: Response) => {
    try {
        const viewerRole = isAuthRole(req.query.forWhom) ? req.query.forWhom : getRequestAuthRole(req);
        const date = parseDate(req.query.date);

        const state = await relationshipStateService.getRelationshipState({ viewerRole, date });
        res.status(200).json({ success: true, data: state });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi lấy relationship state' });
    }
};
