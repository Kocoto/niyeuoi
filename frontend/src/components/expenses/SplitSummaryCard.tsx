import React from 'react';
import type { SplitSummary } from '../../api/expenseApi';
import { formatVND, formatVNDCompact } from '../../utils/currency';
import { ROLE_NAME } from '../../constants/roles';

interface SplitSummaryCardProps {
  data: SplitSummary;
  onBalance?: () => void;
}

const SplitSummaryCard: React.FC<SplitSummaryCardProps> = ({ data, onBalance }) => {
  const { boyfriendPaid, girlfriendPaid, balance } = data;

  const whoOwes = balance > 0
    ? `${ROLE_NAME.boyfriend} trả thêm ${formatVNDCompact(Math.abs(balance))} để cân bằng`
    : balance < 0
    ? `${ROLE_NAME.girlfriend} trả thêm ${formatVNDCompact(Math.abs(balance))} để cân bằng`
    : 'Hai bạn đã cân bằng';

  const total = boyfriendPaid + girlfriendPaid;
  const bfPct = total > 0 ? (boyfriendPaid / total) * 100 : 50;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between">
        <div className="text-center">
          <p className="text-[11px] text-soft">{ROLE_NAME.boyfriend} đã trả</p>
          <p className="text-base font-bold text-sky-600">{formatVND(boyfriendPaid)}</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-soft">{ROLE_NAME.girlfriend} đã trả</p>
          <p className="text-base font-bold text-pink-600">{formatVND(girlfriendPaid)}</p>
        </div>
      </div>
      {total > 0 && (
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/5">
          <div
            className="h-full rounded-full bg-sky-400 transition-all duration-700"
            style={{ width: `${bfPct}%` }}
          />
        </div>
      )}
      <p className="text-center text-xs text-soft">{whoOwes}</p>
      {balance !== 0 && onBalance && (
        <button
          type="button"
          onClick={onBalance}
          className="mt-1 w-full rounded-full bg-primary/10 py-2 text-xs font-bold text-primary transition hover:bg-primary/20"
        >
          Cân bằng ngay
        </button>
      )}
    </div>
  );
};

export default SplitSummaryCard;
