import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';
import EmptyState from '../components/EmptyState';
import RolePill from '../components/RolePill';
import SheetDialog from '../components/SheetDialog';
import type { AppRole } from '../constants/appRoles';
import { } from '../constants/appRoles';
import { useAuth } from '../context/AuthContext';

type EventType = 'anniversary' | 'birthday' | 'date' | 'special';

interface IEvent {
  _id: string;
  title: string;
  date: string;
  description?: string;
  eventType: EventType;
  createdBy: AppRole;
  isRecurring: boolean;
}

const EVENT_TYPE_LABEL: Record<EventType, string> = {
  anniversary: 'Kỷ niệm',
  birthday: 'Sinh nhật',
  date: 'Hẹn hò',
  special: 'Đặc biệt',
};

const EVENT_TYPE_EMOJI: Record<EventType, string> = {
  anniversary: '💑',
  birthday: '🎂',
  date: '🌹',
  special: '✨',
};

const EVENT_TYPE_HINT: Record<EventType, string> = {
  anniversary: 'Ngày quen, ngày yêu, ngày đặc biệt của cả hai.',
  birthday: 'Sinh nhật của Ni hoặc Được.',
  date: 'Kế hoạch hẹn hò, buổi đi chơi.',
  special: 'Bất cứ ngày nào quan trọng với hai bạn.',
};

function getDaysLeft(dateStr: string, isRecurring: boolean): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  if (isRecurring) {
    // Find next occurrence this year or next
    const thisYear = new Date(now.getFullYear(), target.getMonth(), target.getDate());
    if (thisYear >= now) return Math.ceil((thisYear.getTime() - now.getTime()) / 86400000);
    const nextYear = new Date(now.getFullYear() + 1, target.getMonth(), target.getDate());
    return Math.ceil((nextYear.getTime() - now.getTime()) / 86400000);
  }

  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function getCountdownLabel(daysLeft: number, eventType: EventType, title: string): string {
  if (daysLeft === 0) return `Hôm nay là ${title}`;
  if (daysLeft === 1) return `Ngày mai là ${EVENT_TYPE_LABEL[eventType].toLowerCase()}`;
  if (daysLeft < 0) return `Đã qua ${Math.abs(daysLeft)} ngày`;
  if (daysLeft <= 7) return `Còn ${daysLeft} ngày`;
  if (daysLeft <= 30) return `Còn ${daysLeft} ngày`;
  return `Còn ${daysLeft} ngày`;
}

function getUrgencyStyle(daysLeft: number): string {
  if (daysLeft === 0) return 'bg-primary text-white shadow-lg shadow-rose-100';
  if (daysLeft < 0) return 'bg-gray-100 text-gray-400';
  if (daysLeft <= 7) return 'bg-amber-50 text-amber-600 border border-amber-100';
  return 'bg-rose-50 text-primary';
}

