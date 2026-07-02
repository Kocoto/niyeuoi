import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, Sparkles, Camera } from 'lucide-react';
import calorieApi, { type MealType } from '../../api/calorieApi';
import type { Role } from '../../constants/roles';
import { useUI } from '../../context/UIContext';

interface MealEntryFormProps {
  owner: Role;
  date: string;
  onClose: () => void;
  onSaved: () => void;
}

const MEALS: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: '🌅 Sáng' },
  { id: 'lunch', label: '☀️ Trưa' },
  { id: 'dinner', label: '🌙 Tối' },
  { id: 'snack', label: '🍪 Vặt' },
];

const MealEntryForm: React.FC<MealEntryFormProps> = ({ owner, date, onClose, onSaved }) => {
  const { toast } = useUI();
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [desc, setDesc] = useState('');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [estimating, setEstimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const applyEstimate = (d: { name: string; calories: number; protein: number; carbs: number; fat: number; imageUrl?: string }) => {
    if (d.name) setName(d.name);
    if (d.calories) setCalories(d.calories);
    setProtein(d.protein || '');
    setCarbs(d.carbs || '');
    setFat(d.fat || '');
    if (d.imageUrl) setImageUrl(d.imageUrl);
    toast('AI đã ước tính — kiểm tra lại nhé.', 'success');
  };

  const handleEstimateText = async () => {
    if (!desc.trim()) return toast('Mô tả món ăn trước nhé.', 'error');
    setEstimating(true);
    try {
      const res = await calorieApi.estimateFromText(desc.trim());
      applyEstimate(res.data.data);
    } catch {
      toast('AI chưa ước tính được, nhập tay nhé.', 'error');
    } finally {
      setEstimating(false);
    }
  };

  const handleEstimateImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEstimating(true);
    try {
      const res = await calorieApi.estimateFromImage(file);
      applyEstimate(res.data.data);
    } catch {
      toast('Không đọc được ảnh, nhập tay nhé.', 'error');
    } finally {
      setEstimating(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast('Nhập tên món nhé.', 'error');
    if (!calories || Number(calories) <= 0) return toast('Nhập lượng calo nhé.', 'error');
    setSubmitting(true);
    try {
      await calorieApi.createEntry({
        owner,
        date,
        mealType,
        name: name.trim(),
        calories: Number(calories),
        protein: protein === '' ? undefined : Number(protein),
        carbs: carbs === '' ? undefined : Number(carbs),
        fat: fat === '' ? undefined : Number(fat),
        note: note.trim() || undefined,
        imageUrl,
      } as any);
      toast('Đã ghi bữa ăn!', 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa ghi được.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const numField = (label: string, value: number | '', set: (v: number | '') => void, placeholder = '') => (
    <div className="flex flex-col gap-1">
      <label className="section-label">{label}</label>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(ev) => set(ev.target.value === '' ? '' : Number(ev.target.value))}
        placeholder={placeholder}
        className="form-input"
      />
    </div>
  );

  return (
    <AnimatePresence>
      <div className="sheet-shell">
        <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div
          className="sheet-panel max-h-[92dvh] overflow-y-auto"
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Ghi bữa ăn</h2>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
              <X size={16} />
            </button>
          </div>

          {/* Meal type */}
          <div className="mb-4 grid grid-cols-4 gap-2">
            {MEALS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMealType(m.id)}
                className={`rounded-[1rem] px-2 py-2 text-xs font-bold ring-1 transition ${mealType === m.id ? 'bg-primary/10 text-primary ring-primary/40' : 'bg-[#faf5f8] text-soft ring-transparent'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* AI estimate */}
          <div className="mb-4 flex flex-col gap-2 rounded-[1.25rem] bg-[#faf5f8] p-3">
            <label className="section-label">Ước tính bằng AI</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="Mô tả món ăn (VD: 1 tô phở bò tái, 1 ly trà sữa)..."
              className="form-input w-full resize-none text-sm"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleEstimateText} disabled={estimating} className="btn-primary flex-1 disabled:opacity-50">
                {estimating ? <Loader2 size={15} className="animate-spin" /> : <><Sparkles size={15} /> AI ước tính</>}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={estimating}
                className="flex h-11 w-12 items-center justify-center rounded-full bg-white text-primary ring-1 ring-primary/20 transition hover:bg-primary/5 disabled:opacity-50"
                title="Chụp / chọn ảnh món ăn"
              >
                <Camera size={18} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleEstimateImage} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {imageUrl && (
              <img src={imageUrl} alt="Món ăn" className="h-24 w-full rounded-[1rem] object-cover" />
            )}
            <div className="flex flex-col gap-1">
              <label className="section-label">Tên món</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Phở bò" className="form-input" />
            </div>
            {numField('Calo (kcal)', calories, setCalories, '0')}
            <div className="grid grid-cols-3 gap-2">
              {numField('Đạm (g)', protein, setProtein)}
              {numField('Tinh bột (g)', carbs, setCarbs)}
              {numField('Béo (g)', fat, setFat)}
            </div>
            <div className="flex flex-col gap-1">
              <label className="section-label">Ghi chú (tuỳ chọn)</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="form-input" />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary mt-1 w-full">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Lưu bữa ăn'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MealEntryForm;
