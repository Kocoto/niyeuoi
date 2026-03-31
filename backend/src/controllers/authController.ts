import { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

export const verifyPin = async (req: Request, res: Response) => {
    try {
        const { pin } = req.body;
        const MASTER_PIN = process.env['PIN'] || '1234';

        if (pin === MASTER_PIN) {
            return res.status(200).json({
                success: true,
                message: 'Xác thực thành công',
                token: 'mock-token-for-now' // Trong thực tế nên dùng JWT
            });
        }

        res.status(401).json({
            success: false,
            message: 'Mã PIN không chính xác'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};
