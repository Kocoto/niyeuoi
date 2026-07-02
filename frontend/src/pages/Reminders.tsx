import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ImageDown, Loader2 } from 'lucide-react';
import reminderApi, { type IReminder } from '../api/reminderApi';
import ReminderCard from '../components/reminders/ReminderCard';
import ReminderForm from '../components/reminders/ReminderForm';
import ScheduleImportSheet from '../components/reminders/ScheduleImportSheet';
import PushEnableBanner from '../components/reminders/PushEnableBanner';
import { syncLocalReminders } from '../utils/localReminders';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import type { Role } from '../constants/roles';

const Reminders: React.FC = () => {
  const { role } = useAuth();
  const { toast, confirm } = useUI();
  const [reminders, setReminders] = useState<IReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<IReminder | null>(null);
  const [showImport, setShowImport] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reminderApi.getReminders();
      const data = res.data.data ?? [];
      setReminders(data);
      syncLocalReminders(data, role as Role).catch(() => {});
    } catch {
      toast('Chưa tải được nhắc nhở.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast, role]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (r: IReminder) => { setEditing(r); setShowForm(true); };

  const toggle = async (r: IReminder) => {
    try {
      await reminderApi.updateReminder(r._id, { isActive: !r.isActive });
      setReminders((cur) => cur.map((x) => x._id === r._id ? { ...x, isActive: !x.isActive } : x));
    } catch { toast('Chưa đổi được.', 'error'); }
  };

  const remove = async (r: IReminder) => {
    const ok = await confirm(`Xoá nhắc "${r.title}"?`);
    if (!ok) return;
    try {
      await reminderApi.deleteReminder(r._id);
      fetchAll();
    } catch { toast('Chưa xoá được.', 'error'); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nhắc nhở</h1>
          <p className="page-subtitle">Nhắc đi học, ăn uống… cho hai bạn</p>
        </div>
        <button type="button" onClick={openAdd} className="btn-add" aria-label="Thêm nhắc nhở">
          <Plus size={20} />
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <PushEnableBanner />
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 self-start rounded-[1rem] bg-primary/5 px-3 py-2 text-xs font-bold text-primary ring-1 ring-primary/10 transition hover:bg-primary/10"
        >
          <ImageDown size={14} /> Nhập lịch từ ảnh (TKB / lịch làm)
        </button>
      </div>

      <div className="surface-card p-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-soft" /></div>
        ) : reminders.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-soft/70">Chưa có nhắc nhở nào. Bấm + để thêm, hoặc nhập từ ảnh lịch.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {reminders.map((r) => (
              <ReminderCard
                key={r._id}
                reminder={r}
                onEdit={() => openEdit(r)}
                onDelete={() => remove(r)}
                onToggle={() => toggle(r)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ReminderForm editing={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={fetchAll} />
      )}
      {showImport && (
        <ScheduleImportSheet onClose={() => setShowImport(false)} onSaved={fetchAll} />
      )}
    </div>
  );
};

export default Reminders;
