import React from 'react';
import { motion } from 'framer-motion';
import type { TrendPoint } from '../../api/expenseApi';
import { formatVNDCompact } from '../../utils/currency';

interface TrendChartProps {
  data: TrendPoint[];
}

const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  if (!data.length) return null;
  const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)));
  const hasAny = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasAny) {
    return <p className="py-4 text-center text-xs text-soft">Chưa có dữ liệu các tháng trước.</p>;
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 110 }}>
              <motion.div
                className="w-2.5 rounded-t bg-green-300"
                initial={{ height: 0 }}
                animate={{ height: `${(d.income / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                title={`Thu: ${formatVNDCompact(d.income)}`}
              />
              <motion.div
                className="w-2.5 rounded-t bg-rose-300"
                initial={{ height: 0 }}
                animate={{ height: `${(d.expense / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 + 0.05 }}
                title={`Chi: ${formatVNDCompact(d.expense)}`}
              />
            </div>
            <span className="text-[10px] font-semibold text-soft">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-4 text-[11px] text-soft">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-300" /> Thu</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-300" /> Chi</span>
      </div>
    </div>
  );
};

export default TrendChart;
