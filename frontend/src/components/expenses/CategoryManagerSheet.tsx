import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X, Plus, Pencil, Trash2, Lock, ChevronLeft } from 'lucide-react';
import expenseApi, { type IExpenseCategory, type CategoryBucket } from '../../api/expenseApi';
import CategoryIcon from './CategoryIcon';
import { useUI } from '../../context/UIContext';

interface CategoryManagerSheetProps {
  categories: IExpenseCategory[];
  onClose: () => void;
  onSaved: () => void;
}

const ICONS = [
  'utensils', 'gamepad-2', 'heart', 'shopping-bag', 'car', 'stethoscope',
  'home', 'piggy-bank', 'coffee', 'plane', 'gift', 'music', 'book',
  'dumbbell', 'wallet', 'calendar-check', 'heart-handshake', 'circle-ellipsis',
];
const COLORS = ['rose', 'pink', 'orange', 'amber', 'teal', 'green', 'blue', 'purple', 'slate'];
const COLOR_DOT: Record<string, string> = {
  rose: 'bg-rose-400', pink: 'bg-pink-400', orange: 'bg-orange-400', amber: 'bg-amber-400',
  teal: 'bg-teal-400', green: 'bg-green-400', blue: 'bg-blue-400', purple: 'bg-purple-400', slate: 'bg-slate-400',
};

const BUCKETS: { id: CategoryBucket; label: string; emoji: string }[] = [
  { id: 'needs', label: 'Thiết yếu', emoji: '🏠' },
  { id: 'wants', label: 'Mong muốn', emoji: '🎉' },
  { id: 'savings', label: 'Tiết kiệm', emoji: '🐷' },
];
const BUCKET_LABEL: Record<CategoryBucket, string> = {
  needs: 'Thiết yếu', wants: 'Mong muốn', savings: 'Tiết kiệm',
};

// null = danh sách; 'new' = tạo mới; object = sửa danh mục tự tạo
type Mode = null | 'new' | IExpenseCategory;

const CategoryManagerSheet: React.FC<CategoryManagerSheetProps> = ({ categories, onClose, onSaved }) => {
  const { toast, confirm } = useUI();
  const [mode, setMode] = useState<Mode>(null);

  const editing = mode && mode !== 'new' ? mode : null;
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('utensils');
  const [color, setColor] = useState('rose');
  const [bucket, setBucket] = useState<CategoryBucket>('needs');
  const [submitting, setSubmitting] = useState(false);

  const openNew = () => {
    setName(''); setIcon('utensils'); setColor('rose'); setBucket('needs');
    setMode('new');
  };
  const openEdit = (cat: IExpenseCategory) => {
    setName(cat.name); setIcon(cat.icon); setColor(cat.color); setBucket(cat.bucket);
    setMode(cat);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast('Nhập tên danh mục nhé.', 'error');
    setSubmitting(true);
    try {
      if (editing) {
        await expenseApi.updateCategory(editing._id, { name: name.trim(), icon, color, bucket });
        toast('Đã cập nhật danh mục.', 'success');
      } else {
        await expenseApi.createCategory({ name: name.trim(), icon, color, bucket });
        toast('Đã thêm danh mục.', 'success');
      }
      onSaved();
      setMode(null);
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa lưu được.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: IExpenseCategory) => {
    const ok = await confirm(`Xoá danh mục "${cat.name}"?`);
    if (!ok) return;
    try {
      await expenseApi.deleteCategory(cat._id);
      toast('Đã xoá danh mục.', 'success');
      onSaved();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa xoá được.', 'error');
    }
  };

  return (
    <AnimatePresence>
      <div className="sheet-shell">
        <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div
          className="sheet-panel max-h-[90dvh] overflow-y-auto"
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {mode !== null && (
                <button type="button" onClick={() => setMode(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
                  <ChevronLeft size={16} />
                </button>
              )}
              <h2 className="text-lg font-bold text-ink">
                {mode === null ? 'Quản lý danh mục' : editing ? 'Sửa danh mục' : 'Thêm danh mục'}
              </h2>
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
              <X size={16} />
            </button>
          </div>

          {/* Danh sách */}
          {mode === null && (
            <div className="flex flex-col gap-2">
              {categories.map((cat) => (
                <div key={cat._id} className="flex items-center gap-3 rounded-[1rem] bg-[#faf5f8] px-3 py-2.5">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full ${COLOR_DOT[cat.color] ?? COLOR_DOT.slate} text-white`}>
                    <CategoryIcon name={cat.icon} size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{cat.name}</p>
                    <p className="text-[11px] text-soft">{BUCKET_LABEL[cat.bucket] ?? BUCKET_LABEL.needs}</p>
                  </div>
                  {cat.isDefault ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-soft/50">
                      <Lock size={11} /> Mặc định
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => openEdit(cat)} className="flex h-8 w-8 items-center justify-center rounded-full text-soft transition hover:bg-black/5 hover:text-primary">
                        <Pencil size={14} />
                      </button>
                      <button type="button" onClick={() => handleDelete(cat)} className="flex h-8 w-8 items-center justify-center rounded-full text-soft transition hover:bg-rose-50 hover:text-rose-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button type="button" onClick={openNew} className="btn-primary mt-2 flex w-full items-center justify-center gap-1.5">
                <Plus size={16} /> Thêm danh mục
              </button>
              <p className="mt-1 text-center text-[11px] text-soft/60">Danh mục mặc định không sửa/xoá được; nhóm 50/30/20 cố định.</p>
            </div>
          )}

          {/* Form thêm / sửa */}
          {mode !== null && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="section-label">Tên danh mục</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Cà phê, Học phí" className="form-input" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="section-label">Nhóm 50/30/20</label>
                <div className="grid grid-cols-3 gap-2">
                  {BUCKETS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBucket(b.id)}
                      className={`rounded-[1rem] px-2 py-2 text-xs font-bold ring-1 transition ${bucket === b.id ? 'bg-primary/10 text-primary ring-primary/40' : 'bg-[#faf5f8] text-soft ring-transparent'}`}
                    >
                      {b.emoji} {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="section-label">Màu</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full ${COLOR_DOT[c]} ring-2 transition ${color === c ? 'ring-ink/40' : 'ring-transparent'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="section-label">Biểu tượng</label>
                <div className="grid grid-cols-6 gap-2">
                  {ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`flex h-10 items-center justify-center rounded-[0.9rem] ring-1 transition ${icon === ic ? 'bg-primary/10 text-primary ring-primary/40' : 'bg-[#faf5f8] text-soft ring-transparent'}`}
                    >
                      <CategoryIcon name={ic} size={18} />
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={submitting} className="btn-primary mt-2 w-full">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : (editing ? 'Cập nhật' : 'Thêm danh mục')}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CategoryManagerSheet;
