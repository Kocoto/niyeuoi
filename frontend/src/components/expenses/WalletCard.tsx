import React from 'react';
import type { IWallet } from '../../api/expenseApi';
import CategoryIcon from './CategoryIcon';
import { formatVND, formatVNDCompact } from '../../utils/currency';

interface WalletCardProps {
  wallet: IWallet;
  selected?: boolean;
  onClick?: () => void;
}

const COLOR_BG: Record<string, string> = {
  rose: 'bg-rose-50 ring-rose-200/80',
  pink: 'bg-pink-50 ring-pink-200/80',
  blue: 'bg-sky-50 ring-sky-200/80',
  teal: 'bg-teal-50 ring-teal-200/80',
  amber: 'bg-amber-50 ring-amber-200/80',
};

const COLOR_ICON: Record<string, string> = {
  rose: 'text-rose-500 bg-rose-100',
  pink: 'text-pink-500 bg-pink-100',
  blue: 'text-sky-500 bg-sky-100',
  teal: 'text-teal-500 bg-teal-100',
  amber: 'text-amber-500 bg-amber-100',
};

const COLOR_TEXT: Record<string, string> = {
  rose: 'text-rose-700',
  pink: 'text-pink-700',
  blue: 'text-sky-700',
  teal: 'text-teal-700',
  amber: 'text-amber-700',
};

const WalletCard: React.FC<WalletCardProps> = ({ wallet, selected, onClick }) => {
  const bg = COLOR_BG[wallet.color] ?? COLOR_BG.rose;
  const iconCls = COLOR_ICON[wallet.color] ?? COLOR_ICON.rose;
  const textCls = COLOR_TEXT[wallet.color] ?? COLOR_TEXT.rose;
  const isNeg = wallet.balance < 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col gap-3 rounded-[1.5rem] p-4 ring-1 transition active:scale-[0.98] ${bg} ${selected ? 'ring-2 ring-offset-1' : ''} ${onClick ? 'cursor-pointer hover:brightness-[0.97]' : 'cursor-default'}`}
    >
      <div className="flex items-center justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ${iconCls}`}>
          <CategoryIcon name={wallet.icon} size={18} />
        </span>
        {wallet.owner === 'shared' && (
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-soft ring-1 ring-black/5">Chung</span>
        )}
      </div>
      <div className="text-left">
        <p className="text-xs font-semibold text-soft">{wallet.name}</p>
        <p className={`mt-0.5 text-lg font-bold ${isNeg ? 'text-rose-600' : textCls}`}>
          {formatVNDCompact(Math.abs(wallet.balance))}
          {isNeg && <span className="ml-0.5 text-rose-400">−</span>}
        </p>
        <p className="mt-0.5 text-[10px] text-soft/60">{formatVND(wallet.balance)}</p>
      </div>
    </button>
  );
};

export default WalletCard;
