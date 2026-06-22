import mongoose from 'mongoose';
import Transaction, { ITransaction, TransactionType } from '../models/Transaction';
import expenseWalletService from './expenseWalletService';
import logger from '../utils/logger';
import type { AuthRole } from '../utils/authToken';

interface TransactionFilters {
    walletId?: string;
    categoryId?: string;
    type?: TransactionType;
    createdBy?: AuthRole;
    month?: number;
    year?: number;
    page?: number;
    limit?: number;
}

function buildDateRange(month?: number, year?: number) {
    if (!month || !year) return {};
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return { date: { $gte: start, $lt: end } };
}

class ExpenseTransactionService {
    async getTransactions(filters: TransactionFilters): Promise<{ data: ITransaction[]; total: number; page: number }> {
        const { walletId, categoryId, type, createdBy, month, year, page = 1, limit = 30 } = filters;

        const query: Record<string, any> = { ...buildDateRange(month, year) };
        if (walletId) query.walletId = walletId;
        if (categoryId) query.categoryId = categoryId;
        if (type) query.type = type;
        if (createdBy) query.createdBy = createdBy;

        logger.info('Transaction', 'Lấy danh sách giao dịch', { page, limit, ...filters });
        const [data, total] = await Promise.all([
            Transaction.find(query)
                .populate('walletId', 'name color icon owner')
                .populate('categoryId', 'name icon color')
                .populate('toWalletId', 'name color icon owner')
                .sort({ date: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Transaction.countDocuments(query),
        ]);

        logger.success('Transaction', `Trả về ${data.length}/${total} giao dịch`);
        return { data, total, page };
    }

    async createTransaction(data: Partial<ITransaction>): Promise<ITransaction> {
        logger.info('Transaction', 'Tạo giao dịch mới', { type: data.type, amount: data.amount });

        if (!data.walletId) throw new Error('VALIDATION_ERROR: Ví là bắt buộc');
        if (!data.amount || data.amount <= 0) throw new Error('VALIDATION_ERROR: Số tiền phải lớn hơn 0');
        if (data.type === 'transfer' && !data.toWalletId) throw new Error('VALIDATION_ERROR: Ví đích là bắt buộc khi chuyển khoản');
        if (data.type === 'transfer' && String(data.walletId) === String(data.toWalletId)) {
            throw new Error('VALIDATION_ERROR: Ví nguồn và ví đích không được giống nhau');
        }
        if (data.isSplitExpense && data.splitMethod === 'custom') {
            const total = (data.splitAmountBoyfriend ?? 0) + (data.splitAmountGirlfriend ?? 0);
            if (total !== data.amount) throw new Error('VALIDATION_ERROR: Tổng phần chia phải bằng số tiền giao dịch');
        }

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const [transaction] = await Transaction.create([data], { session });

            if (data.type === 'expense') {
                await expenseWalletService.adjustBalance(String(data.walletId), -data.amount, session);
            } else if (data.type === 'income') {
                await expenseWalletService.adjustBalance(String(data.walletId), data.amount, session);
            } else if (data.type === 'transfer') {
                await expenseWalletService.adjustBalance(String(data.walletId), -data.amount, session);
                await expenseWalletService.adjustBalance(String(data.toWalletId), data.amount, session);
            }

            await session.commitTransaction();
            logger.success('Transaction', 'Đã tạo giao dịch', { id: transaction._id });
            return transaction;
        } catch (err: any) {
            await session.abortTransaction();
            if (err.message?.startsWith('VALIDATION_ERROR')) throw err;
            logger.error('Transaction', 'Lỗi khi tạo giao dịch', err);
            throw err;
        } finally {
            session.endSession();
        }
    }

    async updateTransaction(id: string, data: Partial<ITransaction>): Promise<ITransaction> {
        logger.info('Transaction', 'Cập nhật giao dịch', { id });
        const existing = await Transaction.findById(id);
        if (!existing) throw new Error('NOT_FOUND');

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            // Reverse old balance effect
            if (existing.type === 'expense') {
                await expenseWalletService.adjustBalance(String(existing.walletId), existing.amount, session);
            } else if (existing.type === 'income') {
                await expenseWalletService.adjustBalance(String(existing.walletId), -existing.amount, session);
            } else if (existing.type === 'transfer') {
                await expenseWalletService.adjustBalance(String(existing.walletId), existing.amount, session);
                await expenseWalletService.adjustBalance(String(existing.toWalletId), -existing.amount, session);
            }

            // Apply new values (type and walletId cannot be changed to keep things sane)
            const newAmount = data.amount ?? existing.amount;
            const newWalletId = String(existing.walletId);
            const newToWalletId = String(existing.toWalletId ?? '');

            if (existing.type === 'expense') {
                await expenseWalletService.adjustBalance(newWalletId, -newAmount, session);
            } else if (existing.type === 'income') {
                await expenseWalletService.adjustBalance(newWalletId, newAmount, session);
            } else if (existing.type === 'transfer' && newToWalletId) {
                await expenseWalletService.adjustBalance(newWalletId, -newAmount, session);
                await expenseWalletService.adjustBalance(newToWalletId, newAmount, session);
            }

            const { type: _t, walletId: _w, toWalletId: _tw, createdBy: _c, ...safeData } = data as any;
            Object.assign(existing, safeData);
            await existing.save({ session });

            await session.commitTransaction();
            logger.success('Transaction', 'Đã cập nhật giao dịch', { id });
            return existing;
        } catch (err) {
            await session.abortTransaction();
            logger.error('Transaction', 'Lỗi khi cập nhật giao dịch', err);
            throw err;
        } finally {
            session.endSession();
        }
    }

