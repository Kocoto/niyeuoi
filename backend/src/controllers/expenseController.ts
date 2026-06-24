import { Request, Response } from 'express';
import expenseCategoryService from '../services/expenseCategoryService';
import expenseWalletService from '../services/expenseWalletService';
import expenseTransactionService from '../services/expenseTransactionService';
import expenseBudgetService from '../services/expenseBudgetService';
import savingsGoalService from '../services/savingsGoalService';
import recurringRuleService from '../services/recurringRuleService';
import quickPresetService from '../services/quickPresetService';
import { extractReceiptData, generateMonthlySummary } from '../services/aiService';
import cloudinary from '../config/cloudinary';
import type { IExpenseCategory } from '../models/ExpenseCategory';
import type { IWallet } from '../models/Wallet';
import type { ITransaction } from '../models/Transaction';
import type { IBudget } from '../models/Budget';
import type { ISavingsGoal } from '../models/SavingsGoal';
import type { IRecurringRule } from '../models/RecurringRule';
import type { IQuickPreset } from '../models/QuickPreset';
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

export const setWalletBalance = async (req: Request, res: Response) => {
    try {
        const { balance } = req.body as { balance: number };
        if (typeof balance !== 'number' || Number.isNaN(balance)) {
            return res.status(400).json({ success: false, error: 'Số dư không hợp lệ' });
        }
        const data = await expenseWalletService.setBalance(req.params.id as string, Math.round(balance));
        res.json({ success: true, data });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy ví' });
        res.status(500).json({ success: false, error: 'Lỗi khi đặt số dư' });
    }
};

// ─── Transactions ──────────────────────────────────────────────────────────────

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const { walletId, categoryId, type, createdBy, owner, month, year, page, limit } = req.query as Record<string, string>;
        const result = await expenseTransactionService.getTransactions({
            walletId,
            categoryId,
            type: type as any,
            createdBy: createdBy as any,
            owner: owner as any,
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
        const { month, year, owner } = req.query as Record<string, string>;
        if (!month || !year) return res.status(400).json({ success: false, error: 'Cần tháng và năm' });
        const data = await expenseBudgetService.getBudgetsWithProgress(parseInt(month), parseInt(year), owner as any);
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
        const { month, year, owner } = req.query as Record<string, string>;
        if (!month || !year) return res.status(400).json({ success: false, error: 'Cần tháng và năm' });
        const data = await expenseTransactionService.getSummary(parseInt(month), parseInt(year), owner as any);
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy tổng quan' });
    }
};

export const getReport = async (req: Request, res: Response) => {
    try {
        const { month, year, owner, walletId } = req.query as Record<string, string>;
        if (!month || !year) return res.status(400).json({ success: false, error: 'Cần tháng và năm' });
        const data = await expenseTransactionService.getSpendingByCategory(parseInt(month), parseInt(year), owner as any, walletId);
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy báo cáo' });
    }
};

export const getTrends = async (req: Request, res: Response) => {
    try {
        const { months, owner } = req.query as Record<string, string>;
        const data = await expenseTransactionService.getTrends(months ? parseInt(months) : 6, owner as any);
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy xu hướng' });
    }
};

export const exportTransactions = async (req: Request, res: Response) => {
    try {
        const { month, year, owner } = req.query as Record<string, string>;
        if (!month || !year) return res.status(400).json({ success: false, error: 'Cần tháng và năm' });
        const csv = await expenseTransactionService.exportCsv(parseInt(month), parseInt(year), owner as any);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="chi-tieu-${month}-${year}.csv"`);
        res.status(200).send(csv);
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi xuất dữ liệu' });
    }
};

export const getAiSummary = async (req: Request, res: Response) => {
    try {
        const { month, year, owner } = req.query as Record<string, string>;
        if (!month || !year) return res.status(400).json({ success: false, error: 'Cần tháng và năm' });
        const m = parseInt(month);
        const y = parseInt(year);

        const [summary, report, budgets] = await Promise.all([
            expenseTransactionService.getSummary(m, y, owner as any),
            expenseTransactionService.getSpendingByCategory(m, y, owner as any),
            expenseBudgetService.getBudgetsWithProgress(m, y, owner as any),
        ]);

        if (summary.totalIncome === 0 && summary.totalExpense === 0) {
            return res.json({ success: true, data: { summary: null } });
        }

        const text = await generateMonthlySummary({
            scopeLabel: owner === 'shared' ? 'Quỹ chung' : owner ? 'Cá nhân' : 'Tất cả',
            month: m,
            year: y,
            totalIncome: summary.totalIncome,
            totalExpense: summary.totalExpense,
            net: summary.totalIncome - summary.totalExpense,
            topCategories: report.slice(0, 3).map((r: any) => ({ name: r.categoryName, total: r.total })),
            budgetStatus: budgets.map((b: any) => ({ name: b.budget.categoryId?.name ?? 'Danh mục', percentage: b.percentage, isOver: b.isOverBudget })),
        });

        res.json({ success: true, data: { summary: text } });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi tạo tổng kết AI' });
    }
};

// ─── Quick Presets (ghi nhanh) ──────────────────────────────────────────────────

export const getQuickPresets = async (_req: Request, res: Response) => {
    try {
        const data = await quickPresetService.getAll();
        res.json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi lấy mẫu ghi nhanh' });
    }
};

export const createQuickPreset = async (req: Request, res: Response) => {
    try {
        const payload = resolveCreatePayload<IQuickPreset>(req, req.body);
        const data = await quickPresetService.create(payload);
        res.status(201).json({ success: true, data });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi khi tạo mẫu ghi nhanh' });
    }
};

export const deleteQuickPreset = async (req: Request, res: Response) => {
    try {
        await quickPresetService.remove(req.params.id as string);
        res.json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy mẫu' });
        res.status(500).json({ success: false, error: 'Lỗi khi xoá mẫu' });
    }
};

// ─── OCR ───────────────────────────────────────────────────────────────────────

export const scanReceipt = async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'Không có ảnh được tải lên' });
        const imageBase64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        // Đọc thông tin + lưu ảnh lên Cloudinary song song
        const [extracted, imageUrl] = await Promise.all([
            extractReceiptData(imageBase64, mimeType),
            cloudinary.uploader.upload(`data:${mimeType};base64,${imageBase64}`, { folder: 'niyeuoi/receipts' })
                .then((r) => r.secure_url)
                .catch(() => undefined),
        ]);

        if (!extracted) return res.status(422).json({ success: false, error: 'Không đọc được thông tin từ ảnh', data: { imageUrl } });
        res.json({ success: true, data: { ...extracted, imageUrl } });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi khi xử lý ảnh biên lai' });
    }
};
