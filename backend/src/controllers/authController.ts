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
                message: 'Thieu vai tro dang nhap hop le',
            });
        }

        const expectedPin = getExpectedPin(resolvedRole);
        const isPinValid = expectedPin ? pin === expectedPin : resolvedRole === 'girlfriend';

        if (!isPinValid) {
            return res.status(401).json({
                success: false,
                message: 'Ma PIN khong chinh xac',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Xac thuc thanh cong',
            token: createSessionToken(resolvedRole),
            user: {
                role: resolvedRole,
                displayName: getDisplayName(resolvedRole),
            },
        });
    } catch {
        return res.status(500).json({ success: false, error: 'Loi may chu' });
    }
};

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const token = getBearerToken(req.headers.authorization);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Chua dang nhap',
            });
        }

        const user = readSessionToken(token);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Phien dang nhap khong hop le hoac da het han',
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch {
        return res.status(500).json({ success: false, error: 'Loi may chu' });
    }
};
