import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import expenseApi, { type WalletScope } from '../../api/expenseApi';

interface AISummaryCardProps {
  month: number;
  year: number;
  owner: WalletScope;
}

const AISummaryCard: React.FC<AISummaryCardProps> = ({ month, year, owner }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(false);

  const generate = async () => {
    setLoading(true);
    setTried(true);
    try {
      const res = await expenseApi.getAiSummary(month, year, owner);
      setSummary(res.data.data.summary);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[1.5rem] bg-gradient-to-br from-rose-50 via-white to-sky-50 p-5 ring-1 ring-rose-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <Sparkles size={16} />
          </span>
          <p className="text-sm font-bold text-ink">Tổng kết tháng</p>
        </div>
        {!loading && (
          <button type="button" onClick={generate} className="text-[11px] font-bold text-primary">
            {tried ? 'Tạo lại' : 'Xem tổng kết'}
          </button>
        )}
      </div>

      {loading && (
        <div className="mt-3 flex items-center gap-2 text-xs text-soft">
          <Loader2 size={14} className="animate-spin" /> Đang phân tích chi tiêu...
        </div>
      )}

      {!loading && summary && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm leading-6 text-ink">
          {summary}
        </motion.p>
      )}

      {!loading && tried && !summary && (
        <p className="mt-3 text-xs text-soft">Chưa đủ dữ liệu để tổng kết tháng này.</p>
      )}

      {!loading && !tried && (
        <p className="mt-3 text-xs text-soft/70">Để AI nhìn lại chi tiêu tháng này và gợi ý nhẹ cho hai bạn.</p>
      )}
    </div>
  );
};

export default AISummaryCard;
