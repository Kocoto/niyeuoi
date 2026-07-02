import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, ArrowRight, HeartHandshake, Tags } from 'lucide-react';
import expenseApi, { type IWallet, type IExpenseCategory, type SummaryData, type IBudgetProgress, type CategorySpending, type ITransaction, type WalletScope, type TrendPoint } from '../api/expenseApi';
import WalletCard from '../components/expenses/WalletCard';
import AllocationPanel from '../components/expenses/AllocationPanel';
import SpendingChart from '../components/expenses/SpendingChart';
import TrendChart from '../components/expenses/TrendChart';
import AISummaryCard from '../components/expenses/AISummaryCard';
import QuickAddBar from '../components/expenses/QuickAddBar';
import BudgetProgressBar from '../components/expenses/BudgetProgressBar';
import TransactionItem from '../components/expenses/TransactionItem';
import TransactionForm from '../components/expenses/TransactionForm';
import BudgetForm from '../components/expenses/BudgetForm';
import WalletEditSheet from '../components/expenses/WalletEditSheet';
import CategoryManagerSheet from '../components/expenses/CategoryManagerSheet';
import NotifCaptureBanner from '../components/expenses/NotifCaptureBanner';
import NotificationImportSheet from '../components/expenses/NotificationImportSheet';
import { dequeueShareText } from '../utils/nativeApp';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { formatVND } from '../utils/currency';
import { ROLE_NAME, type Role } from '../constants/roles';

const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

