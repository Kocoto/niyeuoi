import { Request, Response } from 'express';
import dotenv from 'dotenv';
import {
    AuthRole,
    createSessionToken,
    getBearerToken,
    getDisplayName,
    getExpectedPin,
    readSessionToken,
} from '../utils/authToken';

dotenv.config();

export const verifyPin = async (req: Request, res: Response) => {
    try {
        const { pin, role } = req.body as { pin?: string; role?: AuthRole };
        const requestedRole: AuthRole | undefined =
            role === 'boyfriend' || role === 'girlfriend' ? role : undefined;

        const resolvedRole: AuthRole | undefined =
            requestedRole || (pin === (process.env['PIN'] || '1234') ? 'boyfriend' : undefined);

        if (!resolvedRole) {
            return res.status(400).json({
                success: false,
                message: 'Missing valid login role',
            });
        }

        const expectedPin = getExpectedPin(resolvedRole);
        const isPinValid = expectedPin ? pin === expectedPin : resolvedRole === 'girlfriend';

        if (!isPinValid) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect PIN',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Authenticated',
            token: createSessionToken(resolvedRole),
            user: {
                role: resolvedRole,
                displayName: getDisplayName(resolvedRole),
            },
        });
    } catch {
        return res.status(500).json({ success: false, error: 'Server error' });
    }
};

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const token = getBearerToken(req.headers.authorization);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated',
            });
        }

        const user = readSessionToken(token);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Session is invalid or expired',
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch {
        return res.status(500).json({ success: false, error: 'Server error' });
    }
};
