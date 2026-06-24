import mongoose from 'mongoose';
import Budget, { IBudget, BudgetOwner } from '../models/Budget';
import Transaction from '../models/Transaction';
import expenseWalletService from './expenseWalletService';
import logger from '../utils/logger';

class ExpenseBudgetService {
    async getBudgetsWithProgress(month: number, year: number, owner?: BudgetOwner) {
        logger.info('Budget', 'Lấy ngân sách tháng', { month, year, owner });
        const budgetQuery: Record<string, any> = { month, year };
        if (owner) budgetQuery.owner = owner;
        const budgets = await Budget.find(budgetQuery)
            .populate('categoryId', 'name icon color');

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);

        const spendMatch: Record<string, any> = {
            type: 'expense',
            date: { $gte: start, $lt: end },
        };
        if (owner) {
            const ids = await expenseWalletService.resolveWalletIds(owner);
            spendMatch.walletId = { $in: (ids ?? []).map((i) => new mongoose.Types.ObjectId(i)) };
        }

        const spendingAgg = await Transaction.aggregate([
            { $match: spendMatch },
            {
                $group: {
                    _id: '$categoryId',
                    total: { $sum: '$amount' },
                },
            },
        ]);

        const spendingMap = new Map<string, number>(
            spendingAgg.map((s: any) => [String(s._id), s.total]),
        );

        const result = budgets.map((budget) => {
            const spent = spendingMap.get(String(budget.categoryId)) ?? 0;
            const remaining = Math.max(0, budget.limitAmount - spent);
            const percentage = budget.limitAmount > 0 ? Math.round((spent / budget.limitAmount) * 100) : 0;
            return {
                budget,
                spent,
                remaining,
                percentage,
                isOverBudget: spent > budget.limitAmount,
            };
        });

        logger.success('Budget', `Trả về ${result.length} ngân sách với tiến độ`);
        return result;
    }

    async upsertBudget(data: Partial<IBudget>): Promise<IBudget> {
        logger.info('Budget', 'Upsert ngân sách', { categoryId: data.categoryId, month: data.month, year: data.year });
        if (!data.categoryId || !data.month || !data.year) {
            throw new Error('VALIDATION_ERROR: Thiếu danh mục, tháng hoặc năm');
        }

        const owner = data.owner ?? 'shared';
        const budget = await Budget.findOneAndUpdate(
            { categoryId: data.categoryId, month: data.month, year: data.year, owner },
            { ...data, owner },
            { upsert: true, new: true, runValidators: true },
        );

        logger.success('Budget', 'Đã upsert ngân sách', { id: budget._id });
        return budget;
    }

    async deleteBudget(id: string): Promise<void> {
        logger.info('Budget', 'Xóa ngân sách', { id });
        const budget = await Budget.findById(id);
        if (!budget) throw new Error('NOT_FOUND');
        await budget.deleteOne();
        logger.success('Budget', 'Đã xóa ngân sách', { id });
    }
}

export default new ExpenseBudgetService();
