import { Request, Response } from 'express';
import expenseCategoryService from '../services/expenseCategoryService';
import expenseWalletService from '../services/expenseWalletService';
import expenseTransactionService from '../services/expenseTransactionService';
import expenseBudgetService from '../services/expenseBudgetService';
import savingsGoalService from '../services/savingsGoalService';
import recurringRuleService from '../services/recurringRuleService';
import { extractReceiptData } from '../services/aiService';
import type { IExpenseCategory } from '../models/ExpenseCategory';
import type { IWallet } from '../models/Wallet';
import type { ITransaction } from '../models/Transaction';
import type { IBudget } from '../models/Budget';
import type { ISavingsGoal } from '../models/SavingsGoal';
import type { IRecurringRule } from '../models/RecurringRule';
import { resolveCreatePayload, getRequestAuthRole } from '../utils/requestIdentity';

// ─── Categories ────────────────────────────────────────────────────────────────

export const getCategories = async (_req: Request, res: Response) => {
    try {
        const data = await expenseCategoryService.getAllCategories();
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy danh mục' });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    try {
        const payload = resolveCreatePayload<IExpenseCategory>(req, req.body);
        const data = await expenseCategoryService.createCategory(payload);
        res.status(201).json({ success: true, data });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi khi tạo danh mục' });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const data = await expenseCategoryService.updateCategory(req.params.id as string, req.body);
        res.json({ success: true, data });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy danh mục' });
        if (err.message === 'CANNOT_MODIFY_DEFAULT') return res.status(403).json({ success: false, error: 'Không thể sửa danh mục mặc định' });
        res.status(500).json({ success: false, error: 'Lỗi khi cập nhật danh mục' });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        await expenseCategoryService.deleteCategory(req.params.id as string);
        res.json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy danh mục' });
        if (err.message === 'CANNOT_DELETE_DEFAULT') return res.status(403).json({ success: false, error: 'Không thể xóa danh mục mặc định' });
        res.status(500).json({ success: false, error: 'Lỗi khi xóa danh mục' });
    }
};

// ─── Wallets ───────────────────────────────────────────────────────────────────

export const getWallets = async (_req: Request, res: Response) => {
    try {
        const data = await expenseWalletService.getAllWallets();
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy danh sách ví' });
    }
};

export const createWallet = async (req: Request, res: Response) => {
    try {
        const payload = resolveCreatePayload<IWallet>(req, req.body);
        const data = await expenseWalletService.createWallet(payload);
        res.status(201).json({ success: true, data });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi khi tạo ví' });
    }
};

export const updateWallet = async (req: Request, res: Response) => {
    try {
        const data = await expenseWalletService.updateWallet(req.params.id as string, req.body);
        res.json({ success: true, data });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy ví' });
        res.status(500).json({ success: false, error: 'Lỗi khi cập nhật ví' });
    }
};

export const deleteWallet = async (req: Request, res: Response) => {
    try {
        await expenseWalletService.deleteWallet(req.params.id as string);
        res.json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy ví' });
        if (err.message === 'CANNOT_DELETE_DEFAULT') return res.status(403).json({ success: false, error: 'Không thể xóa ví mặc định' });
        res.status(500).json({ success: false, error: 'Lỗi khi xóa ví' });
    }
};

// ─── Transactions ──────────────────────────────────────────────────────────────

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const { walletId, categoryId, type, createdBy, month, year, page, limit } = req.query as Record<string, string>;
        const result = await expenseTransactionService.getTransactions({
            walletId,
            categoryId,
            type: type as any,
            createdBy: createdBy as any,
            month: month ? parseInt(month) : undefined,
            year: year ? parseInt(year) : undefined,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 30,
        });
        res.json({ success: true, ...result });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy giao dịch' });
    }
};

export const createTransaction = async (req: Request, res: Response) => {
    try {
        const payload = resolveCreatePayload<ITransaction>(req, req.body);
        const data = await expenseTransactionService.createTransaction(payload);
        res.status(201).json({ success: true, data });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi khi tạo giao dịch' });
    }
};

export const updateTransaction = async (req: Request, res: Response) => {
    try {
        const data = await expenseTransactionService.updateTransaction(req.params.id as string, req.body);
        res.json({ success: true, data });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy giao dịch' });
        res.status(500).json({ success: false, error: 'Lỗi khi cập nhật giao dịch' });
    }
};

export const deleteTransaction = async (req: Request, res: Response) => {
    try {
        await expenseTransactionService.deleteTransaction(req.params.id as string);
        res.json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy giao dịch' });
        res.status(500).json({ success: false, error: 'Lỗi khi xóa giao dịch' });
    }
};

// ─── Budgets ───────────────────────────────────────────────────────────────────

export const getBudgets = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query as Record<string, string>;
        if (!month || !year) return res.status(400).json({ success: false, error: 'Cần tháng và năm' });
        const data = await expenseBudgetService.getBudgetsWithProgress(parseInt(month), parseInt(year));
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy ngân sách' });
    }
};

