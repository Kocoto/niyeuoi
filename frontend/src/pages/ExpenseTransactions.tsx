import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, Search, Download } from 'lucide-react';
import expenseApi, { type ITransaction, type IWallet, type IExpenseCategory } from '../api/expenseApi';
import TransactionItem from '../components/expenses/TransactionItem';
import TransactionForm from '../components/expenses/TransactionForm';
import { useUI } from '../context/UIContext';

const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const TYPES = [
  { id: '', label: 'Tất cả' },
  { id: 'expense', label: 'Chi tiêu' },
  { id: 'income', label: 'Thu nhập' },
  { id: 'transfer', label: 'Chuyển khoản' },
];

function groupByDate(txs: ITransaction[]): Record<string, ITransaction[]> {
  return txs.reduce<Record<string, ITransaction[]>>((acc, tx) => {
    const key = new Date(tx.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});
}

const ExpenseTransactions: React.FC = () => {
  const { toast, confirm } = useUI();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [type, setType] = useState('');
  const [walletId, setWalletId] = useState('');
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [categories, setCategories] = useState<IExpenseCategory[]>([]);
  const [txs, setTxs] = useState<ITransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<ITransaction | null>(null);
  const [search, setSearch] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchBase = useCallback(async () => {
    try {
      const [wr, cr] = await Promise.all([expenseApi.getWallets(), expenseApi.getCategories()]);
      setWallets(wr.data.data ?? []);
      setCategories(cr.data.data ?? []);
    } catch { /* ignore */ }
  }, []);

  const fetchTxs = useCallback(async (pg = 1, append = false) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { month, year, page: pg, limit: 30 };
      if (type) params.type = type;
      if (walletId) params.walletId = walletId;
      const res = await expenseApi.getTransactions(params);
      setTotal(res.data.total);
      setTxs(prev => append ? [...prev, ...res.data.data] : res.data.data);
      setPage(pg);
    } catch {
      toast('Chưa tải được giao dịch.', 'error');
    } finally {
      setLoading(false);
    }
  }, [month, year, type, walletId, toast]);

  useEffect(() => { fetchBase(); }, [fetchBase]);
  useEffect(() => { fetchTxs(1); }, [fetchTxs]);

  const handleDelete = async (id: string) => {
    const ok = await confirm('Xóa giao dịch này? Số dư ví sẽ được hoàn lại.');
    if (!ok) return;
    try {
      await expenseApi.deleteTransaction(id);
      toast('Đã xóa.', 'success');
      fetchTxs(1);
    } catch {
      toast('Chưa xóa được.', 'error');
    }
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const filteredTxs = useMemo(() => {
    const min = parseInt(minAmount.replace(/\D/g, '')) || 0;
    const max = parseInt(maxAmount.replace(/\D/g, '')) || Infinity;
    const q = search.trim().toLowerCase();
    return txs.filter((tx) => {
      if (tx.amount < min || tx.amount > max) return false;
      if (q) {
        const cat = tx.categoryId && typeof tx.categoryId === 'object' ? (tx.categoryId as IExpenseCategory).name : '';
        const hay = `${tx.note} ${cat}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [txs, search, minAmount, maxAmount]);

  const grouped = groupByDate(filteredTxs);
  const dateKeys = Object.keys(grouped).sort((a, b) => {
    const parse = (s: string) => {
      const [d, m, y] = s.split('/');
      return new Date(`${y}-${m}-${d}`).getTime();
    };
    return parse(b) - parse(a);
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Giao dịch</h1>
          <p className="page-subtitle">Tất cả thu chi theo thời gian</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={expenseApi.exportUrl(month, year)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-soft shadow-sm ring-1 ring-black/5 transition hover:bg-rose-50"
            title="Xuất CSV"
          >
            <Download size={18} />
          </a>
          <button type="button" onClick={() => { setEditingTx(null); setShowForm(true); }} className="btn-add">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Month selector */}
      <div className="mb-4 flex items-center justify-center gap-4">
        <button type="button" onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 hover:bg-black/10">
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[9rem] text-center text-sm font-bold">{MONTH_NAMES[month - 1]} {year}</span>
        <button type="button" onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 hover:bg-black/10">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={`chip ring-1 transition ${type === t.id ? 'bg-primary text-white ring-primary/40' : 'bg-white text-soft ring-black/10 hover:bg-black/5'}`}
          >
            {t.label}
          </button>
        ))}
        {wallets.length > 0 && (
          <select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="chip rounded-full bg-white text-soft ring-1 ring-black/10"
          >
            <option value="">Tất cả ví</option>
            {wallets.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        )}
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`chip ring-1 transition ${showFilters ? 'bg-primary text-white ring-primary/40' : 'bg-white text-soft ring-black/10'}`}
        >
          <Search size={12} /> Tìm
        </button>
      </div>

      {/* Search & amount filter */}
      {showFilters && (
        <div className="mb-4 flex flex-col gap-2 rounded-[1.25rem] bg-[#faf5f8] p-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-3 ring-1 ring-black/10">
            <Search size={14} className="text-soft" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo ghi chú / danh mục"
              className="w-full bg-transparent py-2 text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="Từ (₫)" className="w-24 rounded-full bg-white px-3 py-2 text-sm outline-none ring-1 ring-black/10" />
            <span className="text-soft">—</span>
            <input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} placeholder="Đến (₫)" className="w-24 rounded-full bg-white px-3 py-2 text-sm outline-none ring-1 ring-black/10" />
          </div>
        </div>
      )}

      {/* Transaction list */}
      {dateKeys.length === 0 && !loading ? (
        <div className="empty-state">
          <p className="text-sm font-semibold text-soft">Không có giao dịch nào</p>
        </div>
      ) : (
        <div className="surface-card py-3">
          {dateKeys.map((date) => (
            <div key={date}>
              <div className="px-5 py-2">
                <span className="section-label">{date}</span>
              </div>
              {grouped[date].map((tx) => (
                <TransactionItem
                  key={tx._id}
                  tx={tx}
                  onEdit={() => { setEditingTx(tx); setShowForm(true); }}
                  onDelete={() => handleDelete(tx._id)}
                />
              ))}
            </div>
          ))}
          {txs.length < total && (
            <div className="flex justify-center py-4">
              <button
                type="button"
                onClick={() => fetchTxs(page + 1, true)}
                className="btn-secondary text-sm"
                disabled={loading}
              >
                {loading ? 'Đang tải...' : 'Tải thêm'}
              </button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <TransactionForm
          wallets={wallets}
          categories={categories}
          editingTx={editingTx}
          onClose={() => { setShowForm(false); setEditingTx(null); }}
          onSaved={() => fetchTxs(1)}
        />
      )}
    </div>
  );
};

export default ExpenseTransactions;
