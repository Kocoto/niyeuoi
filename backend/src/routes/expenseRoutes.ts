import express from 'express';
import multer from 'multer';
import { validateObjectId } from '../middleware/validateObjectId';
import {
    getCategories, createCategory, updateCategory, deleteCategory,
    getWallets, createWallet, updateWallet, deleteWallet, setWalletBalance,
    getTransactions, createTransaction, updateTransaction, deleteTransaction,
    getBudgets, upsertBudget, deleteBudget,
    getSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, depositToGoal,
    getRecurringRules, createRecurringRule, updateRecurringRule, deleteRecurringRule,
    getSummary, getReport, getTrends, exportTransactions, getAiSummary,
    getQuickPresets, createQuickPreset, deleteQuickPreset,
    scanReceipt,
} from '../controllers/expenseController';

const router = express.Router();

// In-memory multer for OCR — không lưu ảnh lên Cloudinary
const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Chỉ chấp nhận ảnh JPG, PNG, WEBP'));
    },
});

// Categories
router.route('/categories')
    .get(getCategories)
    .post(createCategory);
router.route('/categories/:id')
    .put(validateObjectId, updateCategory)
    .delete(validateObjectId, deleteCategory);

// Wallets
router.route('/wallets')
    .get(getWallets)
    .post(createWallet);
router.route('/wallets/:id')
    .put(validateObjectId, updateWallet)
    .delete(validateObjectId, deleteWallet);
router.put('/wallets/:id/balance', validateObjectId, setWalletBalance);

// Transactions
router.route('/transactions')
    .get(getTransactions)
    .post(createTransaction);
router.route('/transactions/:id')
    .put(validateObjectId, updateTransaction)
    .delete(validateObjectId, deleteTransaction);

// Budgets
router.route('/budgets')
    .get(getBudgets)
    .post(upsertBudget);
router.delete('/budgets/:id', validateObjectId, deleteBudget);

// Savings Goals
router.route('/savings')
    .get(getSavingsGoals)
    .post(createSavingsGoal);
router.route('/savings/:id')
    .put(validateObjectId, updateSavingsGoal)
    .delete(validateObjectId, deleteSavingsGoal);
router.put('/savings/:id/deposit', validateObjectId, depositToGoal);

// Recurring Rules
router.route('/recurring')
    .get(getRecurringRules)
    .post(createRecurringRule);
router.route('/recurring/:id')
    .put(validateObjectId, updateRecurringRule)
    .delete(validateObjectId, deleteRecurringRule);

// Quick presets (ghi nhanh)
router.route('/quick-presets')
    .get(getQuickPresets)
    .post(createQuickPreset);
router.delete('/quick-presets/:id', validateObjectId, deleteQuickPreset);

// Aggregation / Reports
router.get('/summary', getSummary);
router.get('/report', getReport);
router.get('/trends', getTrends);
router.get('/export', exportTransactions);
router.get('/ai-summary', getAiSummary);

// OCR
router.post('/ocr', memoryUpload.single('receipt'), scanReceipt);

export default router;
