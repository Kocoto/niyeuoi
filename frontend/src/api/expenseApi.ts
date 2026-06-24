import api from './api';
import type { Role } from '../constants/roles';

export interface IWallet {
  _id: string;
  name: string;
  owner: 'shared' | Role;
  balance: number;
  color: string;
  icon: string;
  isDefault: boolean;
}

export interface IExpenseCategory {
  _id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface ITransaction {
  _id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  note: string;
  walletId: IWallet | string;
  categoryId?: IExpenseCategory | string;
  toWalletId?: IWallet | string;
  date: string;
  isRecurring: boolean;
  imageUrl?: string;
  createdBy: Role;
  createdAt: string;
}

export type WalletScope = 'shared' | Role;

export interface IBudgetProgress {
  budget: {
    _id: string;
    categoryId: IExpenseCategory;
    owner: WalletScope;
    limitAmount: number;
    month: number;
    year: number;
  };
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

export interface ISavingsGoal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  note?: string;
  imageUrl?: string;
  isCompleted: boolean;
  walletId?: IWallet | string;
  createdBy: Role;
}

export interface IRecurringRule {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  walletId: IWallet | string;
  categoryId?: IExpenseCategory | string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  dayOfMonth?: number;
  nextRunDate: string;
  isActive: boolean;
  createdBy: Role;
}

export interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  byWallet: Array<{ walletId: string; name: string; color: string; owner: string; balance: number; income: number; expense: number }>;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
}

export interface OcrResult {
  amount: number | null;
  date: string | null;
  note: string | null;
  type: 'income' | 'expense' | null;
}

const expenseApi = {
  // Wallets
  getWallets: () => api.get<{ success: boolean; data: IWallet[] }>('/expenses/wallets'),
  createWallet: (data: Partial<IWallet>) => api.post('/expenses/wallets', data),
  updateWallet: (id: string, data: Partial<IWallet>) => api.put(`/expenses/wallets/${id}`, data),
  setWalletBalance: (id: string, balance: number) => api.put(`/expenses/wallets/${id}/balance`, { balance }),
  deleteWallet: (id: string) => api.delete(`/expenses/wallets/${id}`),

  // Categories
  getCategories: () => api.get<{ success: boolean; data: IExpenseCategory[] }>('/expenses/categories'),
  createCategory: (data: Partial<IExpenseCategory>) => api.post('/expenses/categories', data),
  deleteCategory: (id: string) => api.delete(`/expenses/categories/${id}`),

  // Transactions
  getTransactions: (params: Record<string, unknown>) =>
    api.get<{ success: boolean; data: ITransaction[]; total: number; page: number }>('/expenses/transactions', { params }),
  createTransaction: (data: Partial<ITransaction>) => api.post('/expenses/transactions', data),
  updateTransaction: (id: string, data: Partial<ITransaction>) => api.put(`/expenses/transactions/${id}`, data),
  deleteTransaction: (id: string) => api.delete(`/expenses/transactions/${id}`),

  // Reports
  getSummary: (month: number, year: number, owner?: WalletScope) =>
    api.get<{ success: boolean; data: SummaryData }>('/expenses/summary', { params: { month, year, owner } }),
  getReport: (month: number, year: number, owner?: WalletScope) =>
    api.get<{ success: boolean; data: CategorySpending[] }>('/expenses/report', { params: { month, year, owner } }),

  // Budgets
  getBudgets: (month: number, year: number, owner?: WalletScope) =>
    api.get<{ success: boolean; data: IBudgetProgress[] }>('/expenses/budgets', { params: { month, year, owner } }),
  upsertBudget: (data: Record<string, unknown>) => api.post('/expenses/budgets', data),
  deleteBudget: (id: string) => api.delete(`/expenses/budgets/${id}`),

  // Savings Goals
  getSavingsGoals: () => api.get<{ success: boolean; data: ISavingsGoal[] }>('/expenses/savings'),
  createSavingsGoal: (data: Partial<ISavingsGoal>) => api.post('/expenses/savings', data),
  updateSavingsGoal: (id: string, data: Partial<ISavingsGoal>) => api.put(`/expenses/savings/${id}`, data),
  depositToGoal: (id: string, amount: number, walletId: string) =>
    api.put(`/expenses/savings/${id}/deposit`, { amount, walletId }),
  deleteSavingsGoal: (id: string) => api.delete(`/expenses/savings/${id}`),

  // Recurring Rules
  getRecurringRules: () => api.get<{ success: boolean; data: IRecurringRule[] }>('/expenses/recurring'),
  createRecurringRule: (data: Partial<IRecurringRule>) => api.post('/expenses/recurring', data),
  updateRecurringRule: (id: string, data: Partial<IRecurringRule>) => api.put(`/expenses/recurring/${id}`, data),
  deleteRecurringRule: (id: string) => api.delete(`/expenses/recurring/${id}`),

  // OCR
  scanReceipt: (file: File) => {
    const form = new FormData();
    form.append('receipt', file);
    return api.post<{ success: boolean; data: OcrResult }>('/expenses/ocr', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default expenseApi;
