import React from 'react';
import type { IExpenseCategory } from '../../api/expenseApi';
import CategoryIcon from './CategoryIcon';

interface CategoryChipProps {
  category: IExpenseCategory;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

const CategoryChip: React.FC<CategoryChipProps> = ({ category, selected, onClick, size = 'md' }) => {
  const colorMap: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-600 ring-rose-200',
    pink: 'bg-pink-50 text-pink-600 ring-pink-200',
    orange: 'bg-orange-50 text-orange-600 ring-orange-200',
    amber: 'bg-amber-50 text-amber-600 ring-amber-200',
    teal: 'bg-teal-50 text-teal-600 ring-teal-200',
    green: 'bg-green-50 text-green-600 ring-green-200',
    blue: 'bg-blue-50 text-blue-600 ring-blue-200',
    purple: 'bg-purple-50 text-purple-600 ring-purple-200',
    slate: 'bg-slate-50 text-slate-600 ring-slate-200',
  };

  const selectedColorMap: Record<string, string> = {
    rose: 'bg-rose-500 text-white ring-rose-400',
    pink: 'bg-pink-500 text-white ring-pink-400',
    orange: 'bg-orange-500 text-white ring-orange-400',
    amber: 'bg-amber-500 text-white ring-amber-400',
    teal: 'bg-teal-500 text-white ring-teal-400',
    green: 'bg-green-500 text-white ring-green-400',
    blue: 'bg-blue-500 text-white ring-blue-400',
    purple: 'bg-purple-500 text-white ring-purple-400',
    slate: 'bg-slate-500 text-white ring-slate-400',
  };

  const base = colorMap[category.color] ?? colorMap.slate;
  const active = selectedColorMap[category.color] ?? selectedColorMap.slate;
  const colorClass = selected ? active : base;
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-[11px] gap-1' : 'px-3 py-2 text-xs gap-1.5';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full font-bold ring-1 transition active:scale-95 ${sizeClass} ${colorClass} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <CategoryIcon name={category.icon} size={size === 'sm' ? 11 : 13} />
      <span>{category.name}</span>
    </button>
  );
};

export default CategoryChip;
