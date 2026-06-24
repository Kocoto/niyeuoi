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

        const prompt = `Tạo 1 câu hỏi deep talk cho cặp đôi người Việt trẻ (20s), giúp hai người hiểu nhau sâu hơn.${avoidList}

Quy tắc ngôi xưng (BẮT BUỘC):
- KHÔNG dùng "bạn" làm đại từ xưng hô — nghe xa cách
- KHÔNG dùng "mình" để chỉ cả người đọc lẫn người yêu trong cùng một câu — gây nhầm lẫn
- Ưu tiên viết câu KHÔNG cần đại từ rõ ràng: "Có lần nào...", "Điều gì...", "Khoảnh khắc nào..."
- Nếu cần nhắc đến người đọc: dùng "em" hoặc "anh" (không dùng "bạn")
- Khi nhắc đến người yêu: dùng "người ấy" hoặc "nửa kia" — không dùng "mình"

Yêu cầu nội dung:
- Cụ thể, gợi lên một khoảnh khắc thật hoặc cảm xúc thật — không trừu tượng, không triết lý
- Chạm đến: ký ức riêng tư, điều chưa nói ra, khoảnh khắc nhỏ nhưng đáng nhớ, nỗi sợ nhẹ, kỳ vọng thầm
- Giọng: ấm áp, tò mò, thân mật — không nghe như bài tập tâm lý hay câu hỏi phỏng vấn

Ví dụ phong cách đúng:
- "Có lần nào người ấy làm một điều nhỏ thôi, nhưng khiến em nhớ mãi đến giờ?"
- "Điều gì vẫn chưa dám nói thẳng, dù đã nghĩ đến nhiều lần?"
- "Lần đầu nhận ra mình thực sự quan trọng với người ấy là khoảnh khắc nào?"
- "Có kỷ niệm nào tưởng bình thường nhưng giờ nhớ lại thấy thật ý nghĩa không?"
- "Điều gì ở người ấy mà lúc đầu em không để ý, nhưng giờ lại thích nhất?"

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

export interface MonthlySummaryInput {
    scopeLabel: string;
    month: number;
    year: number;
    totalIncome: number;
    totalExpense: number;
    net: number;
    topCategories: Array<{ name: string; total: number }>;
    budgetStatus: Array<{ name: string; percentage: number; isOver: boolean }>;
}

function formatVNDShort(amount: number): string {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
    if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
    return `${amount}đ`;
}

export async function generateMonthlySummary(input: MonthlySummaryInput): Promise<string | null> {
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const topCats = input.topCategories.length > 0
            ? input.topCategories.map((c) => `${c.name} (${formatVNDShort(c.total)})`).join(', ')
            : 'chưa có';
        const overBudgets = input.budgetStatus.filter((b) => b.isOver).map((b) => b.name);
        const nearBudgets = input.budgetStatus.filter((b) => !b.isOver && b.percentage >= 80).map((b) => b.name);

        const prompt = `Bạn là trợ lý tài chính ấm áp trong một app dành cho cặp đôi người Việt. Hãy viết một đoạn tổng kết chi tiêu tháng ${input.month}/${input.year} cho phạm vi "${input.scopeLabel}".

Số liệu:
- Tổng thu: ${formatVNDShort(input.totalIncome)}
- Tổng chi: ${formatVNDShort(input.totalExpense)}
- Chênh lệch: ${formatVNDShort(input.net)} (${input.net >= 0 ? 'dư' : 'âm'})
- Chi nhiều nhất: ${topCats}
- Ngân sách vượt: ${overBudgets.length ? overBudgets.join(', ') : 'không có'}
- Ngân sách sắp chạm (>=80%): ${nearBudgets.length ? nearBudgets.join(', ') : 'không có'}

Yêu cầu:
- Viết 2-3 câu tiếng Việt, giọng ấm áp, nhẹ nhàng, khích lệ — KHÔNG phán xét, KHÔNG dùng chữ "nợ"
- Nêu 1 nhận xét nổi bật (chi nhiều cho gì, hoặc dư/tiết kiệm tốt) và 1 gợi ý nhỏ nhẹ nhàng
- Có thể thêm 1 emoji phù hợp
- Trả về JSON hợp lệ (không markdown): {"summary":"..."}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return text.replace(/```/g, '').trim() || null;
        const parsed = JSON.parse(jsonMatch[0]) as { summary?: string };
        return parsed.summary ?? null;
    } catch (err) {
        logger.warn('AI', 'Lỗi khi sinh tổng kết tháng', err);
        return null;
    }
}

export interface AIReceiptData {
    amount: number | null;
    date: string | null;
    note: string | null;
    type: 'income' | 'expense' | null;
}

export async function extractReceiptData(imageBase64: string, mimeType: string): Promise<AIReceiptData | null> {
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const prompt = `Đây là ảnh biên lai/thông báo giao dịch ngân hàng hoặc ví điện tử Việt Nam (Techcombank, VPBank, Vietcombank, MB Bank, MoMo, ZaloPay, VNPay...).

Hãy trích xuất thông tin giao dịch và trả về JSON hợp lệ (không markdown, không code block):
{"amount": số_tiền_VND_hoặc_null, "date": "ISO_date_string_hoặc_null", "note": "mô_tả_giao_dịch_hoặc_null", "type": "income_hoặc_expense_hoặc_null"}

Quy tắc:
- amount: chỉ số nguyên dương, đơn vị VND. Bỏ dấu chấm và phẩy
- date: định dạng ISO 8601 (YYYY-MM-DDTHH:mm:ss) nếu đọc được, null nếu không
- note: nội dung chuyển khoản, tên người nhận/gửi, hoặc mô tả ngắn gọn
- type: "income" nếu là nhận tiền/tiền vào, "expense" nếu là chuyển tiền/tiền ra, null nếu không rõ
- Nếu không đọc được trường nào thì để null`;

        logger.info('AI', 'Đang scan biên lai bằng Gemini...');
        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType, data: imageBase64 } },
                ],
            }],
        });
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Không tìm thấy JSON trong response');

        const parsed = JSON.parse(jsonMatch[0]) as AIReceiptData;
        logger.success('AI', 'Đã scan biên lai', { amount: parsed.amount, type: parsed.type });
        return parsed;
    } catch (err) {
        logger.warn('AI', 'Lỗi khi scan biên lai', err);
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
