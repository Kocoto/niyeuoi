import mongoose from 'mongoose';
import Debt, { IDebt, DebtOwner } from '../models/Debt';
import Transaction from '../models/Transaction';
import ExpenseCategory from '../models/ExpenseCategory';
import expenseWalletService from './expenseWalletService';
import notificationService from './notificationService';
import logger from '../utils/logger';
import type { AuthRole } from '../utils/authToken';

function fmtVND(amount: number): string {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
    if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
    return `${amount}đ`;
}

export interface PayoffProjectionItem {
    debtId: string;
    name: string;
    remainingAmount: number;
    monthlyPayment: number;
    interestRate: number;
    monthsLeft: number;
    totalInterest: number;
}

export interface PayoffProjection {
    items: PayoffProjectionItem[];
    snowball: string[];  // tên nợ theo thứ tự trả nhỏ trước
    avalanche: string[]; // tên nợ theo thứ tự lãi cao trước
}

class ExpenseDebtService {
    private async getDebtCategoryId(): Promise<mongoose.Types.ObjectId> {
        let cat = await ExpenseCategory.findOne({ name: 'Trả nợ', isDefault: true });
        if (!cat) {
            cat = await ExpenseCategory.create({
                name: 'Trả nợ',
                icon: 'credit-card',
                color: 'red',
                bucket: 'needs',
                isDefault: true,
                createdBy: 'boyfriend',
            });
        }
        return cat._id as mongoose.Types.ObjectId;
    }

    async getDebts(owner?: DebtOwner): Promise<IDebt[]> {
        const query: Record<string, any> = {};
        if (owner) query.owner = owner;
        return Debt.find(query).sort({ isActive: -1, createdAt: 1 });
    }

    async createDebt(data: Partial<IDebt>): Promise<IDebt> {
        logger.info('Debt', 'Tạo khoản nợ mới', { name: data.name });
        try {
            const debt = await Debt.create({
                ...data,
                // remainingAmount mặc định = totalAmount nếu không truyền
                remainingAmount: data.remainingAmount ?? data.totalAmount,
                isActive: true,
            });
            logger.success('Debt', 'Đã tạo khoản nợ', { id: debt._id });
            return debt;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((v: any) => v.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async updateDebt(id: string, data: Partial<IDebt>): Promise<IDebt> {
        logger.info('Debt', 'Cập nhật khoản nợ', { id });
        const debt = await Debt.findById(id);
        if (!debt) throw new Error('NOT_FOUND');
        // isActive và remainingAmount chỉ thay đổi qua pay() — không cho sửa trực tiếp
        const { isActive: _a, remainingAmount: _r, ...safeData } = data as any;
        Object.assign(debt, safeData);
        await debt.save();
        logger.success('Debt', 'Đã cập nhật khoản nợ', { id });
        return debt;
    }

    async deleteDebt(id: string): Promise<void> {
        logger.info('Debt', 'Xóa khoản nợ', { id });
        const debt = await Debt.findByIdAndDelete(id);
        if (!debt) throw new Error('NOT_FOUND');
        logger.success('Debt', 'Đã xóa khoản nợ', { id });
    }

    /** Trả nợ: tạo giao dịch expense atomic + trừ remainingAmount; đóng khi về 0. */
    async pay(debtId: string, amount: number, walletId: string, createdBy: AuthRole): Promise<IDebt> {
        logger.info('Debt', 'Trả nợ', { debtId, amount });

        const debt = await Debt.findById(debtId);
        if (!debt) throw new Error('NOT_FOUND');
        if (!debt.isActive) throw new Error('VALIDATION_ERROR: Khoản nợ đã đóng');
        if (amount <= 0) throw new Error('VALIDATION_ERROR: Số tiền phải lớn hơn 0');

        const categoryId = await this.getDebtCategoryId();
        const newRemaining = Math.max(0, debt.remainingAmount - amount);

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            await Transaction.create([{
                type: 'expense',
                amount,
                walletId: new mongoose.Types.ObjectId(walletId),
                categoryId,
                note: `Trả nợ: ${debt.name}`,
                date: new Date(),
                createdBy,
            }], { session });

            await expenseWalletService.adjustBalance(walletId, -amount, session);

            debt.remainingAmount = newRemaining;
            if (newRemaining === 0) debt.isActive = false;
            await debt.save({ session });

            await session.commitTransaction();
            logger.success('Debt', `Đã trả ${fmtVND(amount)}, còn lại ${fmtVND(newRemaining)}`, { debtId });
            return debt;
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

    /** Dự báo trả hết nợ + gợi ý thứ tự snowball/avalanche (A6). */
    async getPayoffProjection(owner: DebtOwner): Promise<PayoffProjection> {
        const debts = await Debt.find({ owner, isActive: true });

        const items: PayoffProjectionItem[] = debts.map((d) => {
            const r = d.remainingAmount;
            const p = d.monthlyPayment;
            const annualRate = d.interestRate ?? 0;
            const monthlyRate = annualRate / 100 / 12;

            let monthsLeft = 0;
            let totalInterest = 0;

            if (p > 0) {
                if (monthlyRate === 0) {
                    monthsLeft = Math.ceil(r / p);
                } else {
                    // Amortization: n = -ln(1 - r*rate/p) / ln(1+rate)
                    const x = 1 - (r * monthlyRate) / p;
                    monthsLeft = x <= 0 ? 999 : Math.ceil(-Math.log(x) / Math.log(1 + monthlyRate));
                    totalInterest = Math.max(0, Math.round(monthsLeft * p - r));
                }
            }

            return {
                debtId: String(d._id),
                name: d.name,
                remainingAmount: r,
                monthlyPayment: p,
                interestRate: annualRate,
                monthsLeft,
                totalInterest,
            };
        });

        const snowball = [...items]
            .sort((a, b) => a.remainingAmount - b.remainingAmount)
            .map((i) => i.name);
        const avalanche = [...items]
            .sort((a, b) => b.interestRate - a.interestRate)
            .map((i) => i.name);

        return { items, snowball, avalanche };
    }

    /** Gọi từ cron hàng ngày: bắn Discord khi nợ đến hạn trong 3 ngày hoặc hôm nay. */
    async checkDueDateAlerts(): Promise<void> {
        const today = new Date().getDate();
        const debts = await Debt.find({ isActive: true, dueDayOfMonth: { $exists: true, $ne: null } });

        for (const debt of debts) {
            const due = debt.dueDayOfMonth!;
            const daysUntil = due - today;

            if (daysUntil === 3) {
                await notificationService.sendDiscord(
                    '🔔 Nhắc trả nợ',
                    `Khoản nợ **${debt.name}** đến hạn trả vào ngày **${due}** (còn 3 ngày). Số phải trả: **${fmtVND(debt.monthlyPayment)}**.`,
                    16753920,
                ).catch(() => {});
            } else if (daysUntil === 0) {
                await notificationService.sendDiscord(
                    '⚠️ Hôm nay đến hạn trả nợ',
                    `Khoản nợ **${debt.name}** đến hạn trả **hôm nay** (ngày ${due}). Số phải trả: **${fmtVND(debt.monthlyPayment)}**.`,
                    15158332,
                ).catch(() => {});
            }
        }
    }
}

export default new ExpenseDebtService();
