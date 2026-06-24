import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import expenseApi, { type SummaryData } from '../../api/expenseApi';
import { formatVND } from '../../utils/currency';

const ExpenseHomeWidget: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [totalAssets, setTotalAssets] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const now = new Date();
    Promise.all([
      expenseApi.getSummary(now.getMonth() + 1, now.getFullYear()),
      expenseApi.getWallets(),
    ])
      .then(([summaryRes, walletsRes]) => {
        if (!mounted) return;
        setSummary(summaryRes.data.data);
        setTotalAssets((walletsRes.data.data ?? []).reduce((s, w) => s + w.balance, 0));
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <Link
      to="/expenses"
      className="card-hover block rounded-[1.35rem] bg-gradient-to-br from-rose-50 via-white to-sky-50 p-5 ring-1 ring-rose-100"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
            <Wallet size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Chi tiêu tháng này</p>
            <p className="text-[11px] text-soft">{loading ? 'Đang xem...' : `Tổng tài sản ${formatVND(totalAssets ?? 0)}`}</p>
          </div>
        </div>
        <ArrowRight size={16} className="text-primary" />
      </div>

      {summary && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-[1rem] bg-white/70 px-3 py-2">
            <ArrowUpRight size={15} className="text-green-500" />
            <div>
              <p className="text-[10px] text-soft">Thu</p>
              <p className="text-sm font-bold text-green-600">{formatVND(summary.totalIncome)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-[1rem] bg-white/70 px-3 py-2">
            <ArrowDownRight size={15} className="text-rose-500" />
            <div>
              <p className="text-[10px] text-soft">Chi</p>
              <p className="text-sm font-bold text-rose-600">{formatVND(summary.totalExpense)}</p>
            </div>
          </div>
        </div>
      )}
    </Link>
  );
};

export default ExpenseHomeWidget;
