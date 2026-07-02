import cron from 'node-cron';
import { generateChallenge, generateCoupon } from './aiService';
import challengeService from './challengeService';
import couponService from './couponService';
import recurringRuleService from './recurringRuleService';
import expenseDebtService from './expenseDebtService';
import reminderService from './reminderService';
import Challenge from '../models/Challenge';
import Coupon from '../models/Coupon';
import logger from '../utils/logger';

async function runGenerateChallenge() {
    logger.info('Scheduler', 'Bắt đầu sinh thử thách tự động...');
    try {
        const existing = await Challenge.find({ isCompleted: false }).select('title').lean();
        const existingTitles = existing.map((c: any) => c.title);

        const data = await generateChallenge(existingTitles);
        if (!data) {
            logger.warn('Scheduler', 'Gemini không trả về dữ liệu thử thách, bỏ qua');
            return;
        }

        await challengeService.createChallenge({ ...data, isAiGenerated: true } as any);
        logger.success('Scheduler', `✔ Đã sinh thử thách: "${data.title}"`);
    } catch (err) {
        logger.error('Scheduler', 'Lỗi khi sinh thử thách tự động', err);
    }
}

async function runGenerateCoupon() {
    logger.info('Scheduler', 'Bắt đầu sinh voucher tự động...');
    try {
        const existing = await Coupon.find({ isUsed: false }).select('title').lean();
        const existingTitles = existing.map((c: any) => c.title);

        const data = await generateCoupon(existingTitles);
        if (!data) {
            logger.warn('Scheduler', 'Gemini không trả về dữ liệu voucher, bỏ qua');
            return;
        }

        await couponService.createCoupon({ ...data, isAiGenerated: true } as any);
        logger.success('Scheduler', `✔ Đã sinh voucher: "${data.title}"`);
    } catch (err) {
        logger.error('Scheduler', 'Lỗi khi sinh voucher tự động', err);
    }
}

export function start() {
    // Thứ Hai 8:00 sáng mỗi tuần
    cron.schedule('0 8 * * 1', runGenerateChallenge, { timezone: 'Asia/Ho_Chi_Minh' });

    // Ngày 1 hàng tháng 8:00 sáng
    cron.schedule('0 8 1 * *', runGenerateCoupon, { timezone: 'Asia/Ho_Chi_Minh' });

    // Hàng ngày 7:00 sáng — xử lý thu chi định kỳ
    cron.schedule('0 7 * * *', () => recurringRuleService.processDueRules(), { timezone: 'Asia/Ho_Chi_Minh' });

    // Hàng ngày 8:30 sáng — nhắc trả nợ (3 ngày trước hạn + hôm nay)
    cron.schedule('30 8 * * *', () => expenseDebtService.checkDueDateAlerts().catch(() => {}), { timezone: 'Asia/Ho_Chi_Minh' });

    // Mỗi phút — bắn nhắc nhở tới giờ (Web Push + Discord + Telegram)
    cron.schedule('* * * * *', () => reminderService.fireDue().catch(() => {}), { timezone: 'Asia/Ho_Chi_Minh' });

    logger.success('Scheduler', 'Đã khởi động cron jobs (thử thách: T2 hàng tuần, voucher: ngày 1 hàng tháng, thu chi định kỳ: hàng ngày 7:00, nhắc nợ: hàng ngày 8:30, nhắc nhở: mỗi phút)');
}

export { runGenerateChallenge, runGenerateCoupon };
