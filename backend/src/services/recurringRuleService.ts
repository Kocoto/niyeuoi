import RecurringRule, { IRecurringRule, RecurringFrequency } from '../models/RecurringRule';
import expenseTransactionService from './expenseTransactionService';
import logger from '../utils/logger';

function advanceDate(date: Date, frequency: RecurringFrequency): Date {
    const next = new Date(date);
    if (frequency === 'weekly') next.setDate(next.getDate() + 7);
    else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
    else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
    return next;
}

class RecurringRuleService {
    async getAllRules(): Promise<IRecurringRule[]> {
        logger.info('RecurringRule', 'Lấy danh sách quy tắc định kỳ');
        const rules = await RecurringRule.find()
            .populate('walletId', 'name color icon')
            .populate('categoryId', 'name icon color')
            .sort({ isActive: -1, nextRunDate: 1 });
        logger.success('RecurringRule', `Trả về ${rules.length} quy tắc`);
        return rules;
    }

    async createRule(data: Partial<IRecurringRule>): Promise<IRecurringRule> {
        logger.info('RecurringRule', 'Tạo quy tắc mới', { name: data.name });
        try {
            const rule = await RecurringRule.create(data);
            logger.success('RecurringRule', 'Đã tạo quy tắc', { id: rule._id });
            return rule;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((v: any) => v.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async updateRule(id: string, data: Partial<IRecurringRule>): Promise<IRecurringRule> {
        logger.info('RecurringRule', 'Cập nhật quy tắc', { id });
        const rule = await RecurringRule.findById(id);
        if (!rule) throw new Error('NOT_FOUND');
        Object.assign(rule, data);
        await rule.save();
        logger.success('RecurringRule', 'Đã cập nhật quy tắc', { id });
        return rule;
    }

    async deleteRule(id: string): Promise<void> {
        logger.info('RecurringRule', 'Xóa quy tắc', { id });
        const rule = await RecurringRule.findById(id);
        if (!rule) throw new Error('NOT_FOUND');
        await rule.deleteOne();
        logger.success('RecurringRule', 'Đã xóa quy tắc', { id });
    }

    async processDueRules(): Promise<void> {
        logger.info('RecurringRule', 'Kiểm tra quy tắc đến hạn...');
        const now = new Date();
        const dueRules = await RecurringRule.find({ isActive: true, nextRunDate: { $lte: now } });

        if (dueRules.length === 0) {
            logger.info('RecurringRule', 'Không có quy tắc nào đến hạn');
            return;
        }

        logger.info('RecurringRule', `Xử lý ${dueRules.length} quy tắc đến hạn`);
        for (const rule of dueRules) {
            try {
                await expenseTransactionService.createTransaction({
                    type: rule.type,
                    amount: rule.amount,
                    note: rule.name,
                    walletId: rule.walletId,
                    categoryId: rule.categoryId,
                    date: rule.nextRunDate,
                    isRecurring: true,
                    recurringRuleId: rule._id as any,
                    createdBy: rule.createdBy,
                });

                rule.nextRunDate = advanceDate(rule.nextRunDate, rule.frequency);
                await rule.save();
                logger.success('RecurringRule', `Đã xử lý quy tắc: ${rule.name}`, { nextRun: rule.nextRunDate });
            } catch (err) {
                logger.error('RecurringRule', `Lỗi khi xử lý quy tắc: ${rule.name}`, err);
            }
        }
    }
}

export default new RecurringRuleService();