    async deleteTransaction(id: string): Promise<void> {
        logger.info('Transaction', 'Xóa giao dịch', { id });
        const transaction = await Transaction.findById(id);
        if (!transaction) throw new Error('NOT_FOUND');

        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            if (transaction.type === 'expense') {
                await expenseWalletService.adjustBalance(String(transaction.walletId), transaction.amount, session);
            } else if (transaction.type === 'income') {
                await expenseWalletService.adjustBalance(String(transaction.walletId), -transaction.amount, session);
            } else if (transaction.type === 'transfer') {
                await expenseWalletService.adjustBalance(String(transaction.walletId), transaction.amount, session);
                await expenseWalletService.adjustBalance(String(transaction.toWalletId), -transaction.amount, session);
            }

            await transaction.deleteOne({ session });
            await session.commitTransaction();
            logger.success('Transaction', 'Đã xóa giao dịch', { id });
        } catch (err) {
            await session.abortTransaction();
            logger.error('Transaction', 'Lỗi khi xóa giao dịch', err);
            throw err;
        } finally {
            session.endSession();
        }
    }

    async getSummary(month: number, year: number) {
        logger.info('Transaction', 'Lấy tổng quan tháng', { month, year });
        const dateRange = buildDateRange(month, year);

        const agg = await Transaction.aggregate([
            { $match: { ...dateRange, type: { $in: ['income', 'expense'] } } },
            {
                $group: {
                    _id: { walletId: '$walletId', type: '$type' },
                    total: { $sum: '$amount' },
                },
            },
        ]);

        const Wallet = (await import('../models/Wallet')).default;
        const wallets = await Wallet.find();

        const byWallet = wallets.map((w: any) => {
            const income = agg.find((a: any) => String(a._id.walletId) === String(w._id) && a._id.type === 'income')?.total ?? 0;
            const expense = agg.find((a: any) => String(a._id.walletId) === String(w._id) && a._id.type === 'expense')?.total ?? 0;
            return { walletId: String(w._id), name: w.name, color: w.color, owner: w.owner, balance: w.balance, income, expense };
        });

        const totalIncome = byWallet.reduce((s: number, w: any) => s + w.income, 0);
        const totalExpense = byWallet.reduce((s: number, w: any) => s + w.expense, 0);

        return { totalIncome, totalExpense, byWallet };
    }

    async getSpendingByCategory(month: number, year: number, walletId?: string) {
        const dateRange = buildDateRange(month, year);
        const match: Record<string, any> = { ...dateRange, type: 'expense' };
        if (walletId) match.walletId = new mongoose.Types.ObjectId(walletId);

        const result = await Transaction.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$categoryId',
                    total: { $sum: '$amount' },
                },
            },
            {
                $lookup: {
                    from: 'expensecategories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    categoryId: '$_id',
                    categoryName: { $ifNull: ['$category.name', 'Khác'] },
                    categoryIcon: { $ifNull: ['$category.icon', 'circle-ellipsis'] },
                    categoryColor: { $ifNull: ['$category.color', 'slate'] },
                    total: 1,
                },
            },
            { $sort: { total: -1 } },
        ]);

        return result;
    }

    async getSplitSummary(month: number, year: number) {
        const dateRange = buildDateRange(month, year);
        const transactions = await Transaction.find({
            ...dateRange,
            isSplitExpense: true,
        }).populate('walletId', 'name').populate('categoryId', 'name icon color');

        let boyfriendPaid = 0;
        let girlfriendPaid = 0;

        for (const tx of transactions) {
            if (tx.paidBy === 'boyfriend') boyfriendPaid += tx.amount;
            else if (tx.paidBy === 'girlfriend') girlfriendPaid += tx.amount;
        }

        // Positive = boyfriend should pay more to balance; negative = girlfriend should
        const balance = girlfriendPaid - boyfriendPaid;

        return { boyfriendPaid, girlfriendPaid, balance, transactions };
    }
}

export default new ExpenseTransactionService();
