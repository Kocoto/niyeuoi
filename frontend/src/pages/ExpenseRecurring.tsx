import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, Loader2, RefreshCw } from 'lucide-react';
import expenseApi, { type IRecurringRule, type IWallet, type IExpenseCategory } from '../api/expenseApi';
import CategoryChip from '../components/expenses/CategoryChip';
import CategoryIcon from '../components/expenses/CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { formatVND } from '../utils/currency';

const FREQ_LABEL: Record<string, string> = { weekly: 'Hàng tuần', monthly: 'Hàng tháng', yearly: 'Hàng năm' };

const ExpenseRecurring: React.FC = () => {
  const { role } = useAuth();
  const { toast, confirm } = useUI();
  const [rules, setRules] = useState<IRecurringRule[]>([]);
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [categories, setCategories] = useState<IExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [nextRunDate, setNextRunDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rr, wr, cr] = await Promise.all([expenseApi.getRecurringRules(), expenseApi.getWallets(), expenseApi.getCategories()]);
      setRules(rr.data.data ?? []);
      setWallets(wr.data.data ?? []);
      setCategories(cr.data.data ?? []);
      if (wr.data.data?.[0]) setWalletId(wr.data.data[0]._id);
    } catch {
      toast('Chưa tải được dữ liệu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(amount.replace(/\D/g, ''));
    if (!name.trim()) return toast('Nhập tên nhé.', 'error');
    if (!amt || amt <= 0) return toast('Nhập số tiền nhé.', 'error');
    if (!walletId) return toast('Chọn ví nhé.', 'error');
    setSubmitting(true);
    try {
      await expenseApi.createRecurringRule({
        name: name.trim(), type: txType, amount: amt, walletId: walletId as any,
        categoryId: categoryId ? categoryId as any : undefined, frequency, nextRunDate: new Date(nextRunDate) as any, createdBy: role as any,
      });
      toast('Đã tạo quy tắc định kỳ.', 'success');
      setShowCreate(false);
      setName(''); setAmount(''); setCategoryId('');
      fetchAll();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa tạo được.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (rule: IRecurringRule) => {
    try {
      await expenseApi.updateRecurringRule(rule._id, { isActive: !rule.isActive });
      setRules(prev => prev.map(r => r._id === rule._id ? { ...r, isActive: !r.isActive } : r));
    } catch {
      toast('Chưa cập nhật được.', 'error');
    }
  };

  const handleDelete = async (rule: IRecurringRule) => {
    const ok = await confirm(`Xóa "${rule.name}"?`);
    if (!ok) return;
    try {
      await expenseApi.deleteRecurringRule(rule._id);
      toast('Đã xóa.', 'success');
      fetchAll();
    } catch {
      toast('Chưa xóa được.', 'error');
    }
  };

  const getWalletName = (w: IWallet | string | undefined) => {
    if (!w) return '';
    if (typeof w === 'object') return (w as IWallet).name;
    return '';
  };

  const getCat = (c: IExpenseCategory | string | undefined) => {
    if (!c || typeof c !== 'object') return null;
    return c as IExpenseCategory;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Thu chi định kỳ</h1>
          <p className="page-subtitle">Tự động ghi hoá đơn và thu nhập cố định hàng tháng</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="btn-add">
          <Plus size={20} />
        </button>
      </div>

      {!loading && rules.length === 0 ? (
        <div className="empty-state">
          <p className="text-sm font-semibold text-soft">Chưa có quy tắc nào</p>
          <p className="mt-2 text-xs text-soft/70">Thêm lương, tiền thuê nhà, Netflix... để tự động ghi mỗi kỳ.</p>
        </div>
      ) : (
        <div className="surface-card divide-y divide-black/5">
          {rules.map((rule) => {
            const cat = getCat(rule.categoryId as any);
            return (
              <div key={rule._id} className={`flex items-center gap-3 px-5 py-4 ${!rule.isActive ? 'opacity-50' : ''}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  {cat ? <CategoryIcon name={cat.icon} size={16} /> : <RefreshCw size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-ink">{rule.name}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${rule.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
                      {rule.type === 'income' ? '+' : '−'}{formatVND(rule.amount)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-soft">
                    <span>{FREQ_LABEL[rule.frequency]}</span>
                    {getWalletName(rule.walletId as any) && <span>· {getWalletName(rule.walletId as any)}</span>}
                    <span>· Kế: {new Date(rule.nextRunDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleActive(rule)}
                    className={`relative h-6 w-11 rounded-full transition ${rule.isActive ? 'bg-primary' : 'bg-black/15'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${rule.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <button type="button" onClick={() => handleDelete(rule)} className="flex h-8 w-8 items-center justify-center rounded-full text-soft/40 hover:bg-rose-50 hover:text-rose-500">
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <div className="sheet-shell">
            <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} />
            <motion.div className="sheet-panel max-h-[90dvh] overflow-y-auto" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">Quy tắc mới</h2>
                <button type="button" onClick={() => setShowCreate(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex rounded-full bg-black/5 p-1">
                  {(['expense', 'income'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setTxType(t)}
                      className={`flex-1 rounded-full py-1.5 text-xs font-bold transition ${txType === t ? 'bg-white text-ink shadow-sm' : 'text-soft'}`}>
                      {t === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
                    </button>
                  ))}
                </div>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên (VD: Netflix, Tiền thuê nhà)" className="form-input" />
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Số tiền (₫)" className="form-input" />
                <div className="flex flex-col gap-1.5">
                  <label className="section-label">Ví</label>
                  <div className="grid grid-cols-2 gap-2">
                    {wallets.map((w) => (
                      <button key={w._id} type="button" onClick={() => setWalletId(w._id)}
                        className={`rounded-[1rem] px-3 py-2 text-left text-xs font-semibold ring-1 transition ${walletId === w._id ? 'bg-primary/10 text-primary ring-primary/40' : 'bg-[#faf5f8] text-soft ring-transparent'}`}>
                        {w.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="section-label">Danh mục</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <CategoryChip key={cat._id} category={cat} selected={categoryId === cat._id} onClick={() => setCategoryId(cat._id)} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="section-label">Tần suất</label>
                  <div className="flex rounded-full bg-black/5 p-1">
                    {(['weekly', 'monthly', 'yearly'] as const).map((f) => (
                      <button key={f} type="button" onClick={() => setFrequency(f)}
                        className={`flex-1 rounded-full py-1.5 text-xs font-bold transition ${frequency === f ? 'bg-white text-ink shadow-sm' : 'text-soft'}`}>
                        {FREQ_LABEL[f]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="section-label">Lần chạy đầu tiên</label>
                  <input type="date" value={nextRunDate} onChange={(e) => setNextRunDate(e.target.value)} className="form-input" />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Tạo quy tắc'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpenseRecurring;