const Expenses: React.FC = () => {
  const { role } = useAuth();
  const { toast } = useUI();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [scope, setScope] = useState<WalletScope>('shared');

  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [categories, setCategories] = useState<IExpenseCategory[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [budgets, setBudgets] = useState<IBudgetProgress[]>([]);
  const [report, setReport] = useState<CategorySpending[]>([]);
  const [recentTx, setRecentTx] = useState<ITransaction[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<ITransaction | null>(null);
  const [contributeMode, setContributeMode] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<IBudgetProgress | null>(null);
  const [editingWallet, setEditingWallet] = useState<IWallet | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [shareText, setShareText] = useState<string | null>(null);
  // Nonce tăng mỗi lần hiện 1 giao dịch mới → remount sheet để auto-parse lại.
  const [shareNonce, setShareNonce] = useState(0);
  const showingShareRef = useRef(false);

  // Android share / tự đọc notif: xử lý HÀNG ĐỢI lần lượt — mỗi lần 1 giao dịch,
  // đóng/lưu xong mới hiện cái tiếp theo (không đè mất khi nhiều thông báo dồn dập).
  const showNextShare = useCallback(() => {
    if (showingShareRef.current) return;
    const next = dequeueShareText();
    if (next === null) return;
    showingShareRef.current = true;
    setShareText(next);
    setShareNonce((n) => n + 1);
  }, []);

  const closeShare = useCallback(() => {
    showingShareRef.current = false;
    setShareText(null);
    // Hiện giao dịch kế trong hàng đợi (nếu còn).
    setTimeout(showNextShare, 0);
  }, [showNextShare]);

  useEffect(() => {
    showNextShare(); // cold start / hàng đợi đã có sẵn
    window.addEventListener('niyeuoi-share-ready', showNextShare);
    return () => window.removeEventListener('niyeuoi-share-ready', showNextShare);
  }, [showNextShare]);

  const fetchBase = useCallback(async () => {
    try {
      const [walletsRes, catsRes] = await Promise.all([expenseApi.getWallets(), expenseApi.getCategories()]);
      setWallets(walletsRes.data.data ?? []);
      setCategories(catsRes.data.data ?? []);
    } catch {
      toast('Chưa tải được ví/danh mục.', 'error');
    }
  }, [toast]);

  const fetchScoped = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, budgetsRes, reportRes, txRes, trendsRes] = await Promise.all([
        expenseApi.getSummary(month, year, scope),
        expenseApi.getBudgets(month, year, scope),
        expenseApi.getReport(month, year, scope),
        expenseApi.getTransactions({ month, year, owner: scope, limit: 5, page: 1 }),
        expenseApi.getTrends(6, scope),
      ]);
      setSummary(summaryRes.data.data);
      setBudgets(budgetsRes.data.data ?? []);
      setReport(reportRes.data.data ?? []);
      setRecentTx(txRes.data.data ?? []);
      setTrends(trendsRes.data.data ?? []);
    } catch {
      toast('Chưa tải được dữ liệu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, year, scope, toast]);

  useEffect(() => { fetchBase(); }, [fetchBase]);
  useEffect(() => { fetchScoped(); }, [fetchScoped]);

  const refreshAll = useCallback(() => { fetchBase(); fetchScoped(); }, [fetchBase, fetchScoped]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const scopeWallets = wallets.filter((w) => w.owner === scope);
  const net = (summary?.totalIncome ?? 0) - (summary?.totalExpense ?? 0);
  const defaultWalletId = scopeWallets[0]?._id;
  const totalAssets = wallets.reduce((s, w) => s + w.balance, 0);
  const sharedWallet = wallets.find((w) => w.owner === 'shared');
  const myWallet = wallets.find((w) => w.owner === role);

  const openContribute = () => { setEditingTx(null); setContributeMode(true); setShowForm(true); };
  const openAdd = () => { setEditingTx(null); setContributeMode(false); setShowForm(true); };

  const SCOPES: { id: WalletScope; label: string }[] = [
    { id: 'shared', label: 'Quỹ chung' },
    { id: role as Role, label: `Của ${ROLE_NAME[role as Role]}` },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Chi tiêu</h1>
          <p className="page-subtitle">Quỹ chung và chi tiêu cá nhân của hai bạn</p>
        </div>
        <button type="button" onClick={openAdd} className="btn-add" aria-label="Thêm giao dịch">
          <Plus size={20} />
        </button>
      </div>

      {/* Tổng tài sản + Góp quỹ chung */}
      <div className="mb-4 flex items-center justify-between rounded-[1.5rem] bg-gradient-to-br from-rose-100 via-pink-50 to-sky-50 p-5 ring-1 ring-rose-100">
        <div>
          <p className="text-[11px] font-semibold text-soft">Tổng tài sản hai bạn</p>
          <p className="mt-1 text-2xl font-bold text-ink">{formatVND(totalAssets)}</p>
        </div>
        {sharedWallet && myWallet && (
          <button
            type="button"
            onClick={openContribute}
            className="flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-xs font-bold text-primary shadow-sm transition hover:bg-white"
          >
            <HeartHandshake size={14} /> Góp quỹ chung
          </button>
        )}
      </div>

      {/* Scope toggle */}
      <div className="mb-4 flex rounded-full bg-black/5 p-1">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScope(s.id)}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition ${scope === s.id ? 'bg-white text-ink shadow-sm' : 'text-soft'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Allocation 50/30/20 */}
      <div className="mb-4">
        <AllocationPanel owner={scope as 'shared' | Role} month={month} year={year} />
      </div>

      {/* Month selector */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <button type="button" onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 transition hover:bg-black/10">
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[9rem] text-center text-sm font-bold text-ink">{MONTH_NAMES[month - 1]} {year}</span>
        <button type="button" onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 transition hover:bg-black/10">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {/* Wallet cards (theo scope) */}
        {scopeWallets.length > 0 && (
          <section>
            <p className="section-label mb-3">{scope === 'shared' ? 'Quỹ chung' : 'Ví cá nhân'}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {scopeWallets.map((w) => (
                <WalletCard key={w._id} wallet={w} onClick={() => setEditingWallet(w)} />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-soft/60">Chạm vào ví để chỉnh số dư hiện tại.</p>
          </section>
        )}

        {/* Ghi nhanh */}
        <QuickAddBar wallets={wallets} categories={categories} defaultWalletId={defaultWalletId} onAdded={refreshAll} />

        <button
          type="button"
          onClick={() => setShowCategoryManager(true)}
          className="flex items-center gap-1.5 self-start text-[11px] font-bold text-primary"
        >
          <Tags size={13} /> Quản lý danh mục
        </button>

        <NotifCaptureBanner />

        {/* Summary */}
        {summary && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface-card grid grid-cols-3 divide-x divide-black/5 px-2 py-4">
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

        {/* AI tổng kết tháng */}
        <AISummaryCard month={month} year={year} owner={scope} />

        {/* Spending chart */}
        {report.length > 0 && (
          <div className="surface-card p-5">
            <p className="section-label mb-4">Chi tiêu theo danh mục</p>
            <SpendingChart data={report} totalExpense={summary?.totalExpense ?? 0} />
          </div>
        )}

        {/* Xu hướng 6 tháng */}
        {trends.length > 0 && (
          <div className="surface-card p-5">
            <p className="section-label mb-4">Xu hướng 6 tháng</p>
            <TrendChart data={trends} />
          </div>
        )}

        {/* Budget */}
        <div className="surface-card py-3">
          <div className="mb-2 flex items-center justify-between px-5">
            <p className="section-label">Ngân sách tháng</p>
            <button
              type="button"
              onClick={() => { setEditingBudget(null); setShowBudgetForm(true); }}
              className="flex items-center gap-1 text-[11px] font-bold text-primary"
            >
              <Plus size={12} /> Đặt ngân sách
            </button>
          </div>
          {budgets.length > 0 ? (
            budgets.map((item) => (
              <BudgetProgressBar key={item.budget._id} item={item} onEdit={() => { setEditingBudget(item); setShowBudgetForm(true); }} />
            ))
          ) : (
            <p className="px-5 py-3 text-xs text-soft/70">Chưa đặt ngân sách nào cho {scope === 'shared' ? 'quỹ chung' : 'cá nhân'}.</p>
          )}
        </div>

        {/* Recent transactions */}
        {recentTx.length > 0 && (
          <div className="surface-card py-3">
            <div className="mb-2 flex items-center justify-between px-5">
              <p className="section-label">Giao dịch gần đây</p>
              <Link to="/expenses/transactions" className="flex items-center gap-1 text-[11px] font-bold text-primary">
                Xem tất cả <ArrowRight size={12} />
              </Link>
            </div>
            {recentTx.map((tx) => (
              <TransactionItem key={tx._id} tx={tx} onEdit={() => { setEditingTx(tx); setShowForm(true); }} />
            ))}
          </div>
        )}

        {!loading && scopeWallets.length === 0 && (
          <div className="empty-state">
            <p className="text-sm font-semibold text-soft">Chưa có ví nào trong phạm vi này</p>
          </div>
        )}
      </div>

      {showForm && (
        <TransactionForm
          wallets={wallets}
          categories={categories}
          editingTx={editingTx}
          defaultType={contributeMode ? 'transfer' : 'expense'}
          defaultWalletId={contributeMode ? myWallet?._id : defaultWalletId}
          defaultToWalletId={contributeMode ? sharedWallet?._id : undefined}
          onClose={() => { setShowForm(false); setEditingTx(null); setContributeMode(false); }}
          onSaved={refreshAll}
        />
      )}

      {showBudgetForm && (
        <BudgetForm
          categories={categories}
          month={month}
          year={year}
          owner={scope}
          editing={editingBudget}
          onClose={() => { setShowBudgetForm(false); setEditingBudget(null); }}
          onSaved={fetchScoped}
        />
      )}

      {editingWallet && (
        <WalletEditSheet
          wallet={editingWallet}
          onClose={() => setEditingWallet(null)}
          onSaved={refreshAll}
        />
      )}

      <AnimatePresence>
        {showCategoryManager && (
          <CategoryManagerSheet
            categories={categories}
            onClose={() => setShowCategoryManager(false)}
            onSaved={fetchBase}
          />
        )}
      </AnimatePresence>

      {/* Android share → mở sheet nhập từ thông báo với text đã share */}
      <AnimatePresence>
        {shareText !== null && (
          <NotificationImportSheet
            key={shareNonce}
            wallets={wallets}
            categories={categories}
            defaultWalletId={defaultWalletId}
            initialText={shareText}
            onClose={closeShare}
            onSaved={refreshAll}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Expenses;
