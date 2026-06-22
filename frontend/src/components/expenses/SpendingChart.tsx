import React from 'react';
import { motion } from 'framer-motion';
import type { CategorySpending } from '../../api/expenseApi';
import { formatVNDCompact } from '../../utils/currency';

const TAILWIND_STROKES: Record<string, string> = {
  rose: '#f43f5e', pink: '#ec4899', orange: '#f97316', amber: '#f59e0b',
  teal: '#14b8a6', green: '#22c55e', blue: '#3b82f6', purple: '#a855f7', slate: '#64748b',
};

interface SpendingChartProps {
  data: CategorySpending[];
  totalExpense: number;
}

const SIZE = 120;
const STROKE = 18;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const CX = SIZE / 2;
const CY = SIZE / 2;

const SpendingChart: React.FC<SpendingChartProps> = ({ data, totalExpense }) => {
  if (!data.length || totalExpense === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <div className="h-[120px] w-[120px] rounded-full bg-black/5" />
        <p className="text-xs text-soft">Chưa có chi tiêu tháng này</p>
      </div>
    );
  }

  const top5 = data.slice(0, 5);
  let offset = 0;

  const slices = top5.map((item) => {
    const pct = item.total / totalExpense;
    const dash = pct * CIRC;
    const gap = CIRC - dash;
    const rotation = offset * 360;
    offset += pct;
    return { ...item, dash, gap, rotation };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg width={SIZE} height={SIZE} className="rotate-[-90deg]">
          {slices.map((s, i) => (
            <motion.circle
              key={i}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={TAILWIND_STROKES[s.categoryColor] ?? '#64748b'}
              strokeWidth={STROKE}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={0}
              style={{ transform: `rotate(${s.rotation}deg)`, transformOrigin: `${CX}px ${CY}px` }}
              initial={{ strokeDasharray: `0 ${CIRC}` }}
              animate={{ strokeDasharray: `${s.dash} ${s.gap}` }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-semibold text-soft">Tổng</span>
          <span className="text-sm font-bold text-ink">{formatVNDCompact(totalExpense)}</span>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: TAILWIND_STROKES[s.categoryColor] ?? '#64748b' }}
            />
            <span className="min-w-0 flex-1 truncate text-[11px] text-ink">{s.categoryName}</span>
            <span className="shrink-0 text-[11px] font-bold text-soft">{formatVNDCompact(s.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpendingChart;
