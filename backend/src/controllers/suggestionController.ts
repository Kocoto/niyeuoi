import { Request, Response } from 'express';
import suggestionService, { SMART_SUGGESTION_SURFACE_VALUES, type SmartSuggestionSurface } from '../services/suggestionService';
import { getRequestAuthRole, isAuthRole } from '../utils/requestIdentity';

const isSuggestionSurface = (value: unknown): value is SmartSuggestionSurface =>
    typeof value === 'string' && SMART_SUGGESTION_SURFACE_VALUES.includes(value as SmartSuggestionSurface);

const parseLimit = (value: unknown) => {
    if (typeof value !== 'string') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
};

export const getSuggestions = async (req: Request, res: Response) => {
    try {
        const forWhom = isAuthRole(req.query.forWhom) ? req.query.forWhom : getRequestAuthRole(req);
        const surface = isSuggestionSurface(req.query.surface) ? req.query.surface : undefined;
        const limit = parseLimit(req.query.limit);

        const suggestions = await suggestionService.getSmartSuggestions({ forWhom, surface, limit });
        res.status(200).json({ success: true, count: suggestions.length, data: suggestions });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ khi lấy smart suggestions' });
    }
};
