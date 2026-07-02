import React from 'react';
import { Trash2 } from 'lucide-react';
import type { ICalorieEntry, MealType } from '../../api/calorieApi';

interface MealListProps {
  entries: ICalorieEntry[];
  onDelete: (entry: ICalorieEntry) => void;
}

const MEAL_META: Record<MealType, { label: string; emoji: string }> = {
  breakfast: { label: 'Bữa sáng', emoji: '🌅' },
  lunch: { label: 'Bữa trưa', emoji: '☀️' },
  dinner: { label: 'Bữa tối', emoji: '🌙' },
  snack: { label: 'Ăn vặt', emoji: '🍪' },
};

const ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MealList: React.FC<MealListProps> = ({ entries, onDelete }) => {
  if (entries.length === 0) {
    return <p className="px-5 py-4 text-xs text-soft/70">Chưa ghi bữa nào cho ngày này.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {ORDER.map((meal) => {
        const items = entries.filter((e) => e.mealType === meal);
        if (items.length === 0) return null;
        const total = items.reduce((s, e) => s + (e.calories || 0), 0);
        return (
          <div key={meal}>
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="text-xs font-bold text-soft">{MEAL_META[meal].emoji} {MEAL_META[meal].label}</span>
              <span className="text-xs font-bold text-ink">{total.toLocaleString('vi-VN')} kcal</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {items.map((e) => (
                <div key={e._id} className="flex items-center gap-3 rounded-[1rem] bg-[#faf5f8] px-3 py-2.5">
                  {e.imageUrl
                    ? <img src={e.imageUrl} alt={e.name} className="h-10 w-10 rounded-lg object-cover" />
                    : <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-lg">{MEAL_META[meal].emoji}</span>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{e.name}</p>
                    <p className="truncate text-[11px] text-soft">
                      {e.calories.toLocaleString('vi-VN')} kcal
                      {(e.protein || e.carbs || e.fat)
                        ? ` · P${e.protein ?? 0} C${e.carbs ?? 0} F${e.fat ?? 0}`
                        : ''}
                      {e.note ? ` · ${e.note}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(e)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-soft transition hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MealList;
