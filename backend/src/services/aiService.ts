import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';

const genAI = new GoogleGenerativeAI((process.env.GEMINI_API_KEY || '').trim());

const GEMINI_MODEL = 'gemini-3-flash-preview';

export interface AIChallenge {
    title: string;
    description: string;
    points: number;
    difficulty: 'Dễ' | 'Trung bình' | 'Khó';
}

export interface AICoupon {
    title: string;
    description: string;
}

export async function generateChallenge(existingTitles: string[]): Promise<AIChallenge | null> {
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const avoidList = existingTitles.length > 0
            ? `\nCác thử thách đang có (KHÔNG được trùng lặp hoặc tương tự): ${JSON.stringify(existingTitles)}`
            : '';

        const prompt = `Tạo 1 thử thách tình yêu thú vị, sáng tạo cho cặp đôi người Việt trong độ tuổi 20s.${avoidList}
Trả về JSON hợp lệ (không markdown, không code block):
{"title":"...","description":"...","points":số_từ_10_đến_50,"difficulty":"Dễ"}
difficulty chỉ được là một trong: "Dễ", "Trung bình", "Khó"`;

        logger.info('AI', 'Đang gọi Gemini sinh thử thách...', { avoiding: existingTitles.length });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Không tìm thấy JSON trong response');

        const parsed = JSON.parse(jsonMatch[0]) as AIChallenge;
        if (!parsed.title || !parsed.description) throw new Error('JSON thiếu trường bắt buộc');

        // Đảm bảo difficulty hợp lệ
        if (!['Dễ', 'Trung bình', 'Khó'].includes(parsed.difficulty)) {
            parsed.difficulty = 'Dễ';
        }
        parsed.points = Math.min(50, Math.max(10, Number(parsed.points) || 10));

        logger.success('AI', 'Đã sinh thử thách', { title: parsed.title });
        return parsed;
    } catch (err) {
        logger.warn('AI', 'Lỗi khi sinh thử thách từ Gemini', err);
        return null;
    }
}

export async function generateCoupon(existingTitles: string[]): Promise<AICoupon | null> {
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const avoidList = existingTitles.length > 0
            ? `\nCác voucher đang có (KHÔNG được trùng lặp hoặc tương tự): ${JSON.stringify(existingTitles)}`
            : '';

        const prompt = `Tạo 1 voucher lãng mạn dễ thương cho cặp đôi người Việt (ví dụ: nấu cơm, massage, xem phim, buổi hẹn hò...).${avoidList}
Trả về JSON hợp lệ (không markdown, không code block):
{"title":"...","description":"..."}`;

        logger.info('AI', 'Đang gọi Gemini sinh voucher...', { avoiding: existingTitles.length });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Không tìm thấy JSON trong response');

        const parsed = JSON.parse(jsonMatch[0]) as AICoupon;
        if (!parsed.title || !parsed.description) throw new Error('JSON thiếu trường bắt buộc');

        logger.success('AI', 'Đã sinh voucher', { title: parsed.title });
        return parsed;
    } catch (err) {
        logger.warn('AI', 'Lỗi khi sinh voucher từ Gemini', err);
        return null;
    }
}
