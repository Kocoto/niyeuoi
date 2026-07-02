import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Target, Loader2, X } from 'lucide-react';
import calorieApi, { type ICalorieEntry, type CalorieDailySummary, type CalorieTrendPoint } from '../api/calorieApi';
import RolePicker from '../components/calories/RolePicker';
import CalorieRing from '../components/calories/CalorieRing';
import MealList from '../components/calories/MealList';
import MealEntryForm from '../components/calories/MealEntryForm';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { ROLE_NAME, type Role } from '../constants/roles';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function shift(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}
function dateLabel(dateStr: string): string {
  if (dateStr === todayStr()) return 'Hôm nay';
  if (dateStr === shift(todayStr(), -1)) return 'Hôm qua';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const Calories: React.FC = () => {
  const { role } = useAuth();
  const { toast, confirm } = useUI();
  const [owner, setOwner] = useState<Role>(role as Role);
  const [date, setDate] = useState(todayStr());

  const [entries, setEntries] = useState<ICalorieEntry[]>([]);
  const [summary, setSummary] = useState<CalorieDailySummary | null>(null);
  const [trend, setTrend] = useState<CalorieTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [goalInput, setGoalInput] = useState<number | ''>('');
  const [savingGoal, setSavingGoal] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesRes, summaryRes, trendRes] = await Promise.all([
        calorieApi.getEntries(owner, date),
        calorieApi.getSummary(owner, date),
        calorieApi.getTrend(owner, date),
      ]);
      setEntries(entriesRes.data.data ?? []);
      setSummary(summaryRes.data.data);
      setTrend(trendRes.data.data ?? []);
    } catch {
      toast('Chưa tải được dữ liệu calo.', 'error');
    } finally {
      setLoading(false);
    }
  }, [owner, date, toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (entry: ICalorieEntry) => {
    const ok = await confirm(`Xoá "${entry.name}"?`);
    if (!ok) return;
    try {
      await calorieApi.deleteEntry(entry._id);
      fetchAll();
    } catch { toast('Chưa xoá được.', 'error'); }
  };

  const openGoal = () => {
    setGoalInput(summary?.target || '');
    setShowGoal(true);
  };
  const saveGoal = async () => {
    if (!goalInput || Number(goalInput) <= 0) return toast('Nhập mục tiêu hợp lệ nhé.', 'error');
    setSavingGoal(true);
    try {
      await calorieApi.upsertGoal(owner, Number(goalInput));
      toast('Đã đặt mục tiêu calo.', 'success');
      setShowGoal(false);
      fetchAll();
    } catch { toast('Chưa lưu được mục tiêu.', 'error'); } finally { setSavingGoal(false); }
  };

  const maxTrend = Math.max(1, ...trend.map((t) => t.total));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calo</h1>
          <p className="page-subtitle">Theo dõi dinh dưỡng của hai bạn</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn-add" aria-label="Thêm bữa ăn">
          <Plus size={20} />
        </button>
      </div>

      {/* Chọn xem calo của ai */}
      <div className="mb-4">
        <RolePicker value={owner} onChange={setOwner} />
      </div>

      {/* Chọn ngày */}
      <div className="mb-6 flex items-center justify-center gap-4">
        <button type="button" onClick={() => setDate((d) => shift(d, -1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 transition hover:bg-black/10">
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[8rem] text-center text-sm font-bold text-ink">{dateLabel(date)}</span>
        <button
          type="button"
          onClick={() => setDate((d) => (d >= todayStr() ? d : shift(d, 1)))}
          disabled={date >= todayStr()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 transition hover:bg-black/10 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {/* Vòng calo + macros */}
        <div className="surface-card flex flex-col items-center gap-4 p-6">
          <CalorieRing consumed={summary?.consumed ?? 0} target={summary?.target ?? 0} percentage={summary?.percentage ?? 0} />
          <div className="grid w-full grid-cols-3 divide-x divide-black/5">
            <div className="flex flex-col items-center gap-0.5 px-2">
              <span className="text-[11px] font-semibold text-soft">Đạm</span>
              <span className="text-sm font-bold text-ink">{summary?.protein ?? 0}g</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 px-2">
              <span className="text-[11px] font-semibold text-soft">Tinh bột</span>
              <span className="text-sm font-bold text-ink">{summary?.carbs ?? 0}g</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 px-2">
              <span className="text-[11px] font-semibold text-soft">Béo</span>
              <span className="text-sm font-bold text-ink">{summary?.fat ?? 0}g</span>
            </div>
          </div>
          <button type="button" onClick={openGoal} className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
            <Target size={13} /> {summary?.hasGoal ? `Mục tiêu: ${summary.target.toLocaleString('vi-VN')} kcal — chỉnh` : `Đặt mục tiêu calo cho ${ROLE_NAME[owner]}`}
          </button>
        </div>

        {/* Xu hướng 7 ngày */}
        {trend.length > 0 && (
          <div className="surface-card p-5">
            <p className="section-label mb-4">7 ngày gần đây</p>
            <div className="flex items-end justify-between gap-1.5" style={{ height: 96 }}>
              {trend.map((t) => (
                <div key={t.date} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 items-end">
                    <motion.div
                      className={`w-full rounded-t-md ${t.date === date ? 'bg-primary' : 'bg-primary/30'}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${(t.total / maxTrend) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-[9px] text-soft">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Danh sách bữa ăn */}
        <div className="surface-card p-5">
          <p className="section-label mb-3">Bữa ăn</p>
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-soft" /></div>
          ) : (
            <MealList entries={entries} onDelete={handleDelete} />
          )}
        </div>
      </div>

      {showForm && (
        <MealEntryForm owner={owner} date={date} onClose={() => setShowForm(false)} onSaved={fetchAll} />
      )}

      {/* Sheet đặt mục tiêu */}
      <AnimatePresence>
        {showGoal && (
          <div className="sheet-shell">
            <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGoal(false)} />
            <motion.div className="sheet-panel" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">Mục tiêu calo — {ROLE_NAME[owner]}</h2>
                <button type="button" onClick={() => setShowGoal(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="section-label">Calo mỗi ngày (kcal)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="VD: 2000"
                  className="form-input"
                />
                <p className="text-[11px] text-soft/70">Tham khảo: nữ ~1800–2000, nam ~2200–2500 kcal/ngày.</p>
              </div>
              <button type="button" onClick={saveGoal} disabled={savingGoal} className="btn-primary mt-4 w-full">
                {savingGoal ? <Loader2 size={16} className="animate-spin" /> : 'Lưu mục tiêu'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calories;
