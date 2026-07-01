import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Brain } from 'lucide-react';
import expenseApi, { type WalletScope, type PlanOwner } from '../../api/expenseApi';

interface AISummaryCardProps {
  month: number;
  year: number;
  owner: WalletScope;
}

type Tab = 'summary' | 'advice';

const AISummaryCard: React.FC<AISummaryCardProps> = ({ month, year, owner }) => {
  const [tab, setTab] = useState<Tab>('summary');

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryTried, setSummaryTried] = useState(false);

  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceTried, setAdviceTried] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  const generateSummary = async () => {
    setSummaryLoading(true);
    setSummaryTried(true);
    try {
      const res = await expenseApi.getAiSummary(month, year, owner);
      setSummary(res.data.data.summary);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const generateAdvice = async () => {
    setAdviceLoading(true);
    setAdviceTried(true);
    setAdviceError(null);
    try {
      const res = await expenseApi.getFinanceAdvice(owner as PlanOwner, month, year);
      setAdvice(res.data.data.advice);
    } catch (err: any) {
      setAdviceError(err?.response?.data?.error ?? 'Chưa tạo được lời khuyên.');
      setAdvice(null);
    } finally {
      setAdviceLoading(false);
    }
  };

  return (
    <div className="rounded-[1.5rem] bg-gradient-to-br from-rose-50 via-white to-sky-50 p-5 ring-1 ring-rose-100">
      {/* Tab bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-black/5 p-1">
          <button
            type="button"
            onClick={() => setTab('summary')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${tab === 'summary' ? 'bg-white text-ink shadow-sm' : 'text-soft'}`}
          >
            <Sparkles size={12} /> Tổng kết
          </button>
          <button
            type="button"
            onClick={() => setTab('advice')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${tab === 'advice' ? 'bg-white text-ink shadow-sm' : 'text-soft'}`}
          >
            <Brain size={12} /> Cố vấn
          </button>
        </div>

        {tab === 'summary' && !summaryLoading && (
          <button type="button" onClick={generateSummary} className="text-[11px] font-bold text-primary">
            {summaryTried ? 'Tạo lại' : 'Xem tổng kết'}
          </button>
        )}
        {tab === 'advice' && !adviceLoading && (
          <button type="button" onClick={generateAdvice} className="text-[11px] font-bold text-primary">
            {adviceTried ? 'Tạo lại' : 'Nhận lời khuyên'}
          </button>
        )}
      </div>

      {/* Summary tab */}
      {tab === 'summary' && (
        <>
          {summaryLoading && (
            <div className="flex items-center gap-2 text-xs text-soft">
              <Loader2 size={14} className="animate-spin" /> Đang phân tích chi tiêu...
            </div>
          )}
          {!summaryLoading && summary && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm leading-6 text-ink">
              {summary}
            </motion.p>
          )}
          {!summaryLoading && summaryTried && !summary && (
            <p className="text-xs text-soft">Chưa đủ dữ liệu để tổng kết tháng này.</p>
          )}
          {!summaryLoading && !summaryTried && (
            <p className="text-xs text-soft/70">Để AI nhìn lại chi tiêu tháng này và gợi ý nhẹ cho hai bạn.</p>
          )}
        </>
      )}

      {/* Advice tab */}
      {tab === 'advice' && (
        <>
          {adviceLoading && (
            <div className="flex items-center gap-2 text-xs text-soft">
              <Loader2 size={14} className="animate-spin" /> Đang phân tích tài chính...
            </div>
          )}
          {!adviceLoading && advice && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm leading-6 text-ink">
              {advice}
            </motion.p>
          )}
          {!adviceLoading && adviceTried && adviceError && (
            <p className="text-xs text-rose-500">{adviceError}</p>
          )}
          {!adviceLoading && adviceTried && !advice && !adviceError && (
            <p className="text-xs text-soft">Chưa tạo được lời khuyên lúc này.</p>
          )}
          {!adviceLoading && !adviceTried && (
            <p className="text-xs text-soft/70">AI phân tích khung 50/30/20, nợ và tiết kiệm của bạn rồi đưa ra lời khuyên cụ thể.</p>
          )}
        </>
      )}
    </div>
  );
};

export default AISummaryCard;
