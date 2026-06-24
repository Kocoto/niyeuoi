import SavingsGoal, { ISavingsGoal } from '../models/SavingsGoal';
import expenseTransactionService from './expenseTransactionService';
import notificationService from './notificationService';
import logger from '../utils/logger';
import type { AuthRole } from '../utils/authToken';

class SavingsGoalService {
    async getAllGoals(): Promise<ISavingsGoal[]> {
        logger.info('SavingsGoal', 'Lấy danh sách mục tiêu');
        const goals = await SavingsGoal.find()
            .populate('walletId', 'name color icon')
            .sort({ isCompleted: 1, createdAt: -1 });
        logger.success('SavingsGoal', `Trả về ${goals.length} mục tiêu`);
        return goals;
    }

    async createGoal(data: Partial<ISavingsGoal>): Promise<ISavingsGoal> {
        logger.info('SavingsGoal', 'Tạo mục tiêu mới', { name: data.name });
        try {
            const goal = await SavingsGoal.create({ ...data, currentAmount: 0, isCompleted: false });
            logger.success('SavingsGoal', 'Đã tạo mục tiêu', { id: goal._id });
            return goal;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((v: any) => v.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async updateGoal(id: string, data: Partial<ISavingsGoal>): Promise<ISavingsGoal> {
        logger.info('SavingsGoal', 'Cập nhật mục tiêu', { id });
        const goal = await SavingsGoal.findById(id);
        if (!goal) throw new Error('NOT_FOUND');

        const { currentAmount: _ca, ...safeData } = data as any;
        Object.assign(goal, safeData);
        await goal.save();
        logger.success('SavingsGoal', 'Đã cập nhật mục tiêu', { id });
        return goal;
    }

    async deposit(id: string, amount: number, walletId: string, createdBy: AuthRole): Promise<ISavingsGoal> {
        logger.info('SavingsGoal', 'Nạp tiền vào mục tiêu', { id, amount });
        const goal = await SavingsGoal.findById(id);
        if (!goal) throw new Error('NOT_FOUND');
        if (goal.isCompleted) throw new Error('ALREADY_COMPLETED');
        if (amount <= 0) throw new Error('VALIDATION_ERROR: Số tiền phải lớn hơn 0');

        // Find "Tiết kiệm" category for the transaction
        const ExpenseCategory = (await import('../models/ExpenseCategory')).default;
        const savingsCat = await ExpenseCategory.findOne({ name: 'Tiết kiệm' });

        await expenseTransactionService.createTransaction({
            type: 'expense',
            amount,
            note: `Tiết kiệm: ${goal.name}`,
            walletId: walletId as any,
            categoryId: savingsCat?._id as any,
            date: new Date(),
            createdBy,
        });

        const prevPct = goal.currentAmount / goal.targetAmount;
        goal.currentAmount += amount;
        const newPct = goal.currentAmount / goal.targetAmount;
        if (goal.currentAmount >= goal.targetAmount) {
            goal.isCompleted = true;
        }
        await goal.save();

        // Thông báo khi đạt mốc 50% hoặc hoàn thành
        if (goal.isCompleted) {
            notificationService.sendDiscord(
                '🎉 Mục tiêu đã đạt!',
                `Hai bạn đã hoàn thành mục tiêu **${goal.name}** (${goal.targetAmount.toLocaleString('vi-VN')}đ). Tuyệt vời ❤️`,
                5763719,
            ).catch(() => {});
        } else if (prevPct < 0.5 && newPct >= 0.5) {
            notificationService.sendDiscord(
                '💪 Đã đi được nửa chặng',
                `Mục tiêu **${goal.name}** đã đạt ${Math.round(newPct * 100)}% — cố lên nhé!`,
                15844367,
            ).catch(() => {});
        }

        logger.success('SavingsGoal', 'Đã nạp tiền', { id, newAmount: goal.currentAmount });
        return goal;
    }

    async deleteGoal(id: string): Promise<void> {
        logger.info('SavingsGoal', 'Xóa mục tiêu', { id });
        const goal = await SavingsGoal.findById(id);
        if (!goal) throw new Error('NOT_FOUND');
        await goal.deleteOne();
        logger.success('SavingsGoal', 'Đã xóa mục tiêu', { id });
    }
}

export default new SavingsGoalService();
