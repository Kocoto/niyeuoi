import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, Camera, Sparkles } from 'lucide-react';
import reminderApi, { type ReminderOwner, type ScheduleReminderDraft } from '../../api/reminderApi';
import { describeRepeat } from './presets';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { ROLE_NAME, type Role } from '../../constants/roles';

interface ScheduleImportSheetProps {
  onClose: () => void;
  onSaved: () => void;
}

type Draft = ScheduleReminderDraft & { _include: boolean };

const ScheduleImportSheet: React.FC<ScheduleImportSheetProps> = ({ onClose, onSaved }) => {
  const { role } = useAuth();
  const { toast } = useUI();
  const otherRole: Role = role === 'boyfriend' ? 'girlfriend' : 'boyfriend';
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [owner, setOwner] = useState<ReminderOwner>(role as Role);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await reminderApi.importFromImage(file);
      const list = (res.data.data ?? []).map((d) => ({ ...d, _include: true }));
      if (list.length === 0) toast('Không đọc được lịch, thử ảnh rõ hơn nhé.', 'error');
      setDrafts(list);
    } catch {
      toast('Không đọc được ảnh, thử lại nhé.', 'error');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    const chosen = (drafts ?? []).filter((d) => d._include);
    if (chosen.length === 0) return toast('Chọn ít nhất 1 nhắc nhé.', 'error');
    setSaving(true);
    try {
      await reminderApi.bulkCreate(chosen.map(({ _include, ...d }) => ({ ...d, owner } as any)));
      toast(`Đã thêm ${chosen.length} nhắc nhở.`, 'success');
      onSaved();
      onClose();
    } catch {
      toast('Chưa lưu được.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const OWNERS: { id: ReminderOwner; label: string }[] = [
    { id: role as Role, label: `Tôi` },
    { id: otherRole, label: ROLE_NAME[otherRole] },
    { id: 'both', label: 'Cả hai' },
  ];

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
            <h2 className="text-lg font-bold text-ink">Nhập lịch từ ảnh</h2>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
              <X size={16} />
            </button>
          </div>

          {!drafts && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-soft">Chụp/chọn ảnh <b>thời khoá biểu</b> hoặc <b>lịch làm việc</b> — AI sẽ đọc và đề xuất nhắc nhở.</p>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={importing} className="btn-primary disabled:opacity-60">
                {importing ? <><Loader2 size={16} className="animate-spin" /> Đang đọc...</> : <><Camera size={16} /> Chọn ảnh lịch</>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
            </div>
          )}

          {drafts && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="section-label">Nhắc cho</label>
                <div className="grid grid-cols-3 gap-2">
                  {OWNERS.map((o) => (
                    <button key={o.id} type="button" onClick={() => setOwner(o.id)}
                      className={`rounded-[1rem] px-2 py-2 text-xs font-bold ring-1 transition ${owner === o.id ? 'bg-primary/10 text-primary ring-primary/40' : 'bg-[#faf5f8] text-soft ring-transparent'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {drafts.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDrafts((cur) => cur!.map((x, j) => j === i ? { ...x, _include: !x._include } : x))}
                    className={`flex items-center gap-3 rounded-[1rem] px-3 py-2.5 text-left ring-1 transition ${d._include ? 'bg-primary/5 ring-primary/30' : 'bg-[#faf5f8] ring-transparent opacity-50'}`}
                  >
                    <span className="text-lg">{d.emoji || '⏰'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{d.title} {d.critical && '🔔'}</p>
                      <p className="truncate text-[11px] text-soft"><b className="text-ink/70">{d.time}</b> · {describeRepeat(d.daysOfWeek ?? [], d.date)}</p>
                    </div>
                    <span className={`h-5 w-5 shrink-0 rounded-md ring-1 ${d._include ? 'bg-primary ring-primary' : 'bg-white ring-black/20'}`} />
                  </button>
                ))}
              </div>

              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary w-full">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={16} /> Lưu {drafts.filter((d) => d._include).length} nhắc</>}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ScheduleImportSheet;
