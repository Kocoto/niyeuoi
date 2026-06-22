import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { ISavingsGoal, IWallet } from '../../api/expenseApi';
import { formatVND, formatVNDCompact } from '../../utils/currency';

interface SavingsGoalCardProps {
  goal: ISavingsGoal;
  onDeposit: () => void;
  onDelete: () => void;
}

const SIZE = 80;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({ goal, onDeposit, onDelete }) => {
  const pct = Math.min(goal.currentAmount / goal.targetAmount, 1);
  const dash = pct * CIRC;
  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
    : null;

  const walletName = goal.walletId && typeof goal.walletId === 'object'
    ? (goal.walletId as IWallet).name
    : null;

  return (
    <div className={`surface-card flex flex-col gap-4 p-5 ${goal.isCompleted ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Progress ring */}
        <div className="relative shrink-0">
          <svg width={SIZE} height={SIZE} className="rotate-[-90deg]">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#f3e8ef" strokeWidth={STROKE} />
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={goal.isCompleted ? '#22c55e' : '#e86ba8'}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${CIRC - dash}`}
              initial={{ strokeDasharray: `0 ${CIRC}` }}
              animate={{ strokeDasharray: `${dash} ${CIRC - dash}` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-ink">{Math.round(pct * 100)}%</span>
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-ink">{goal.name}</h3>
          {goal.note && <p className="mt-0.5 text-xs text-soft line-clamp-2">{goal.note}</p>}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <span className="text-xs text-soft">Đã: <strong className="text-ink">{formatVNDCompact(goal.currentAmount)}</strong></span>
            <span className="text-xs text-soft">Cần: <strong className="text-ink">{formatVNDCompact(goal.targetAmount)}</strong></span>
          </div>
          <p className="mt-1 text-xs text-soft">{formatVND(goal.targetAmount - goal.currentAmount)} còn thiếu</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-[11px] text-soft">
          {daysLeft !== null && (
            <span className={`rounded-full px-2 py-0.5 font-bold ${daysLeft <= 7 ? 'bg-rose-50 text-rose-500' : 'bg-black/5'}`}>
              {daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã hết hạn'}
            </span>
          )}
          {walletName && <span className="rounded-full bg-black/5 px-2 py-0.5">{walletName}</span>}
          {goal.isCompleted && <span className="rounded-full bg-green-50 px-2 py-0.5 font-bold text-green-600">Đã đạt!</span>}
        </div>
        <div className="flex gap-2">
          {!goal.isCompleted && (
            <button
              type="button"
              onClick={onDeposit}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20"
            >
              <PlusCircle size={12} /> Nạp tiền
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-full text-soft/40 transition hover:bg-rose-50 hover:text-rose-500"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavingsGoalCard;