export const upsertBudget = async (req: Request, res: Response) => {
    try {
        const payload = resolveCreatePayload<IBudget>(req, req.body);
        const data = await expenseBudgetService.upsertBudget(payload);
        res.status(200).json({ success: true, data });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi khi cài ngân sách' });
    }
};

export const deleteBudget = async (req: Request, res: Response) => {
    try {
        await expenseBudgetService.deleteBudget(req.params.id as string);
        res.json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy ngân sách' });
        res.status(500).json({ success: false, error: 'Lỗi khi xóa ngân sách' });
    }
};

// ─── Savings Goals ─────────────────────────────────────────────────────────────

export const getSavingsGoals = async (_req: Request, res: Response) => {
    try {
        const data = await savingsGoalService.getAllGoals();
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy mục tiêu' });
    }
};

export const createSavingsGoal = async (req: Request, res: Response) => {
    try {
        const payload = resolveCreatePayload<ISavingsGoal>(req, req.body);
        const data = await savingsGoalService.createGoal(payload);
        res.status(201).json({ success: true, data });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi khi tạo mục tiêu' });
    }
};

export const updateSavingsGoal = async (req: Request, res: Response) => {
    try {
        const data = await savingsGoalService.updateGoal(req.params.id as string, req.body);
        res.json({ success: true, data });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy mục tiêu' });
        res.status(500).json({ success: false, error: 'Lỗi khi cập nhật mục tiêu' });
    }
};

export const deleteSavingsGoal = async (req: Request, res: Response) => {
    try {
        await savingsGoalService.deleteGoal(req.params.id as string);
        res.json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy mục tiêu' });
        res.status(500).json({ success: false, error: 'Lỗi khi xóa mục tiêu' });
    }
};

export const depositToGoal = async (req: Request, res: Response) => {
    try {
        const { amount, walletId } = req.body as { amount: number; walletId: string };
        if (!amount || !walletId) return res.status(400).json({ success: false, error: 'Thiếu số tiền hoặc ví' });
        const role = getRequestAuthRole(req);
        if (!role) return res.status(401).json({ success: false, error: 'Không xác định được người dùng' });
        const data = await savingsGoalService.deposit(req.params.id as string, amount, walletId, role);
        res.json({ success: true, data });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy mục tiêu' });
        if (err.message === 'ALREADY_COMPLETED') return res.status(400).json({ success: false, error: 'Mục tiêu đã hoàn thành' });
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi khi nạp tiền' });
    }
};

// ─── Recurring Rules ───────────────────────────────────────────────────────────

export const getRecurringRules = async (_req: Request, res: Response) => {
    try {
        const data = await recurringRuleService.getAllRules();
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy quy tắc định kỳ' });
    }
};

export const createRecurringRule = async (req: Request, res: Response) => {
    try {
        const payload = resolveCreatePayload<IRecurringRule>(req, req.body);
        const data = await recurringRuleService.createRule(payload);
        res.status(201).json({ success: true, data });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi khi tạo quy tắc' });
    }
};

export const updateRecurringRule = async (req: Request, res: Response) => {
    try {
        const data = await recurringRuleService.updateRule(req.params.id as string, req.body);
        res.json({ success: true, data });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy quy tắc' });
        res.status(500).json({ success: false, error: 'Lỗi khi cập nhật quy tắc' });
    }
};

export const deleteRecurringRule = async (req: Request, res: Response) => {
    try {
        await recurringRuleService.deleteRule(req.params.id as string);
        res.json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy quy tắc' });
        res.status(500).json({ success: false, error: 'Lỗi khi xóa quy tắc' });
    }
};

// ─── Aggregation / Reports ─────────────────────────────────────────────────────

export const getSummary = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query as Record<string, string>;
        if (!month || !year) return res.status(400).json({ success: false, error: 'Cần tháng và năm' });
        const data = await expenseTransactionService.getSummary(parseInt(month), parseInt(year));
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy tổng quan' });
    }
};

export const getReport = async (req: Request, res: Response) => {
    try {
        const { month, year, walletId } = req.query as Record<string, string>;
        if (!month || !year) return res.status(400).json({ success: false, error: 'Cần tháng và năm' });
        const data = await expenseTransactionService.getSpendingByCategory(parseInt(month), parseInt(year), walletId);
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy báo cáo' });
    }
};

export const getSplitSummary = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query as Record<string, string>;
        if (!month || !year) return res.status(400).json({ success: false, error: 'Cần tháng và năm' });
        const data = await expenseTransactionService.getSplitSummary(parseInt(month), parseInt(year));
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy tổng quan chi tiêu hẹn hò' });
    }
};

// ─── OCR ───────────────────────────────────────────────────────────────────────

export const scanReceipt = async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'Không có ảnh được tải lên' });
        const imageBase64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        const extracted = await extractReceiptData(imageBase64, mimeType);
        if (!extracted) return res.status(422).json({ success: false, error: 'Không đọc được thông tin từ ảnh' });
        res.json({ success: true, data: extracted });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi xử lý ảnh biên lai' });
    }
};
