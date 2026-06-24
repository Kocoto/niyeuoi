import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, Zap, Loader2 } from 'lucide-react';
import expenseApi, { type IQuickPreset, type IWallet, type IExpenseCategory } from '../../api/expenseApi';
import AmountInput from './AmountInput';
import CategoryChip from './CategoryChip';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { formatVNDCompact } from '../../utils/currency';

interface QuickAddBarProps {
  wallets: IWallet[];
  categories: IExpenseCategory[];
  defaultWalletId?: string;
  onAdded: () => void;
}

function idOf(ref: IWallet | IExpenseCategory | string | undefined): string {
  if (!ref) return '';
  if (typeof ref === 'object') return (ref as { _id: string })._id;
  return ref;
}

const QuickAddBar: React.FC<QuickAddBarProps> = ({ wallets, categories, defaultWalletId, onAdded }) => {
  const { role } = useAuth();
  const { toast, confirm } = useUI();
  const [presets, setPresets] = useState<IQuickPreset[]>([]);
  const [firing, setFiring] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // create form
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState(0);
  const [walletId, setWalletId] = useState(defaultWalletId ?? '');
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPresets = useCallback(async () => {
    try {
      const res = await expenseApi.getQuickPresets();
      setPresets(res.data.data ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchPresets(); }, [fetchPresets]);
  useEffect(() => { if (defaultWalletId && !walletId) setWalletId(defaultWalletId); }, [defaultWalletId, walletId]);

  const fire = async (preset: IQuickPreset) => {
    setFiring(preset._id);
    try {
      await expenseApi.createTransaction({
        type: preset.type,
        amount: preset.amount,
        note: preset.label,
        walletId: idOf(preset.walletId) as any,
        categoryId: (idOf(preset.categoryId) || undefined) as any,
        date: new Date().toISOString().slice(0, 10),
        createdBy: role as any,
      });
      toast(`Đã ghi nhanh: ${preset.label}`, 'success');
      onAdded();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa ghi được.', 'error');
    } finally {
      setFiring(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return toast('Nhập nhãn nhé.', 'error');
    if (!amount || amount <= 0) return toast('Nhập số tiền nhé.', 'error');
    if (!walletId) return toast('Chọn ví nhé.', 'error');
    setSubmitting(true);
    try {
      await expenseApi.createQuickPreset({
        label: label.trim(), type: 'expense', amount,
        walletId: walletId as any, categoryId: (categoryId || undefined) as any, createdBy: role as any,
      });
      toast('Đã lưu mẫu ghi nhanh.', 'success');
      setShowCreate(false);
      setLabel(''); setAmount(0); setCategoryId('');
      fetchPresets();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa lưu được.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (preset: IQuickPreset) => {
    const ok = await confirm(`Xoá mẫu "${preset.label}"?`);
    if (!ok) return;
    try {
      await expenseApi.deleteQuickPreset(preset._id);
      fetchPresets();
    } catch { toast('Chưa xoá được.', 'error'); }
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Zap size={13} className="text-amber-500" />
        <p className="section-label">Ghi nhanh</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p._id}
            type="button"
            onClick={() => fire(p)}
            onContextMenu={(e) => { e.preventDefault(); handleDelete(p); }}
            disabled={firing === p._id}
            className="group inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-ink ring-1 ring-black/10 transition hover:bg-amber-50 active:scale-95 disabled:opacity-50"
          >
            {firing === p._id ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} className="text-amber-500" />}
            <span>{p.label}</span>
            <span className="text-soft">{formatVNDCompact(p.amount)}</span>
            <span
              onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
              className="ml-0.5 hidden text-soft/40 hover:text-rose-500 group-hover:inline"
            >
              ×
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1 rounded-full bg-black/5 px-3 py-2 text-xs font-bold text-soft transition hover:bg-black/10"
        >
          <Plus size={12} /> Mẫu
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <div className="sheet-shell">
            <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} />
            <motion.div className="sheet-panel max-h-[90dvh] overflow-y-auto" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">Mẫu ghi nhanh</h2>
                <button type="button" onClick={() => setShowCreate(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nhãn (VD: Cà phê, Gửi xe)" className="form-input" />
                <div className="rounded-[1.25rem] bg-[#faf5f8] px-4 py-4">
                  <AmountInput value={amount} onChange={setAmount} />
                </div>
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
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Lưu mẫu'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickAddBar;
