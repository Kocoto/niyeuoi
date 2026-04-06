import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';

const _apiKey = (process.env.GEMINI_API_KEY || '').trim();
logger.info('AI', `GEMINI_API_KEY loaded: ${_apiKey ? `${_apiKey.substring(0, 8)}... (${_apiKey.length} chars)` : 'MISSING'}`);
const genAI = new GoogleGenerativeAI(_apiKey);

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

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

export interface AIDeepQuestion {
    content: string;
}

export async function generateDeepQuestion(existingContents: string[]): Promise<AIDeepQuestion | null> {
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const avoidList = existingContents.length > 0
            ? `\nCác câu hỏi đang có (KHÔNG được trùng lặp hoặc tương tự): ${JSON.stringify(existingContents)}`
            : '';

        const prompt = `Tạo 1 câu hỏi sâu sắc, ý nghĩa giúp cặp đôi người Việt hiểu nhau hơn. Câu hỏi phải chạm đến cảm xúc, ký ức, giá trị, hay ước mơ. Viết bằng tiếng Việt tự nhiên, thân mật.${avoidList}
Ví dụ phong cách: "Điều gì khiến bạn cảm thấy được yêu thương nhất?", "Ký ức nào của chúng mình khiến bạn hay nhớ lại nhất?", "Bạn sợ điều gì nhất trong mối quan hệ này?"
Trả về JSON hợp lệ (không markdown, không code block):
{"content":"..."}`;

        logger.info('AI', 'Đang gọi Gemini sinh câu hỏi deep talk...', { avoiding: existingContents.length });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Không tìm thấy JSON trong response');

        const parsed = JSON.parse(jsonMatch[0]) as AIDeepQuestion;
        if (!parsed.content) throw new Error('JSON thiếu trường content');

        logger.success('AI', 'Đã sinh câu hỏi deep talk', { content: parsed.content.substring(0, 40) });
        return parsed;
    } catch (err) {
        logger.warn('AI', 'Lỗi khi sinh câu hỏi từ Gemini', err);
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
