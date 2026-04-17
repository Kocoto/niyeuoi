import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  CalendarClock,
  Clock3,
  HeartHandshake,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import PersonBadge from '../components/PersonBadge';
import PersonScopeTabs, { type PersonScope } from '../components/PersonScopeTabs';
import { ROLE_NAME, isRole, type Role } from '../constants/roles';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

type EventType = 'birthday' | 'anniversary' | 'date_plan' | 'special_plan';
type EventTarget = Role | 'both';
type SectionKey = 'important' | 'upcoming' | 'past';

interface IEvent {
  _id: string;
  title: string;
  date: string;
  description: string;
  createdBy?: Role;
  eventType?: EventType;
  forWhom?: EventTarget;
}

type EventFormState = {
  title: string;
  date: string;
  description: string;
  eventType: EventType;
  forWhom: EventTarget;
};

type EventCard = {
  event: IEvent;
  date: Date;
  daysLeft: number;
  type: EventType | null;
  target: EventTarget | null;
  creator: Role | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;

const TYPE_META: Record<EventType, { label: string; hint: string; tone: string; icon: LucideIcon }> = {
  birthday: { label: 'Sinh nhật', hint: 'Ngày nghiêng rõ về một người.', tone: 'bg-amber-50 text-amber-700 ring-amber-200/80', icon: Sparkles },
  anniversary: { label: 'Ngày quen nhau', hint: 'Một cột mốc chung của cả hai.', tone: 'bg-rose-50 text-rose-700 ring-rose-200/80', icon: HeartHandshake },
  date_plan: { label: 'Hẹn đi chơi', hint: 'Buổi hẹn đã được chốt lại.', tone: 'bg-sky-50 text-sky-700 ring-sky-200/80', icon: CalendarClock },
  special_plan: { label: 'Việc đặc biệt', hint: 'Một dịp riêng cần nhớ rõ.', tone: 'bg-violet-50 text-violet-700 ring-violet-200/80', icon: Calendar },
};

const SECTION_META: Record<
  SectionKey,
  {
    title: string;
    description: string;
    emptyTitle: string;
    emptyBody: string;
    cta: string;
    tone: string;
    icon: LucideIcon;
    defaults: Partial<EventFormState>;
  }
> = {
  important: {
    title: 'Ngày quan trọng',
    description: 'Sinh nhật và các ngày chung cần được nhớ kỹ.',
    emptyTitle: 'Chưa có ngày nổi bật nào được ghim lại',
    emptyBody: 'Hãy bắt đầu bằng sinh nhật hoặc ngày quen nhau để app biết ngày nào cần được giữ thật rõ.',
    cta: 'Thêm ngày quan trọng',
    tone: 'bg-rose-50 text-rose-700 ring-rose-200/80',
    icon: Sparkles,
    defaults: { eventType: 'birthday', forWhom: 'both' },
  },
  upcoming: {
    title: 'Sắp tới',
    description: 'Những dịp vẫn đang ở phía trước để tuần này không bị mơ hồ.',
    emptyTitle: 'Chưa có lịch hẹn nào đang tới',
    emptyBody: 'Nếu hai bạn vừa chốt một buổi đi chơi hoặc một dịp sắp tới, lưu vào đây để không phải nhắc lại từ đầu.',
    cta: 'Lên lịch một ngày mới',
    tone: 'bg-sky-50 text-sky-700 ring-sky-200/80',
    icon: CalendarClock,
    defaults: { eventType: 'date_plan', forWhom: 'both' },
  },
  past: {
    title: 'Đã qua',
    description: 'Những ngày đã đi qua nhưng vẫn còn ý nghĩa khi nhìn lại.',
    emptyTitle: 'Chưa có ngày nào nằm ở phía đã qua',
    emptyBody: 'Khi vài dịp đầu tiên được lưu lại, phần này sẽ giúp hai bạn nhìn rõ những ngày mình đã đi cùng nhau.',
    cta: 'Ghi lại một ngày đã qua',
    tone: 'bg-slate-100 text-slate-700 ring-slate-200',
    icon: Clock3,
    defaults: { eventType: 'special_plan', forWhom: 'both' },
  },
};

const isEventType = (value: unknown): value is EventType =>
  value === 'birthday' || value === 'anniversary' || value === 'date_plan' || value === 'special_plan';

const isEventTarget = (value: unknown): value is EventTarget =>
  value === 'boyfriend' || value === 'girlfriend' || value === 'both';

const parseEventDate = (value: string) => {
  const match = DATE_ONLY.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const getDaysLeft = (value: string) =>
  Math.round((startOfDay(parseEventDate(value)).getTime() - startOfDay(new Date()).getTime()) / DAY_MS);

const formatEventDate = (value: string) =>
  parseEventDate(value).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const formatInputDate = (value: string) => {
  const date = parseEventDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const matchesEventScope = (item: EventCard, scope: PersonScope) => {
  if (scope === 'all') return true;
  if (item.target === 'both' || item.target === scope) return true;
  return !item.target && item.creator === scope;
};

const getPersonScopeLabel = (scope: PersonScope) => (scope === 'all' ? 'Tất cả' : ROLE_NAME[scope]);

const createInitialForm = (defaults: Partial<EventFormState> = {}): EventFormState => ({
  title: '',
  date: '',
  description: '',
  eventType: 'special_plan',
  forWhom: 'both',
  ...defaults,
});

const getCountdownTone = (daysLeft: number) => {
  if (daysLeft === 0) return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (daysLeft > 0) return 'bg-rose-50 text-rose-700 ring-rose-200';
  return 'bg-slate-100 text-slate-600 ring-slate-200';
};

const getFallbackMeaning = (item: EventCard) => {
  const targetLabel = item.target === 'both' ? 'cả hai' : item.target ? ROLE_NAME[item.target] : 'một người trong hai bạn';

  switch (item.type) {
    case 'birthday':
      return item.target && item.target !== 'both'
        ? `Đây là sinh nhật của ${ROLE_NAME[item.target]}, nên phía còn lại có thể chủ động chuẩn bị tốt hơn.`
        : 'Một ngày sinh nhật quan trọng cần được nhớ rõ để không lỡ mất nhịp quan tâm.';
    case 'anniversary':
      return 'Đây là ngày chung của cả hai, đáng được giữ lại như một cột mốc để nhìn về cùng một phía.';
    case 'date_plan':
      return item.target === 'both'
        ? 'Buổi hẹn này đã được chốt lại để khi gần tới là cả hai đều biết mình đang hướng về đâu.'
        : `Một dịp đã được ghim lại để dành sự chú ý cho ${targetLabel}.`;
    case 'special_plan':
      return `Một ngày đặc biệt dành cho ${targetLabel}, đáng được lưu lại kèm lý do ngắn gọn.`;
    default:
      return 'Một record cũ vẫn được giữ an toàn ở đây, dù chưa rõ loại ngày hay người liên quan.';
  }
};

const getCountdownCopy = (item: EventCard) => {
  const targetLabel = item.target && item.target !== 'both' ? ROLE_NAME[item.target] : null;
  const days = Math.abs(item.daysLeft);

  if (item.daysLeft < 0) {
    switch (item.type) {
      case 'birthday':
        return targetLabel ? `Sinh nhật của ${targetLabel} đã qua ${days} ngày.` : `Ngày sinh nhật này đã qua ${days} ngày.`;
      case 'anniversary':
        return `Ngày quen nhau đã đi qua ${days} ngày.`;
      case 'date_plan':
        return `Buổi hẹn này đã qua ${days} ngày.`;
      case 'special_plan':
        return targetLabel ? `Ngày đặc biệt của ${targetLabel} đã qua ${days} ngày.` : `Ngày đặc biệt này đã qua ${days} ngày.`;
      default:
        return `Ngày này đã qua ${days} ngày.`;
    }
  }

  if (item.daysLeft === 0) {
    switch (item.type) {
      case 'birthday':
        return targetLabel ? `Hôm nay là sinh nhật của ${targetLabel}.` : 'Hôm nay là một ngày sinh nhật quan trọng.';
      case 'anniversary':
        return 'Hôm nay là ngày quen nhau của hai bạn.';
      case 'date_plan':
        return item.target === 'both' ? 'Hôm nay là buổi mình hẹn.' : `Hôm nay là ngày dành cho ${targetLabel ?? 'người ấy'}.`;
      case 'special_plan':
        return targetLabel ? `Hôm nay là ngày đặc biệt của ${targetLabel}.` : 'Hôm nay là một ngày đặc biệt đáng chú ý.';
      default:
        return 'Hôm nay là ngày đã được đánh dấu từ trước.';
    }
  }

  switch (item.type) {
    case 'birthday':
      return targetLabel ? `Còn ${item.daysLeft} ngày tới sinh nhật của ${targetLabel}.` : `Còn ${item.daysLeft} ngày tới một ngày sinh nhật quan trọng.`;
    case 'anniversary':
      return `Còn ${item.daysLeft} ngày tới ngày quen nhau.`;
    case 'date_plan':
      return item.target === 'both'
        ? `Còn ${item.daysLeft} ngày tới buổi mình hẹn.`
        : `Còn ${item.daysLeft} ngày tới dịp dành cho ${targetLabel ?? 'người ấy'}.`;
    case 'special_plan':
      return targetLabel ? `Còn ${item.daysLeft} ngày tới ngày đặc biệt của ${targetLabel}.` : `Còn ${item.daysLeft} ngày tới một dịp đặc biệt.`;
    default:
      return `Còn ${item.daysLeft} ngày tới ngày này.`;
  }
};

const Events: React.FC = () => {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [personScope, setPersonScope] = useState<PersonScope>('all');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormState>(createInitialForm());

  const { role } = useAuth();
  const { toast, confirm } = useUI();

  const resetForm = useCallback((defaults: Partial<EventFormState> = {}) => {
    setFormData(createInitialForm(defaults));
    setIsEditing(false);
    setEditingId(null);
  }, []);

  const openCreateModal = (defaults: Partial<EventFormState> = {}) => {
    resetForm(defaults);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get('/events');
      const data: IEvent[] = res.data.data ?? [];
      data.sort((a, b) => parseEventDate(a.date).getTime() - parseEventDate(b.date).getTime());
      setEvents(data);
    } catch {
      console.error('Lỗi khi tải sự kiện');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEdit = (event: IEvent) => {
    resetForm({
      title: event.title,
      date: formatInputDate(event.date),
      description: event.description || '',
      eventType: isEventType(event.eventType) ? event.eventType : 'special_plan',
      forWhom: isEventTarget(event.forWhom) ? event.forWhom : 'both',
    });
    setEditingId(event._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = { ...formData, description: formData.description.trim() };
    try {
      if (isEditing && editingId) {
        await api.put(`/events/${editingId}`, payload);
      } else {
        await api.post('/events', payload);
      }
      closeModal();
      await fetchEvents();
    } catch {
      toast('Lỗi khi lưu ngày này!', 'error');
    }
  };

  const deleteEvent = async (id: string) => {
    if (!await confirm('Xóa ngày này nhé?')) return;
    try {
      await api.delete(`/events/${id}`);
      await fetchEvents();
    } catch {
      toast('Không xóa được ngày này!', 'error');
    }
  };

  const cards = useMemo<EventCard[]>(() => events.map((event) => ({
    event,
    date: parseEventDate(event.date),
    daysLeft: getDaysLeft(event.date),
    type: isEventType(event.eventType) ? event.eventType : null,
    target: isEventTarget(event.forWhom) ? event.forWhom : null,
    creator: isRole(event.createdBy) ? event.createdBy : null,
  })), [events]);

  const scopeCounts = useMemo<Record<PersonScope, number>>(() => ({
    all: cards.length,
    girlfriend: cards.filter((item) => matchesEventScope(item, 'girlfriend')).length,
    boyfriend: cards.filter((item) => matchesEventScope(item, 'boyfriend')).length,
  }), [cards]);

  const filteredCards = useMemo(
    () => cards.filter((item) => matchesEventScope(item, personScope)),
    [cards, personScope],
  );

  const important = useMemo(
    () => filteredCards.filter((item) => item.daysLeft >= 0 && (item.type === 'birthday' || item.type === 'anniversary')),
    [filteredCards],
  );
  const importantIds = useMemo(() => new Set(important.map((item) => item.event._id)), [important]);
  const upcoming = useMemo(
    () => filteredCards.filter((item) => item.daysLeft >= 0 && !importantIds.has(item.event._id)),
    [filteredCards, importantIds],
  );
  const past = useMemo(
    () => [...filteredCards.filter((item) => item.daysLeft < 0)].sort((a, b) => b.date.getTime() - a.date.getTime()),
    [filteredCards],
  );
  const sections: Record<SectionKey, EventCard[]> = { important, upcoming, past };
  const closestUpcoming = filteredCards.find((item) => item.daysLeft >= 0) ?? null;
  const activeScopeLabel = getPersonScopeLabel(personScope);
  const filteredEmptyTitle = personScope === 'all'
    ? 'Chưa có ngày nào được ghim lại'
    : `Chưa có ngày nào đang chạm tới ${activeScopeLabel}`;
  const filteredEmptyBody = personScope === 'all'
    ? 'Events là nơi giữ sinh nhật, ngày quen nhau, buổi hẹn, và các dịp đặc biệt để nhìn vào là biết ngày đó thuộc về ai và vì sao nó đáng nhớ. Hiện tại phần này còn trống, nên bước đầu tiên là lưu một ngày thật sự có nghĩa.'
    : `${activeScopeLabel} chưa có ngày riêng hoặc ngày chung nào khớp với bộ lọc này. Các record cũ chưa rõ người liên quan vẫn được giữ ở mục Tất cả để không mất ngữ cảnh.`;
  const countdownSummary = closestUpcoming
    ? getCountdownCopy(closestUpcoming)
    : personScope === 'all'
      ? 'Chưa có ngày nào sắp tới được lưu lại.'
      : `Chưa có ngày sắp tới nào chạm tới ${activeScopeLabel.toLowerCase()}.`;

  const renderTarget = (target: EventTarget | null) => {
    if (target === 'both') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 ring-1 ring-violet-200/80">
          <HeartHandshake size={12} />
          Dành cho cả hai
        </span>
      );
    }

    if (target) {
      return <PersonBadge role={target} prefix="Dành cho" showIcon={false} />;
    }

    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
        Chưa rõ dành cho ai
      </span>
    );
  };

  const renderCard = (item: EventCard) => {
    const meta = item.type ? TYPE_META[item.type] : null;
    const TypeIcon = meta?.icon ?? Sparkles;
    const countdownText = item.daysLeft === 0 ? 'Hôm nay' : item.daysLeft > 0 ? `${item.daysLeft} ngày nữa` : `${Math.abs(item.daysLeft)} ngày trước`;

    return (
      <motion.article
        key={item.event._id}
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[1.75rem] border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] ring-1 ring-slate-100 backdrop-blur md:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${getCountdownTone(item.daysLeft)}`}>
                <Calendar size={12} />
                {countdownText}
              </span>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${meta ? meta.tone : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                <TypeIcon size={12} />
                {meta ? meta.label : 'Record cũ'}
              </span>
            </div>
            <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900">{item.event.title}</h3>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{getCountdownCopy(item)}</p>
          </div>

          <div className="flex shrink-0 gap-1">
            <button onClick={() => handleEdit(item.event)} className="rounded-2xl p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Chỉnh sự kiện">
              <Pencil size={17} />
            </button>
            <button onClick={() => deleteEvent(item.event._id)} className="rounded-2xl p-2.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" aria-label="Xóa sự kiện">
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            <CalendarClock size={12} />
            {formatEventDate(item.event.date)}
          </span>
          {item.creator ? (
            <PersonBadge role={item.creator} prefix="Tạo bởi" showIcon={false} />
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              Record cũ chưa rõ ai tạo
            </span>
          )}
          {renderTarget(item.target)}
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">{item.event.description?.trim() || getFallbackMeaning(item)}</p>
      </motion.article>
    );
  };

  const renderEmpty = (sectionKey: SectionKey) => {
    const meta = SECTION_META[sectionKey];

    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white/75 p-5 shadow-sm">
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${meta.tone}`}>
          <meta.icon size={12} />
          {meta.title}
        </div>
        <h3 className="mt-4 text-lg font-black tracking-tight text-slate-900">{meta.emptyTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{meta.emptyBody}</p>
        <button onClick={() => openCreateModal(meta.defaults)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 active:scale-[0.98]">
          <Plus size={15} />
          {meta.cta}
        </button>
      </div>
    );
  };

  const renderSection = (sectionKey: SectionKey) => {
    const meta = SECTION_META[sectionKey];
    const Icon = meta.icon;
    const items = sections[sectionKey];

    return (
      <motion.section key={sectionKey} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${meta.tone}`}>
                <Icon size={18} />
              </span>
              {meta.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{meta.description}</p>
          </div>
          <button onClick={() => openCreateModal(meta.defaults)} className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 md:inline-flex">
            <Plus size={15} />
            {meta.cta}
          </button>
        </div>
        {items.length === 0 ? renderEmpty(sectionKey) : <div className="space-y-3">{items.map((item) => renderCard(item))}</div>}
      </motion.section>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 md:py-8 md:pb-8">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[2rem] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-sky-50 p-5 shadow-[0_30px_100px_-50px_rgba(244,114,182,0.45)] md:p-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-rose-600 ring-1 ring-rose-100">
                <Calendar size={12} />
                Events
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-[2.75rem]">Những ngày cần được nhớ rõ</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-[15px]">
                Đây không chỉ là một list ngày tháng. Màn này giúp biết ngày nào sắp tới, ngày đó dành cho ai, và vì sao nó đáng để giữ lại giữa nhịp sống hằng ngày của hai bạn.
              </p>
            </div>
            <button onClick={() => openCreateModal()} className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800 active:scale-[0.98]">
              <Plus size={16} />
              Thêm một ngày mới
            </button>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <PersonBadge role={role} prefix="Đang xem với vai" variant="solid" />
              <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-white/70">
                {closestUpcoming ? <CalendarClock size={15} className="text-rose-500" /> : <Clock3 size={15} className="text-slate-400" />}
                {countdownSummary}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Xem theo người liên quan</p>
              <PersonScopeTabs
                value={personScope}
                onChange={setPersonScope}
                counts={scopeCounts}
                ariaLabel="Lọc Events theo người liên quan"
              />
              {personScope !== 'all' ? (
                <p className="text-xs leading-5 text-slate-500">
                  Filter này vẫn giữ các ngày chung của cả hai, và chỉ ẩn những ngày không chạm tới {activeScopeLabel.toLowerCase()}.
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {(['important', 'upcoming', 'past'] as SectionKey[]).map((sectionKey) => {
              const meta = SECTION_META[sectionKey];
              const count = sections[sectionKey].length;
              return (
                <div key={sectionKey} className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 shadow-sm ring-1 ring-white/70">
                  <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${meta.tone}`}>
                    <meta.icon size={12} />
                    {meta.title}
                  </div>
                  <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">{count}</div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {sectionKey === 'important' && (count > 0 ? 'Những ngày nổi bật cần nhớ kỹ.' : 'Chưa có ngày nổi bật nào được ghim.')}
                    {sectionKey === 'upcoming' && (count > 0 ? 'Những dịp vẫn đang ở phía trước.' : 'Phần sắp tới vẫn đang để trống.')}
                    {sectionKey === 'past' && (count > 0 ? 'Những ngày đã đi qua nhưng chưa biến mất.' : 'Phần nhìn lại sẽ hiện khi có dữ liệu.')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      <div className="mt-8 space-y-10">
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin text-rose-400" size={40} /></div>
        ) : filteredCards.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-rose-200 bg-white/85 p-6 text-center shadow-sm md:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 ring-1 ring-rose-200"><Calendar size={24} /></div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">{filteredEmptyTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {filteredEmptyBody}
            </p>
            <button onClick={() => openCreateModal({ eventType: 'anniversary', forWhom: 'both' })} className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 active:scale-[0.98]">
              <Plus size={16} />
              Tạo ngày đầu tiên
            </button>
          </section>
        ) : (
          <>
            {renderSection('important')}
            {renderSection('upcoming')}
            {renderSection('past')}
          </>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 28, scale: 0.98 }} className="relative z-[101] w-full max-w-xl rounded-t-[2rem] bg-white p-5 shadow-2xl md:rounded-[2rem] md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-rose-600 ring-1 ring-rose-200">
                    <CalendarClock size={12} />
                    {isEditing ? 'Chỉnh ngày' : 'Ngày mới'}
                  </span>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{isEditing ? 'Bổ sung ngữ nghĩa cho ngày này' : 'Lưu một ngày để lần sau nhìn là hiểu ngay'}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Chọn loại, chọn người liên quan, rồi viết ngắn vì sao ngày này quan trọng.</p>
                </div>
                <button onClick={closeModal} className="rounded-2xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng">
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4">
                <PersonBadge role={role} prefix={isEditing ? 'Bạn đang chỉnh với vai' : 'Bạn đang ghi với vai'} />
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tên ngày này</label>
                  <input required value={formData.title} onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value }))} placeholder="Ví dụ: Sinh nhật Ni, đi xem phim cùng nhau..." className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Ngày diễn ra</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData((current) => ({ ...current, date: e.target.value }))} className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100" />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Loại ngày</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(Object.entries(TYPE_META) as [EventType, (typeof TYPE_META)[EventType]][]).map(([type, meta]) => {
                      const Icon = meta.icon;
                      const active = formData.eventType === type;
                      return (
                        <button key={type} type="button" onClick={() => setFormData((current) => ({ ...current, eventType: type }))} className={`rounded-[1.25rem] border px-4 py-4 text-left transition ${active ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'}`}>
                          <span className="flex items-center gap-2 text-sm font-black"><Icon size={16} />{meta.label}</span>
                          <span className={`mt-2 block text-sm leading-6 ${active ? 'text-white/80' : 'text-slate-500'}`}>{meta.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Ngày này dành cho ai</label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(['girlfriend', 'boyfriend', 'both'] as EventTarget[]).map((target) => {
                      const active = formData.forWhom === target;
                      return (
                        <button key={target} type="button" onClick={() => setFormData((current) => ({ ...current, forWhom: target }))} className={`rounded-[1.25rem] border px-4 py-4 text-left transition ${active ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'}`}>
                          <span className="block text-sm font-black">{target === 'both' ? 'Cả hai' : ROLE_NAME[target]}</span>
                          <span className={`mt-2 block text-sm leading-6 ${active ? 'text-white/80' : 'text-slate-500'}`}>
                            {target === 'both' ? 'Dùng cho ngày chung như ngày quen nhau hoặc buổi hẹn của cả hai.' : `Dùng khi ngày này nghiêng rõ về ${ROLE_NAME[target]}.`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Ý nghĩa ngày này</label>
                  <textarea rows={4} value={formData.description} onChange={(e) => setFormData((current) => ({ ...current, description: e.target.value }))} placeholder="Ví dụ: ngày này quan trọng vì mình đã hẹn từ lâu, hoặc vì đây là sinh nhật của Ni..." className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-6 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100" />
                </div>

                <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 active:scale-[0.98]">
                  <CalendarClock size={16} />
                  {isEditing ? 'Cập nhật ngày này' : 'Lưu ngày này'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Events;
