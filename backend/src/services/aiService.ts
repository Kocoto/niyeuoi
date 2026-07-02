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

export interface AITransactionText {
    amount: number | null;
    type: 'income' | 'expense' | null;
    merchant: string | null;
    bankName: string | null;
    date: string | null;
}

export interface FinanceAdviceInput {
    scopeLabel: string;
    month: number;
    year: number;
    income: number;
    debtTotal: number;
    disposable: number;
    needsPct: number; needsSpent: number; needsTarget: number;
    wantsPct: number; wantsSpent: number; wantsTarget: number;
    savingsPct: number; savingsSpent: number; savingsTarget: number;
    activeDebtCount: number;
    emergencyFundPct: number; // % quỹ dự phòng so với mục tiêu
}

export async function generateFinanceAdvice(input: FinanceAdviceInput): Promise<string | null> {
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const prompt = `Bạn là cố vấn tài chính ấm áp trong một app dành cho cặp đôi người Việt. Hãy đưa ra lời khuyên tài chính ngắn gọn cho tháng ${input.month}/${input.year} — phạm vi "${input.scopeLabel}".

Số liệu 50/30/20:
- Thu nhập: ${formatVNDShort(input.income)}${input.debtTotal > 0 ? `, trừ nợ ${formatVNDShort(input.debtTotal)}, còn chia ${formatVNDShort(input.disposable)}` : ''}
- Thiết yếu (${input.needsPct}%): mục tiêu ${formatVNDShort(input.needsTarget)}, đã chi ${formatVNDShort(input.needsSpent)}
- Mong muốn (${input.wantsPct}%): mục tiêu ${formatVNDShort(input.wantsTarget)}, đã chi ${formatVNDShort(input.wantsSpent)}
- Tiết kiệm (${input.savingsPct}%): mục tiêu ${formatVNDShort(input.savingsTarget)}, đã tiết kiệm ${formatVNDShort(input.savingsSpent)}
${input.activeDebtCount > 0 ? `- Đang có ${input.activeDebtCount} khoản nợ cần trả hàng tháng` : '- Không có khoản nợ đang hoạt động'}
${input.emergencyFundPct < 100 ? `- Quỹ dự phòng: ${input.emergencyFundPct}% so với mục tiêu` : '- Quỹ dự phòng đã đủ mục tiêu 🎉'}

Yêu cầu:
- Viết 3–4 câu tiếng Việt, giọng ấm áp, thân thiện, tích cực — không phán xét gay gắt
- Nhận xét 1–2 điểm nổi bật (chi quá nhiều/ít ở nhóm nào, nợ, tiết kiệm)
- Gợi ý 1 hành động cụ thể nhỏ cho nửa tháng còn lại hoặc tháng sau
- Có thể dùng 1–2 emoji phù hợp
- Trả về JSON hợp lệ (không markdown): {"advice":"..."}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return text.replace(/```/g, '').trim() || null;
        const parsed = JSON.parse(jsonMatch[0]) as { advice?: string };
        return parsed.advice ?? null;
    } catch (err) {
        logger.warn('AI', 'Lỗi khi sinh lời khuyên tài chính', err);
        return null;
    }
}

/** Đọc text thông báo ngân hàng / ví điện tử VN → trích xuất thông tin giao dịch. */
export async function extractTransactionText(rawText: string): Promise<AITransactionText | null> {
    if (!rawText?.trim()) return null;
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const prompt = `Đây là nội dung văn bản thông báo giao dịch từ ngân hàng hoặc ví điện tử Việt Nam (Techcombank, VPBank, Vietcombank, MB Bank, BIDV, ACB, TPBank, MoMo, ZaloPay, VNPay...).

Nội dung: """${rawText.slice(0, 1500)}"""

Hãy trích xuất thông tin và trả về JSON hợp lệ (không markdown, không code block):
{"amount":số_tiền_VND_hoặc_null,"type":"income_hoặc_expense_hoặc_null","merchant":"tên_người_nhận_hoặc_cửa_hàng_hoặc_null","bankName":"tên_ngân_hàng_hoặc_ví_hoặc_null","date":"ISO_8601_hoặc_null"}

Quy tắc:
- amount: chỉ số nguyên dương VND, bỏ dấu chấm/phẩy, null nếu không đọc được
- type: "income" nếu tiền VÀO tài khoản, "expense" nếu tiền RA / thanh toán, null nếu không rõ
- merchant: người nhận/gửi, tên cửa hàng, mô tả ngắn — null nếu không có
- bankName: tên ngân hàng/ví điện tử phát hành thông báo — null nếu không rõ
- date: ISO 8601 (YYYY-MM-DDTHH:mm:ss) nếu đọc được, null nếu không`;

        logger.info('AI', 'Đang phân tích text thông báo ngân hàng...');
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Không tìm thấy JSON trong response');

        const parsed = JSON.parse(jsonMatch[0]) as AITransactionText;
        logger.success('AI', 'Đã phân tích text thông báo', { amount: parsed.amount, type: parsed.type });
        return parsed;
    } catch (err) {
        logger.warn('AI', 'Lỗi khi phân tích text thông báo', err);
        return null;
    }
}

export interface AICalorieEstimate {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface CalorieEstimateInput {
    description?: string;
    imageBase64?: string;
    mimeType?: string;
}

/** Ước tính calo + macro từ mô tả món ăn hoặc ảnh (tái dùng Gemini vision như OCR). */
export async function estimateCalories(input: CalorieEstimateInput): Promise<AICalorieEstimate | null> {
    const { description, imageBase64, mimeType } = input;
    if (!description?.trim() && !imageBase64) return null;
    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        const prompt = `Bạn là chuyên gia dinh dưỡng. ${imageBase64
            ? 'Đây là ảnh một món ăn / bữa ăn.'
            : `Món ăn được mô tả: """${(description || '').slice(0, 500)}"""`}

Hãy ước tính khẩu phần điển hình của người Việt và trả về JSON hợp lệ (không markdown, không code block):
{"name":"tên_món_ngắn_gọn_tiếng_Việt","calories":số_kcal,"protein":gram,"carbs":gram,"fat":gram}

Quy tắc:
- calories: số nguyên kcal (ước tính khẩu phần 1 người)
- protein/carbs/fat: gram (số nguyên, ước tính; 0 nếu không đáng kể)
- name: tên món ngắn gọn dễ hiểu
- Nếu không nhận ra món ăn, vẫn ước tính hợp lý nhất có thể`;

        logger.info('AI', 'Đang ước tính calo bằng Gemini...', { hasImage: !!imageBase64 });
        const parts: any[] = [{ text: prompt }];
        if (imageBase64 && mimeType) parts.push({ inlineData: { mimeType, data: imageBase64 } });
        const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Không tìm thấy JSON trong response');

        const raw = JSON.parse(jsonMatch[0]) as Partial<AICalorieEstimate>;
        const estimate: AICalorieEstimate = {
            name: raw.name?.trim() || 'Món ăn',
            calories: Math.max(0, Math.round(Number(raw.calories) || 0)),
            protein: Math.max(0, Math.round(Number(raw.protein) || 0)),
            carbs: Math.max(0, Math.round(Number(raw.carbs) || 0)),
            fat: Math.max(0, Math.round(Number(raw.fat) || 0)),
        };
        logger.success('AI', 'Đã ước tính calo', { name: estimate.name, calories: estimate.calories });
        return estimate;
    } catch (err) {
        logger.warn('AI', 'Lỗi khi ước tính calo', err);
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
