import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import AmountInput from './AmountInput';
import CategoryChip from './CategoryChip';
import expenseApi, { type IExpenseCategory, type IBudgetProgress, type WalletScope } from '../../api/expenseApi';
import { useUI } from '../../context/UIContext';

interface BudgetFormProps {
  categories: IExpenseCategory[];
  month: number;
  year: number;
  owner: WalletScope;
  editing?: IBudgetProgress | null;
  onClose: () => void;
  onSaved: () => void;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ categories, month, year, owner, editing, onClose, onSaved }) => {
  const { toast, confirm } = useUI();
  const [categoryId, setCategoryId] = useState(editing ? editing.budget.categoryId._id : '');
  const [limitAmount, setLimitAmount] = useState(editing?.budget.limitAmount ?? 0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return toast('Chọn danh mục nhé.', 'error');
    if (!limitAmount || limitAmount <= 0) return toast('Nhập hạn mức nhé.', 'error');
    setSubmitting(true);
    try {
      await expenseApi.upsertBudget({ categoryId, limitAmount, month, year, owner });
      toast('Đã đặt ngân sách.', 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa lưu được.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    const ok = await confirm('Xoá ngân sách này?');
    if (!ok) return;
    try {
      await expenseApi.deleteBudget(editing.budget._id);
      toast('Đã xoá.', 'success');
      onSaved();
      onClose();
    } catch {
      toast('Chưa xoá được.', 'error');
    }
  };

  const scopeLabel = owner === 'shared' ? 'Quỹ chung' : 'Cá nhân';

  return (
    <AnimatePresence>
      <div className="sheet-shell">
        <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="sheet-panel max-h-[90dvh] overflow-y-auto" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">{editing ? 'Sửa ngân sách' : 'Đặt ngân sách'}</h2>
              <p className="text-xs text-soft">{scopeLabel} · Tháng {month}/{year}</p>
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="section-label">Danh mục</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <CategoryChip
                    key={cat._id}
                    category={cat}
                    selected={categoryId === cat._id}
                    onClick={() => !editing && setCategoryId(cat._id)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="section-label">Hạn mức tháng</label>
              <div className="rounded-[1.25rem] bg-[#faf5f8] px-4 py-4">
                <AmountInput value={limitAmount} onChange={setLimitAmount} />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : (editing ? 'Cập nhật' : 'Đặt ngân sách')}
            </button>
            {editing && (
              <button type="button" onClick={handleDelete} className="w-full rounded-full py-2 text-sm font-bold text-rose-500 transition hover:bg-rose-50">
                Xoá ngân sách
              </button>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BudgetForm;
