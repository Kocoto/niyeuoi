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

export type CategoryBucket = 'needs' | 'wants' | 'savings';

export interface IExpenseCategory {
  _id: string;
  name: string;
  icon: string;
  color: string;
  bucket: CategoryBucket;
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

export interface AiSummary {
  summary: string | null;
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

export type SavingsGoalType = 'normal' | 'emergency';

export interface ISavingsGoal {
  _id: string;
  name: string;
  type: SavingsGoalType;
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
  imageUrl?: string;
}

export interface TrendPoint {
  month: number;
  year: number;
  label: string;
  income: number;
  expense: number;
}

export interface IQuickPreset {
  _id: string;
  label: string;
  type: 'income' | 'expense';
  amount: number;
  walletId: IWallet | string;
  categoryId?: IExpenseCategory | string;
  createdBy: Role;
}

export type PlanOwner = 'shared' | Role;
export type DebtOwner = 'shared' | Role;

export interface IBudgetPlan {
  _id: string;
  owner: PlanOwner;
  monthlyIncome: number;
  needsPct: number;
  wantsPct: number;
  savingsPct: number;
}

export interface BucketAllocation {
  target: number;
  spent: number;
  remaining: number;
  percentage: number;
  pct: number;
}

export interface AllocationResult {
  owner: PlanOwner;
  month: number;
  year: number;
  income: number;
  debtTotal: number;
  disposable: number;
  buckets: { needs: BucketAllocation; wants: BucketAllocation; savings: BucketAllocation };
  daysLeft: number;
  dailyAllowance: number;
  hasPlan: boolean;
}

export interface IDebt {
  _id: string;
  name: string;
  creditor?: string;
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  dueDayOfMonth?: number;
  interestRate?: number;
  owner: DebtOwner;
  walletId?: string;
  isActive: boolean;
  createdBy: Role;
  createdAt: string;
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
  snowball: string[];
  avalanche: string[];
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
  updateCategory: (id: string, data: Partial<IExpenseCategory>) => api.put(`/expenses/categories/${id}`, data),
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

  // Finance Advice (AI cố vấn 50/30/20)
  getFinanceAdvice: (owner: PlanOwner, month: number, year: number) =>
    api.get<{ success: boolean; data: { advice: string } }>('/expenses/advice', { params: { owner, month, year } }),

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

  // Trends / AI / Export
  getTrends: (months: number, owner?: WalletScope) =>
    api.get<{ success: boolean; data: TrendPoint[] }>('/expenses/trends', { params: { months, owner } }),
  getAiSummary: (month: number, year: number, owner?: WalletScope) =>
    api.get<{ success: boolean; data: AiSummary }>('/expenses/ai-summary', { params: { month, year, owner } }),
  exportUrl: (month: number, year: number, owner?: WalletScope) => {
    const base = (api.defaults.baseURL ?? '').replace(/\/$/, '');
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (owner) params.set('owner', owner);
    return `${base}/expenses/export?${params.toString()}`;
  },

  // Quick presets
  getQuickPresets: () => api.get<{ success: boolean; data: IQuickPreset[] }>('/expenses/quick-presets'),
  createQuickPreset: (data: Partial<IQuickPreset>) => api.post('/expenses/quick-presets', data),
  deleteQuickPreset: (id: string) => api.delete(`/expenses/quick-presets/${id}`),

  // Upload ảnh hoá đơn (đính kèm thủ công)
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post<{ success: boolean; data: { url: string } }>('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Budget Plan
  getPlan: (owner: PlanOwner) =>
    api.get<{ success: boolean; data: IBudgetPlan | null }>('/expenses/plan', { params: { owner } }),
  upsertPlan: (data: Partial<IBudgetPlan>) => api.post('/expenses/plan', data),
  getAllocation: (owner: PlanOwner, month: number, year: number) =>
    api.get<{ success: boolean; data: AllocationResult }>('/expenses/allocation', { params: { owner, month, year } }),

  // Debts
  getDebts: (owner?: DebtOwner) =>
    api.get<{ success: boolean; data: IDebt[] }>('/expenses/debts', { params: owner ? { owner } : {} }),
  createDebt: (data: Partial<IDebt>) => api.post('/expenses/debts', data),
  updateDebt: (id: string, data: Partial<IDebt>) => api.put(`/expenses/debts/${id}`, data),
  deleteDebt: (id: string) => api.delete(`/expenses/debts/${id}`),
  payDebt: (id: string, amount: number, walletId: string) =>
    api.post(`/expenses/debts/${id}/pay`, { amount, walletId }),
  getDebtProjection: (owner: DebtOwner) =>
    api.get<{ success: boolean; data: PayoffProjection }>('/expenses/debts/projection', { params: { owner } }),

  // Parse text thông báo ngân hàng
  parseText: (text: string) =>
    api.post<{ success: boolean; data: { amount: number | null; type: 'income' | 'expense' | null; merchant: string | null; bankName: string | null; date: string | null } }>('/expenses/parse-text', { text }),

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
