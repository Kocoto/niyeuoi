import React from 'react';
import { ArrowLeftRight, Trash2 } from 'lucide-react';
import type { ITransaction, IWallet, IExpenseCategory } from '../../api/expenseApi';
import CategoryIcon from './CategoryIcon';
import PersonBadge from '../PersonBadge';
import { formatVND } from '../../utils/currency';
import type { Role } from '../../constants/roles';

interface TransactionItemProps {
  tx: ITransaction;
  onEdit?: () => void;
  onDelete?: () => void;
}

function getCategory(tx: ITransaction): IExpenseCategory | null {
  if (tx.categoryId && typeof tx.categoryId === 'object') return tx.categoryId as IExpenseCategory;
  return null;
}

function getWalletName(w: IWallet | string | undefined): string {
  if (!w) return '';
  if (typeof w === 'object') return (w as IWallet).name;
  return '';
}

const TransactionItem: React.FC<TransactionItemProps> = ({ tx, onEdit, onDelete }) => {
  const cat = getCategory(tx);
  const isExpense = tx.type === 'expense';
  const isIncome = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';

  const amountColor = isExpense ? 'text-rose-600' : isIncome ? 'text-green-600' : 'text-sky-600';
  const amountSign = isExpense ? '−' : isIncome ? '+' : '↔';

  const iconBg = cat
    ? { rose: 'bg-rose-100 text-rose-500', pink: 'bg-pink-100 text-pink-500', orange: 'bg-orange-100 text-orange-500', amber: 'bg-amber-100 text-amber-500', teal: 'bg-teal-100 text-teal-500', green: 'bg-green-100 text-green-500', blue: 'bg-blue-100 text-blue-500', purple: 'bg-purple-100 text-purple-500', slate: 'bg-slate-100 text-slate-500' }[cat.color] ?? 'bg-slate-100 text-slate-500'
    : 'bg-sky-100 text-sky-500';

  const dateStr = new Date(tx.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  const walletName = getWalletName(tx.walletId as IWallet | string);

  return (
    <div className="flex items-center gap-3 rounded-[1.25rem] px-4 py-3 transition hover:bg-black/[0.02]">
      <button
        type="button"
        onClick={onEdit}
        disabled={!onEdit}
        className={`flex min-w-0 flex-1 items-center gap-3 text-left ${onEdit ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          {isTransfer ? <ArrowLeftRight size={16} /> : <CategoryIcon name={cat?.icon ?? 'circle-ellipsis'} size={16} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{tx.note || (cat?.name ?? (isTransfer ? 'Chuyển khoản' : 'Giao dịch'))}</p>
          <div className="mt-0.5 flex items-center gap-2">
            {walletName && <span className="text-[11px] text-soft">{walletName}</span>}
            {tx.isRecurring && <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-500">Định kỳ</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`text-sm font-bold ${amountColor}`}>{amountSign}{formatVND(tx.amount)}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-soft/60">{dateStr}</span>
            <PersonBadge role={tx.createdBy as Role} showIcon={false} className="scale-75 origin-right" />
          </div>
        </div>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-soft/40 transition hover:bg-rose-50 hover:text-rose-500"
          aria-label="Xoá giao dịch"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

export default TransactionItem;