const EventsV2: React.FC = () => {
  const { role } = useAuth();
  const currentRole = role as AppRole;

  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<IEvent | null>(null);
  const [detailEvent, setDetailEvent] = useState<IEvent | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    title: '',
    date: '',
    description: '',
    eventType: 'special' as EventType,
    isRecurring: false,
  };
  const [form, setForm] = useState(emptyForm);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get('/events-v2');
      const sorted = (res.data.data ?? []).sort((a: IEvent, b: IEvent) => {
        const dA = getDaysLeft(a.date, a.isRecurring);
        const dB = getDaysLeft(b.date, b.isRecurring);
        // Upcoming first, then by closeness; past at end
        if (dA >= 0 && dB >= 0) return dA - dB;
        if (dA >= 0) return -1;
        if (dB >= 0) return 1;
        return dB - dA; // most recent past first
      });
      setEvents(sorted);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchEvents(); }, [fetchEvents]);

  const { upcoming, past } = useMemo(() => {
    const up: IEvent[] = [];
    const pa: IEvent[] = [];
    events.forEach(e => {
      const d = getDaysLeft(e.date, e.isRecurring);
      if (d >= 0) up.push(e);
      else pa.push(e);
    });
    return { upcoming: up, past: pa };
  }, [events]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditEvent(null);
    setShowCreate(true);
  };

  const openEdit = (ev: IEvent) => {
    setForm({
      title: ev.title,
      date: new Date(ev.date).toISOString().split('T')[0] ?? '',
      description: ev.description ?? '',
      eventType: ev.eventType,
      isRecurring: ev.isRecurring,
    });
    setEditEvent(ev);
    setShowCreate(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, createdBy: currentRole };
    try {
      if (editEvent) {
        await api.put(`/events-v2/${editEvent._id}`, payload);
      } else {
        await api.post('/events-v2', payload);
      }
      setShowCreate(false);
      setEditEvent(null);
      await fetchEvents();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ev: IEvent) => {
    await api.delete(`/events-v2/${ev._id}`);
    setDetailEvent(null);
    await fetchEvents();
  };

  const EventCard: React.FC<{ ev: IEvent }> = ({ ev }) => {
    const daysLeft = getDaysLeft(ev.date, ev.isRecurring);
    const urgency = getUrgencyStyle(daysLeft);
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => setDetailEvent(ev)}
        className="surface-card w-full text-left transition-shadow hover:shadow-md"
      >
        <div className="flex items-center gap-4">
          {/* Countdown badge */}
          <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl text-center font-bold ${urgency}`}>
            {daysLeft === 0 ? (
              <span className="text-xl">{EVENT_TYPE_EMOJI[ev.eventType]}</span>
            ) : (
              <>
                <span className="text-xl leading-none">{Math.abs(daysLeft)}</span>
                <span className="text-[9px] font-bold uppercase leading-tight">
                  {daysLeft > 0 ? 'ngày nữa' : 'ngày trước'}
                </span>
              </>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-bold text-ink">{ev.title}</p>
                <p className="mt-0.5 text-xs text-soft">
                  {new Date(ev.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  {ev.isRecurring ? ' · hằng năm' : ''}
                </p>
                <p className="mt-1 text-xs font-medium text-soft">{getCountdownLabel(daysLeft, ev.eventType, ev.title)}</p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="text-sm">{EVENT_TYPE_EMOJI[ev.eventType]}</span>
                {ev.createdBy && <RolePill role={ev.createdBy} variant="subtle" />}
              </div>
            </div>
          </div>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="min-w-0 flex-1">
          <p className="section-label">Lịch</p>
          <h1 className="page-title">Sự kiện & Cột mốc</h1>
          <p className="page-subtitle">Những ngày không nên để lỡ.</p>
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0 flex items-center gap-1.5">
          <Plus size={16} /> Thêm
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : upcoming.length === 0 && !showPast ? (
        <EmptyState
          icon={<CalendarDays size={22} />}
          title="Chưa có sự kiện nào"
          description="Lên lịch những ngày đặc biệt để app nhắc bạn đúng lúc."
          action={<button onClick={openCreate} className="btn-primary">Thêm sự kiện đầu tiên</button>}
        />
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section>
              <p className="section-label mb-3">Sắp tới</p>
              <div className="space-y-3">
                {upcoming.map(ev => <EventCard key={ev._id} ev={ev} />)}
              </div>
            </section>
          )}

          {/* Past toggle */}
          {past.length > 0 && (
            <div>
              <button
                onClick={() => setShowPast(s => !s)}
                className="text-xs font-bold text-soft transition hover:text-primary"
              >
                {showPast ? `Ẩn sự kiện đã qua (${past.length})` : `Xem sự kiện đã qua (${past.length})`}
              </button>
              {showPast && (
                <div className="mt-3 space-y-3 opacity-70">
                  {past.map(ev => <EventCard key={ev._id} ev={ev} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detail Sheet */}
      <SheetDialog
        open={!!detailEvent}
        title={detailEvent?.title ?? ''}
        subtitle={detailEvent?.description || undefined}
        onClose={() => setDetailEvent(null)}
        headerSlot={detailEvent ? (
          <span className="text-xl">{EVENT_TYPE_EMOJI[detailEvent.eventType]}</span>
        ) : undefined}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => { if (detailEvent) { setDetailEvent(null); openEdit(detailEvent); } }}
              className="btn-secondary flex-1 flex items-center justify-center gap-1.5"
            >
              <Pencil size={14} /> Sửa
            </button>
            <button
              onClick={() => { if (detailEvent) void handleDelete(detailEvent); }}
              className="flex items-center justify-center rounded-xl p-2.5 text-soft transition hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        }
      >
        {detailEvent ? (
          <div className="space-y-3 text-sm text-soft">
            <p className="font-bold text-ink text-base">
              {new Date(detailEvent.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              {detailEvent.isRecurring ? ' · hằng năm' : ''}
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-500">
                {EVENT_TYPE_EMOJI[detailEvent.eventType]} {EVENT_TYPE_LABEL[detailEvent.eventType]}
              </span>
              {detailEvent.createdBy && (
                <div className="flex items-center gap-1.5">
                  <span>Tạo bởi:</span>
                  <RolePill role={detailEvent.createdBy} variant="soft" />
                </div>
              )}
            </div>
            <p className="font-medium text-soft">{EVENT_TYPE_HINT[detailEvent.eventType]}</p>
          </div>
        ) : null}
      </SheetDialog>

      {/* Create / Edit Sheet */}
      <SheetDialog
        open={showCreate}
        title={editEvent ? 'Cập nhật sự kiện' : 'Thêm sự kiện'}
        onClose={() => { setShowCreate(false); setEditEvent(null); }}
        footer={
          <button
            form="event-form"
            type="submit"
            disabled={saving || !form.title.trim() || !form.date}
            className="btn-primary w-full py-4 text-base font-bold disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : editEvent ? 'Lưu thay đổi' : 'Thêm vào lịch'}
          </button>
        }
      >
        <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <p className="mb-2 text-xs font-bold text-soft">Loại sự kiện</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(EVENT_TYPE_LABEL) as EventType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, eventType: t }))}
                  className={`rounded-xl border py-2 text-center text-xs font-bold transition-all ${
                    form.eventType === t ? 'border-primary bg-rose-50 text-primary' : 'border-rose-100 bg-white text-soft'
                  }`}
                >
                  <div className="text-base">{EVENT_TYPE_EMOJI[t]}</div>
                  <div>{EVENT_TYPE_LABEL[t]}</div>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-soft">{EVENT_TYPE_HINT[form.eventType]}</p>
          </div>

          {/* Title */}
          <div>
            <p className="mb-1 text-xs font-bold text-soft">Tên sự kiện</p>
            <input
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ví dụ: Sinh nhật Ni, Kỷ niệm 1 năm..."
              className="input-field w-full"
            />
          </div>

          {/* Date */}
          <div>
            <p className="mb-1 text-xs font-bold text-soft">Ngày</p>
            <input
              type="date"
              required
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="input-field w-full"
            />
          </div>

          {/* Description */}
          <div>
            <p className="mb-1 text-xs font-bold text-soft">Ghi chú thêm</p>
            <textarea
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Ngày này đặc biệt vì sao..."
              className="input-field w-full resize-none"
            />
          </div>

          {/* Recurring */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
              className="h-4 w-4 rounded text-primary"
            />
            <span className="text-xs font-bold text-soft">Nhắc lại mỗi năm (sinh nhật, kỷ niệm...)</span>
          </label>
        </form>
      </SheetDialog>
    </div>
  );
};

export default EventsV2;
