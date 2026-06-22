import React from 'react';
import { motion } from 'framer-motion';
import type { IBudgetProgress } from '../../api/expenseApi';
import CategoryIcon from './CategoryIcon';
import { formatVNDCompact } from '../../utils/currency';

interface BudgetProgressBarProps {
  item: IBudgetProgress;
  onEdit?: () => void;
}

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ item, onEdit }) => {
  const { budget, spent, remaining, percentage, isOverBudget } = item;
  const cat = budget.categoryId;

  const barColor = isOverBudget
    ? 'bg-rose-500'
    : percentage >= 80
    ? 'bg-amber-400'
    : 'bg-green-400';

  const textColor = isOverBudget ? 'text-rose-600' : percentage >= 80 ? 'text-amber-600' : 'text-green-600';

  return (
    <div className="flex flex-col gap-2 rounded-[1.25rem] px-4 py-3 transition hover:bg-black/[0.02]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <CategoryIcon name={cat?.icon ?? 'circle-ellipsis'} size={14} />
          </span>
          <span className="text-sm font-semibold text-ink">{cat?.name ?? 'Danh mục'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${textColor}`}>{percentage}%</span>
          {onEdit && (
            <button type="button" onClick={onEdit} className="text-[10px] text-soft/60 underline">sửa</button>
          )}
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-soft">
        <span>Đã dùng: {formatVNDCompact(spent)}</span>
        <span className={isOverBudget ? 'font-bold text-rose-500' : ''}>
          {isOverBudget ? `Vượt ${formatVNDCompact(spent - budget.limitAmount)}` : `Còn ${formatVNDCompact(remaining)}`}
        </span>
        <span>Giới hạn: {formatVNDCompact(budget.limitAmount)}</span>
      </div>
    </div>
  );
};

export default BudgetProgressBar;
