import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, ArrowRight } from 'lucide-react';
import expenseApi, { type IWallet, type IExpenseCategory, type SummaryData, type IBudgetProgress, type CategorySpending, type SplitSummary } from '../api/expenseApi';
import WalletCard from '../components/expenses/WalletCard';
import SpendingChart from '../components/expenses/SpendingChart';
import BudgetProgressBar from '../components/expenses/BudgetProgressBar';
import SplitSummaryCard from '../components/expenses/SplitSummaryCard';
import TransactionItem from '../components/expenses/TransactionItem';
import TransactionForm from '../components/expenses/TransactionForm';
import { useUI } from '../context/UIContext';
import { formatVND } from '../utils/currency';
import type { ITransaction } from '../api/expenseApi';

const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

const Expenses: React.FC = () => {
  const { toast } = useUI();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [categories, setCategories] = useState<IExpenseCategory[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [budgets, setBudgets] = useState<IBudgetProgress[]>([]);
  const [report, setReport] = useState<CategorySpending[]>([]);
  const [splitData, setSplitData] = useState<SplitSummary | null>(null);
  const [recentTx, setRecentTx] = useState<ITransaction[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [walletsRes, catsRes] = await Promise.all([
        expenseApi.getWallets(),
        expenseApi.getCategories(),
      ]);
      setWallets(walletsRes.data.data ?? []);
      setCategories(catsRes.data.data ?? []);

      const [summaryRes, budgetsRes, reportRes, splitRes, txRes] = await Promise.all([
        expenseApi.getSummary(month, year),
        expenseApi.getBudgets(month, year),
        expenseApi.getReport(month, year, selectedWallet ?? undefined),
        expenseApi.getSplitSummary(month, year),
        expenseApi.getTransactions({ month, year, limit: 5, page: 1 }),
      ]);
      setSummary(summaryRes.data.data);
      setBudgets(budgetsRes.data.data ?? []);
      setReport(reportRes.data.data ?? []);
      setSplitData(splitRes.data.data);
      setRecentTx(txRes.data.data ?? []);
    } catch {
      toast('Chưa tải được dữ liệu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, year, selectedWallet, toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const net = (summary?.totalIncome ?? 0) - (summary?.totalExpense ?? 0);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Chi tiêu</h1>
          <p className="page-subtitle">Theo dõi thu chi và quỹ chung của hai bạn</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn-add" aria-label="Thêm giao dịch">
          <Plus size={20} />
        </button>
      </div>

      {/* Month selector */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <button type="button" onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 transition hover:bg-black/10">
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[9rem] text-center text-sm font-bold text-ink">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button type="button" onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 transition hover:bg-black/10">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {/* Wallet cards */}
        {wallets.length > 0 && (
          <section>
            <p className="section-label mb-3">Ví của hai bạn</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {wallets.map((w) => (
                <WalletCard
                  key={w._id}
                  wallet={w}
                  selected={selectedWallet === w._id}
                  onClick={() => setSelectedWallet(selectedWallet === w._id ? null : w._id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Summary */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-card grid grid-cols-3 divide-x divide-black/5 px-2 py-4"
          >
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-[11px] font-semibold text-soft">Thu nhập</span>
              <span className="text-sm font-bold text-green-600">{formatVND(summary.totalIncome)}</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-[11px] font-semibold text-soft">Chi tiêu</span>
              <span className="text-sm font-bold text-rose-600">{formatVND(summary.totalExpense)}</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-[11px] font-semibold text-soft">Chênh lệch</span>
              <span className={`text-sm font-bold ${net >= 0 ? 'text-green-600' : 'text-rose-600'}`}>{formatVND(net)}</span>
            </div>
          </motion.div>
        )}

        {/* Spending chart */}
        {report.length > 0 && (
          <div className="surface-card p-5">
            <p className="section-label mb-4">Chi tiêu theo danh mục</p>
            <SpendingChart data={report} totalExpense={summary?.totalExpense ?? 0} />
          </div>
        )}

        {/* Budget progress */}
        {budgets.length > 0 && (
          <div className="surface-card py-3">
            <p className="section-label px-5 mb-2">Ngân sách tháng</p>
            {budgets.map((item, i) => (
              <BudgetProgressBar key={item.budget._id ?? i} item={item} />
            ))}
          </div>
        )}

        {/* Split summary */}
        {splitData && (splitData.boyfriendPaid > 0 || splitData.girlfriendPaid > 0) && (
          <div className="surface-card p-5">
            <p className="section-label mb-4">Chi tiêu hẹn hò</p>
            <SplitSummaryCard
              data={splitData}
              onBalance={() => setShowForm(true)}
            />
          </div>
        )}

        {/* Recent transactions */}
        {recentTx.length > 0 && (
          <div className="surface-card py-3">
            <div className="flex items-center justify-between px-5 mb-2">
              <p className="section-label">Giao dịch gần đây</p>
              <Link to="/expenses/transactions" className="flex items-center gap-1 text-[11px] font-bold text-primary">
                Xem tất cả <ArrowRight size={12} />
              </Link>
            </div>
            {recentTx.map((tx) => (
              <TransactionItem key={tx._id} tx={tx} />
            ))}
          </div>
        )}

        {!loading && wallets.length === 0 && (
          <div className="empty-state">
            <p className="text-sm font-semibold text-soft">Chưa có dữ liệu chi tiêu</p>
            <p className="mt-2 text-xs text-soft/70">Nhấn + để ghi giao dịch đầu tiên nhé.</p>
          </div>
        )}
      </div>

      {showForm && (
        <TransactionForm
          wallets={wallets}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
};

export default Expenses;
