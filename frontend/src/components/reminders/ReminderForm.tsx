import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, Phone } from 'lucide-react';
import reminderApi, { type IReminder, type ReminderOwner } from '../../api/reminderApi';
import { REMINDER_PRESETS, WEEKDAY_LABELS, WEEKDAY_ORDER, type ReminderPreset } from './presets';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { ROLE_NAME, type Role } from '../../constants/roles';

interface ReminderFormProps {
  editing?: IReminder | null;
  onClose: () => void;
  onSaved: () => void;
}

const ReminderForm: React.FC<ReminderFormProps> = ({ editing, onClose, onSaved }) => {
  const { role } = useAuth();
  const { toast } = useUI();
  const otherRole: Role = role === 'boyfriend' ? 'girlfriend' : 'boyfriend';
  const isEditing = !!editing;

  const [emoji, setEmoji] = useState(editing?.emoji ?? '⏰');
  const [title, setTitle] = useState(editing?.title ?? '');
  const [time, setTime] = useState(editing?.time ?? '07:00');
  const [owner, setOwner] = useState<ReminderOwner>(editing?.owner ?? (role as Role));
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(editing?.daysOfWeek ?? []);
  const [critical, setCritical] = useState(editing?.critical ?? false);
  const [note, setNote] = useState(editing?.note ?? '');
  const [submitting, setSubmitting] = useState(false);

  const applyPreset = (p: ReminderPreset) => {
    setEmoji(p.emoji); setTitle(p.title); setTime(p.time);
    setDaysOfWeek(p.daysOfWeek); setCritical(!!p.critical);
  };

  const toggleDay = (d: number) =>
    setDaysOfWeek((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const OWNERS: { id: ReminderOwner; label: string }[] = [
    { id: role as Role, label: `Tôi (${ROLE_NAME[role as Role]})` },
    { id: otherRole, label: ROLE_NAME[otherRole] },
    { id: 'both', label: 'Cả hai' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast('Nhập tiêu đề nhắc nhé.', 'error');
    if (!/^\d{2}:\d{2}$/.test(time)) return toast('Chọn giờ hợp lệ nhé.', 'error');
    setSubmitting(true);
    try {
      const payload: Partial<IReminder> = {
        owner, title: title.trim(), emoji: emoji || undefined, time,
        daysOfWeek, critical, note: note.trim() || undefined,
      };
      if (isEditing) {
        await reminderApi.updateReminder(editing!._id, payload);
        toast('Đã cập nhật nhắc nhở.', 'success');
      } else {
        await reminderApi.createReminder(payload);
        toast('Đã tạo nhắc nhở.', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa lưu được.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
            <h2 className="text-lg font-bold text-ink">{isEditing ? 'Sửa nhắc nhở' : 'Nhắc nhở mới'}</h2>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
              <X size={16} />
            </button>
          </div>

          {!isEditing && (
            <div className="mb-4 flex flex-wrap gap-2">
              {REMINDER_PRESETS.map((p) => (
                <button key={p.title} type="button" onClick={() => applyPreset(p)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#faf5f8] px-3 py-1.5 text-xs font-bold text-soft ring-1 ring-black/5 transition hover:bg-primary/5">
                  {p.emoji} {p.title}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex gap-2">
              <input type="text" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={2}
                className="form-input w-16 text-center text-xl" aria-label="Emoji" />
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề (VD: Đi học)" className="form-input flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="section-label">Giờ</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="form-input" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="section-label">Nhắc cho</label>
                <select value={owner} onChange={(e) => setOwner(e.target.value as ReminderOwner)} className="form-input">
                  {OWNERS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="section-label">Lặp lại {daysOfWeek.length === 0 && <span className="text-soft/60">(hằng ngày)</span>}</label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_ORDER.map((d) => (
                  <button key={d} type="button" onClick={() => toggleDay(d)}
                    className={`h-9 w-9 rounded-full text-xs font-bold ring-1 transition ${daysOfWeek.includes(d) ? 'bg-primary/10 text-primary ring-primary/40' : 'bg-[#faf5f8] text-soft ring-transparent'}`}>
                    {WEEKDAY_LABELS[d]}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-soft/60">Không chọn thứ nào = nhắc hằng ngày.</p>
            </div>

            <button
              type="button"
              onClick={() => setCritical((c) => !c)}
              className={`flex items-center justify-between rounded-[1rem] px-4 py-3 ring-1 transition ${critical ? 'bg-rose-50 text-rose-600 ring-rose-200' : 'bg-[#faf5f8] text-soft ring-transparent'}`}
            >
              <span className="flex items-center gap-2 text-sm font-bold"><Phone size={15} /> Quan trọng (báo để gọi)</span>
              <span className={`relative h-6 w-11 rounded-full transition ${critical ? 'bg-rose-500' : 'bg-black/15'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${critical ? 'left-[1.375rem]' : 'left-0.5'}`} />
              </span>
            </button>
            <p className="-mt-2 text-[11px] text-soft/60">Ca quan trọng: máy Android của bạn sẽ báo kiểu báo thức + nút Gọi.</p>

            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú (tuỳ chọn)" className="form-input" />

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? 'Cập nhật' : 'Tạo nhắc nhở')}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReminderForm;
