import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Pencil, Trash2, HandCoins } from 'lucide-react';
import type { IDebt } from '../../api/expenseApi';
import { formatVNDCompact } from '../../utils/currency';

interface DebtCardProps {
  debt: IDebt;
  onPay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const DebtCard: React.FC<DebtCardProps> = ({ debt, onPay, onEdit, onDelete }) => {
  const paidAmount = debt.totalAmount - debt.remainingAmount;
  const percentage = debt.totalAmount > 0 ? Math.round((paidAmount / debt.totalAmount) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-400">
            <CreditCard size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-ink">{debt.name}</p>
            {debt.creditor && (
              <p className="truncate text-xs text-soft">{debt.creditor}</p>
            )}
          </div>
        </div>

        {debt.isActive && (
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={onEdit} className="rounded-full p-1.5 text-soft hover:bg-black/5">
              <Pencil size={13} />
            </button>
            <button type="button" onClick={onDelete} className="rounded-full p-1.5 text-soft hover:bg-black/5">
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {!debt.isActive && (
          <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-600">
            Đã trả xong
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-xs text-soft">
          <span>Còn lại: <span className="font-bold text-ink">{formatVNDCompact(debt.remainingAmount)}</span></span>
          <span>Tổng: {formatVNDCompact(debt.totalAmount)}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
          <motion.div
            className="h-full rounded-full bg-green-400"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <p className="text-right text-[11px] text-soft">{percentage}% đã trả</p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-soft">
          <span>Phải trả/tháng: <span className="font-bold text-ink">{formatVNDCompact(debt.monthlyPayment)}</span></span>
          {debt.dueDayOfMonth && (
            <span>Hạn trả: <span className="font-bold text-ink">ngày {debt.dueDayOfMonth}</span></span>
          )}
          {debt.interestRate != null && debt.interestRate > 0 && (
            <span>Lãi: <span className="font-bold text-ink">{debt.interestRate}%/năm</span></span>
          )}
        </div>

        {debt.isActive && (
          <button
            type="button"
            onClick={onPay}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-rose-100"
          >
            <HandCoins size={13} />
            Trả nợ
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default DebtCard;
