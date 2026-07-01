import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import expenseApi, { type IBudgetPlan, type PlanOwner } from '../../api/expenseApi';
import AmountInput from './AmountInput';
import { useUI } from '../../context/UIContext';

interface PlanFormProps {
  owner: PlanOwner;
  existing: IBudgetPlan | null;
  onClose: () => void;
  onSaved: () => void;
}

const OWNER_LABELS: Record<PlanOwner, string> = {
  shared: 'Quỹ chung',
  boyfriend: 'Của Được',
  girlfriend: 'Của Ni',
};

const PlanForm: React.FC<PlanFormProps> = ({ owner, existing, onClose, onSaved }) => {
  const { toast } = useUI();

  const [monthlyIncome, setMonthlyIncome] = useState(existing?.monthlyIncome ?? 0);
  const [needsPct, setNeedsPct] = useState(existing?.needsPct ?? 50);
  const [wantsPct, setWantsPct] = useState(existing?.wantsPct ?? 30);
  const [savingsPct, setSavingsPct] = useState(existing?.savingsPct ?? 20);
  const [submitting, setSubmitting] = useState(false);

  const total = needsPct + wantsPct + savingsPct;

  useEffect(() => {
    if (existing) {
      setMonthlyIncome(existing.monthlyIncome);
      setNeedsPct(existing.needsPct);
      setWantsPct(existing.wantsPct);
      setSavingsPct(existing.savingsPct);
    }
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyIncome || monthlyIncome <= 0) return toast('Nhập thu nhập hàng tháng nhé.', 'error');
    if (total !== 100) return toast(`Tổng tỉ lệ phải đúng 100% (hiện: ${total}%).`, 'error');
    setSubmitting(true);
    try {
      await expenseApi.upsertPlan({ owner, monthlyIncome, needsPct, wantsPct, savingsPct });
      toast('Đã lưu hồ sơ thu nhập.', 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa lưu được.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sheet-shell">
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="sheet-backdrop"
        aria-label="Đóng"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 34 }}
        className="sheet-panel"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-rose-100" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black text-ink">Hồ sơ thu nhập — {OWNER_LABELS[owner]}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-soft">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="section-label mb-2 block">Thu nhập hàng tháng</label>
            <div className="surface-card p-4">
              <AmountInput value={monthlyIncome} onChange={setMonthlyIncome} placeholder="Nhập lương / thu nhập..." />
            </div>
          </div>

          <div>
            <label className="section-label mb-2 block">Phân bổ</label>
            <div className="surface-card divide-y divide-black/5">
              {([
                { label: '🏠 Thiết yếu (needs)', key: 'needs', value: needsPct, set: setNeedsPct },
                { label: '🎉 Mong muốn & hẹn hò (wants)', key: 'wants', value: wantsPct, set: setWantsPct },
                { label: '🐷 Tiết kiệm (savings)', key: 'savings', value: savingsPct, set: setSavingsPct },
              ] as const).map(({ label, key, value, set }) => (
                <div key={key} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm text-ink">{label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={value}
                      onChange={(e) => set(Number(e.target.value))}
                      className="w-14 rounded-xl bg-black/5 px-2 py-1 text-center text-sm font-bold text-ink outline-none"
                    />
                    <span className="text-sm font-bold text-soft">%</span>
                  </div>
                </div>
              ))}
            </div>
            <p className={`mt-1.5 text-xs font-semibold ${total === 100 ? 'text-green-600' : 'text-rose-500'}`}>
              Tổng: {total}% {total === 100 ? '✓' : '(cần đúng 100%)'}
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || total !== 100}
            className="btn-primary w-full disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Lưu hồ sơ'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default PlanForm;
