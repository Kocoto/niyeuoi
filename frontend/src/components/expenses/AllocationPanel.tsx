import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, CreditCard, ChevronRight, Loader2 } from 'lucide-react';
import expenseApi, { type AllocationResult, type IBudgetPlan, type PlanOwner } from '../../api/expenseApi';
import PlanForm from './PlanForm';
import { formatVNDCompact } from '../../utils/currency';
import { useUI } from '../../context/UIContext';

interface AllocationPanelProps {
  owner: PlanOwner;
  month: number;
  year: number;
}

const BUCKET_LABELS = {
  needs: { label: 'Thiết yếu', emoji: '🏠', color: 'bg-blue-400' },
  wants: { label: 'Mong muốn', emoji: '🎉', color: 'bg-amber-400' },
  savings: { label: 'Tiết kiệm', emoji: '🐷', color: 'bg-green-400' },
} as const;

const AllocationPanel: React.FC<AllocationPanelProps> = ({ owner, month, year }) => {
  const { toast } = useUI();
  const [allocation, setAllocation] = useState<AllocationResult | null>(null);
  const [plan, setPlan] = useState<IBudgetPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [allocRes, planRes] = await Promise.all([
        expenseApi.getAllocation(owner, month, year),
        expenseApi.getPlan(owner),
      ]);
      setAllocation(allocRes.data.data);
      setPlan(planRes.data.data);
    } catch {
      toast('Chưa tải được phân bổ ngân sách.', 'error');
    } finally {
      setLoading(false);
    }
  }, [owner, month, year, toast]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-[1.5rem] bg-black/[0.02] py-6">
        <Loader2 size={18} className="animate-spin text-soft" />
      </div>
    );
  }

  if (!allocation?.hasPlan) {
    return (
      <>
        <div className="surface-card p-5 text-center">
          <p className="text-sm font-semibold text-ink">Phân bổ 50/30/20</p>
          <p className="mt-1 text-xs text-soft">Nhập thu nhập để thấy khung ngân sách theo nhóm thiết yếu · mong muốn · tiết kiệm.</p>
          <button
            type="button"
            onClick={() => setShowPlanForm(true)}
            className="btn-primary mt-4 w-full"
          >
            Thiết lập thu nhập
          </button>
        </div>

        <AnimatePresence>
          {showPlanForm && (
            <PlanForm
              owner={owner}
              existing={plan}
              onClose={() => setShowPlanForm(false)}
              onSaved={fetch}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  const a = allocation!;
  const buckets = (['needs', 'wants', 'savings'] as const);

  return (
    <>
      <div className="surface-card overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="min-w-0">
            <p className="section-label">Phân bổ tháng {month}/{year}</p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-xs text-soft">
              <span>Thu: <span className="font-bold text-ink">{formatVNDCompact(a.income)}</span></span>
              {a.debtTotal > 0 && (
                <span className="text-rose-500">− Nợ: <span className="font-bold">{formatVNDCompact(a.debtTotal)}</span></span>
              )}
              <span>= Chia: <span className="font-bold text-ink">{formatVNDCompact(a.disposable)}</span></span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPlanForm(true)}
            className="rounded-full p-2 text-soft hover:bg-black/5"
            aria-label="Thiết lập thu nhập"
          >
            <Settings size={15} />
          </button>
        </div>

        {/* Bucket bars */}
        <div className="divide-y divide-black/[0.04] px-4 pb-2">
          {buckets.map((key) => {
            const b = a.buckets[key];
            const cfg = BUCKET_LABELS[key];
            const barPct = Math.min(b.percentage, 100);
            const over = b.percentage > 100;

            return (
              <div key={key} className="py-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-ink">{cfg.emoji} {cfg.label} <span className="text-soft/70">({b.pct}%)</span></span>
                  <span className={`text-xs font-bold ${over ? 'text-rose-500' : b.percentage >= 80 ? 'text-amber-500' : 'text-green-600'}`}>
                    {b.percentage}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                  <motion.div
                    className={`h-full rounded-full ${over ? 'bg-rose-400' : b.percentage >= 80 ? 'bg-amber-400' : cfg.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${barPct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-soft">
                  <span>Đã chi: {formatVNDCompact(b.spent)}</span>
                  <span className="font-medium">
                    {over
                      ? <span className="text-rose-500">Vượt {formatVNDCompact(b.spent - b.target)}</span>
                      : `Còn ${formatVNDCompact(b.remaining)}`}
                  </span>
                  <span>Ngân sách: {formatVNDCompact(b.target)}</span>
                </div>
                {key === 'wants' && a.dailyAllowance > 0 && (
                  <p className="mt-0.5 text-right text-[11px] font-semibold text-amber-600">
                    ≈ {formatVNDCompact(a.dailyAllowance)}/ngày còn lại
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Debt link */}
        {a.debtTotal > 0 && (
          <Link
            to="/expenses/debts"
            className="flex items-center justify-between border-t border-black/5 px-4 py-3 text-xs font-semibold text-soft transition hover:bg-black/[0.02]"
          >
            <span className="flex items-center gap-2">
              <CreditCard size={13} className="text-rose-400" />
              Đang có {formatVNDCompact(a.debtTotal)}/tháng tiền nợ trừ trước
            </span>
            <ChevronRight size={13} />
          </Link>
        )}
        {a.debtTotal === 0 && (
          <Link
            to="/expenses/debts"
            className="flex items-center justify-between border-t border-black/5 px-4 py-3 text-xs font-semibold text-soft/60 transition hover:bg-black/[0.02]"
          >
            <span className="flex items-center gap-2">
              <CreditCard size={13} />
              Quản lý khoản nợ
            </span>
            <ChevronRight size={13} />
          </Link>
        )}
      </div>

      <AnimatePresence>
        {showPlanForm && (
          <PlanForm
            owner={owner}
            existing={plan}
            onClose={() => setShowPlanForm(false)}
            onSaved={fetch}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AllocationPanel;
