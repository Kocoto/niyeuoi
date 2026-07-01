import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Loader2,
  MessageCircleHeart,
  MoonStar,
  NotebookPen,
  Sparkles,
  SunMedium,
  Sunset,
  Ticket,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';
import ContextualEmptyState from '../components/ContextualEmptyState';
import ExpenseHomeWidget from '../components/expenses/ExpenseHomeWidget';
import PersonBadge from '../components/PersonBadge';
import { useAuth } from '../context/AuthContext';
import { ROLE_CORNER_LABEL, ROLE_NAME, isRole, type Role } from '../constants/roles';
import type {
  Memory,
  Mood,
  DeepTalkQuestion,
  EventItem,
  Challenge,
  Coupon,
  Reward,
  MemoryResurfacingItem,
  SmartSuggestionSourceType,
  SmartSuggestion,
  RelationshipStateSourceType,
  RelationshipStateSignalType,
  RelationshipStateSignal,
  RelationshipState,
  DashboardState,
  RoleSummary,
  SharedPendingItem,
  FeedItem,
  RewardHandoffView,
  MemoryResurfacingView,
  NextStepView,
  Daypart,
} from '../components/home/types';


const ROLE_ORDER: Role[] = ['girlfriend', 'boyfriend'];
const START_DATE = new Date(2026, 1, 7, 20, 46, 0);
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;

const roleCopy: Record<Role, { eyebrow: string; title: string; subtitle: string; accent: string }> = {
  girlfriend: {
    eyebrow: 'Home của Ni',
    title: 'Mở ra là thấy hôm nay của cả hai đang ở đâu.',
    subtitle: 'Hôm nay Ni và Được đang ở đâu, điều gì còn đang chờ giữa hai người.',
    accent: 'from-pink-100 via-rose-50 to-white',
  },
  boyfriend: {
    eyebrow: 'Home của Được',
    title: 'Ai vừa làm gì, phía nào còn đang chờ.',
    subtitle: 'Thấy rõ nhịp của từng người rồi chọn bước tiếp theo phù hợp nhất lúc này.',
    accent: 'from-sky-100 via-white to-rose-50',
  },
};

const roleSurfaceTone: Record<Role, string> = {
  girlfriend: 'bg-[#fff7fb] ring-pink-100',
  boyfriend: 'bg-[#f7fbff] ring-sky-100',
};

const suggestionSourceLabel: Record<SmartSuggestionSourceType, string> = {
  event: 'Ngày đã ghim',
  deep_talk_question: 'Deep Talk',
  coupon: 'Voucher',
  mood: 'Mood',
  place: 'Places',
  wishlist: 'Wishlist',
};

const relationshipSourceLabel: Record<RelationshipStateSourceType, string> = {
  mood: 'Mood',
  deep_talk_question: 'Deep Talk',
  event: 'Ngày đã ghim',
  coupon: 'Voucher',
  reward: 'Điều vừa mở ra',
  system: 'Nhịp hôm nay',
};

function getElapsedDays() {
  return Math.max(0, Math.floor((Date.now() - START_DATE.getTime()) / 86400000));
}

function formatRelative(dateStr?: string) {
  if (!dateStr) return 'gần đây';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days === 1) return 'hôm qua';
  return `${days} ngày trước`;
}

function resolveRole(value?: Role): Role | null {
  return isRole(value) ? value : null;
}

function isToday(dateStr?: string) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function getOppositeRole(currentRole: Role) {
  return currentRole === 'girlfriend' ? 'boyfriend' : 'girlfriend';
}

function hasAnswered(answer?: DeepTalkQuestion['answers'][Role]) {
  return !!answer?.isInPerson || !!answer?.text;
}

function pickLatestByTimestamp<T>(items: T[], getTimestamp: (item: T) => string | undefined): T | undefined {
  let latest: T | undefined;
  let latestTime = Number.NEGATIVE_INFINITY;

  for (const item of items) {
    const timestamp = getTimestamp(item);
    if (!timestamp) continue;
    const currentTime = new Date(timestamp).getTime();
    if (Number.isNaN(currentTime) || currentTime <= latestTime) continue;
    latest = item;
    latestTime = currentTime;
  }

  return latest;
}

function getDaypart(): Daypart {
  const hour = new Date().getHours();

  if (hour < 12) {
    return {
      label: 'Buổi sáng nhẹ một chút',
      note: 'Nhìn nhanh hai nhịp để biết hôm nay đang mở ra thế nào.',
      icon: <SunMedium size={16} />,
    };
  }

  if (hour < 18) {
    return {
      label: 'Buổi chiều cần một nhịp rõ ràng',
      note: 'Ai vừa cập nhật gì, phía nào còn đang chờ — một lần mở là đủ thấy.',
      icon: <Sunset size={16} />,
    };
  }

  return {
    label: 'Buổi tối là lúc kéo nhau quay lại đúng chỗ',
    note: 'Lúc tốt nhất để tiếp tục câu chuyện còn đang dở giữa hai người.',
    icon: <MoonStar size={16} />,
  };
}

function parseDateOnly(value?: string) {
  if (!value) return null;
  const match = DATE_ONLY.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDaysUntil(value?: string) {
  const date = parseDateOnly(value);
  if (!date) return null;
  const today = new Date();
  const target = new Date(date);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function resolveTarget(value?: Role | 'both') {
  if (value === 'both' || isRole(value)) return value;
  return null;
}

function getTargetLabel(value?: Role | 'both') {
  const target = resolveTarget(value);
  if (target === 'both') return 'cả hai';
  return target ? ROLE_NAME[target] : 'một phía chưa rõ';
}

function getEventReminderCopy(event: EventItem) {
  const daysUntil = getDaysUntil(event.date);
  const targetLabel = getTargetLabel(event.forWhom);

  if (daysUntil === null) {
    return `Một ngày dành cho ${targetLabel} đã được giữ lại.`;
  }

  if (daysUntil === 0) {
    return `Hôm nay là dịp dành cho ${targetLabel}.`;
  }

  if (daysUntil === 1) {
    return `Chỉ còn 1 ngày nữa tới dịp dành cho ${targetLabel}.`;
  }

  if (daysUntil > 1) {
    return `Còn ${daysUntil} ngày nữa tới dịp dành cho ${targetLabel}.`;
  }

  return `Dịp này dành cho ${targetLabel} đã qua ${Math.abs(daysUntil)} ngày.`;
}

function getChallengeDirectionLabel(challenge: Challenge) {
  const creator = resolveRole(challenge.createdBy);
  const target = resolveTarget(challenge.forWhom);

  if (target === 'both') return 'Cùng nhau';
  if (creator && target) return `${ROLE_NAME[creator]} dành cho ${ROLE_NAME[target]}`;
  if (target) return `Dành cho ${ROLE_NAME[target]}`;
  if (creator) return `Khởi xướng bởi ${ROLE_NAME[creator]}`;
  return 'Một challenge cũ chưa rõ hướng';
}

function getRewardRoute(reward: Reward) {
  switch (reward.rewardKind) {
    case 'date_suggestion':
      return {
        to: '/events',
        button: 'Mở gợi ý hẹn',
        icon: <CalendarDays size={18} />,
      };
    case 'prompt':
      return {
        to: '/deeptalk',
        button: 'Mở nhịp Deep Talk',
        icon: <MessageCircleHeart size={18} />,
      };
    case 'coupon':
      return {
        to: '/coupons',
        button: 'Mở voucher',
        icon: <Ticket size={18} />,
      };
    case 'memory_highlight':
      return {
        to: '/timeline',
        button: 'Xem lại kỷ niệm',
        icon: <NotebookPen size={18} />,
      };
    case 'challenge':
      return {
        to: '/challenges',
        button: 'Mở challenge',
        icon: <Sparkles size={18} />,
      };
    default:
      return {
        to: reward.sourceType === 'deep_talk_question' ? '/deeptalk' : '/events',
        button: 'Mở tiếp từ đây',
        icon: <ArrowRight size={18} />,
      };
  }
}

function getRewardMeta(reward: Reward) {
  const sourceLabel = reward.sourceLabel ? `"${reward.sourceLabel}"` : undefined;

  switch (reward.sourceType) {
    case 'challenge':
      return `${reward.status === 'pending' ? 'Vừa mở ra' : 'Vẫn đang để đây'} · ${sourceLabel ? `sau ${sourceLabel}` : 'sau một challenge vừa khép lại'}`;
    case 'deep_talk_question':
      return `${reward.status === 'pending' ? 'Vừa mở ra' : 'Vẫn đang để đây'} · ${sourceLabel ? `sau câu hỏi ${sourceLabel}` : 'sau một nhịp Deep Talk đủ hai bên'}`;
    case 'event':
      return `${reward.status === 'pending' ? 'Vừa mở ra' : 'Vẫn đang để đây'} · sau một dịp vừa được khép lại`;
    case 'mood':
      return `${reward.status === 'pending' ? 'Vừa mở ra' : 'Vẫn đang để đây'} · sau một nhịp mood đủ đều`;
    default:
      return `${reward.status === 'pending' ? 'Vừa mở ra' : 'Vẫn đang để đây'} · ${formatRelative(reward.createdAt)}`;
  }
}

function formatMemoryDate(value?: string) {
  const date = parseDateOnly(value);
  if (!date) return 'một ngày cũ';

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getMemoryResurfacingFallbackLabel(item: MemoryResurfacingItem) {
  if (item.reason === 'anniversary_day') {
    return item.yearsAgo && item.yearsAgo > 0 ? `${item.yearsAgo} năm trước cũng là ngày này` : 'Một kỷ niệm đang quay lại đúng ngày';
  }

  return 'Một kỷ niệm được ghim đang nổi lên';
}

function getMemoryResurfacingFallbackDetail(item: MemoryResurfacingItem) {
  const title = item.memory.title ? `"${item.memory.title}"` : 'một kỷ niệm cũ';

  if (item.reason === 'anniversary_day') {
    return `${title} vừa quay lại đúng ngày. Không cần làm gì ngay, chỉ mở Timeline nếu hôm nay muốn nhìn lại một chút.`;
  }

  return `${title} đang được giữ lại như một dấu ghim nhỏ. Timeline để sẵn ở đây khi hai người muốn xem lại.`;
}

function buildMemoryResurfacingView(item: MemoryResurfacingItem): MemoryResurfacingView {
  const owner = resolveRole(item.memory.createdBy);
  const dateLabel = formatMemoryDate(item.memory.date);
  const ownerLabel = owner ? `góc ${ROLE_NAME[owner]}` : 'kỷ niệm cũ';

  return {
    item,
    owner,
    badge: item.reason === 'anniversary_day' ? 'Đúng ngày' : 'Đã ghim',
    title: item.label || getMemoryResurfacingFallbackLabel(item),
    detail: item.detail || getMemoryResurfacingFallbackDetail(item),
    meta: `${dateLabel} · ${ownerLabel}`,
  };
}

function getSmartSuggestionMeta(item: SmartSuggestion) {
  const sourceLabel = suggestionSourceLabel[item.source.type];
  const timeLabel = item.expiresAt ? `có ngữ cảnh tới ${formatMemoryDate(item.expiresAt)}` : formatRelative(item.createdAt);
  return `${sourceLabel} · ${timeLabel}`;
}

function getRelationshipSignalMeta(signal: RelationshipStateSignal) {
  const sourceLabel = relationshipSourceLabel[signal.source.type];
  const urgencyLabel = signal.urgency === 'today' ? 'hôm nay' : signal.urgency === 'soon' ? 'sắp tới' : 'nhẹ';
  const timeLabel = signal.dueAt ? `mốc ${formatMemoryDate(signal.dueAt)}` : formatRelative(signal.createdAt);
  return `${sourceLabel} · ${urgencyLabel} · ${timeLabel}`;
}

function getRelationshipSignalIcon(type: RelationshipStateSignalType) {
  switch (type) {
    case 'deeptalk_waiting':
      return <MessageCircleHeart size={18} />;
    case 'event_upcoming':
      return <CalendarDays size={18} />;
    case 'coupon_waiting':
      return <Ticket size={18} />;
    case 'reward_open':
      return <Sparkles size={18} />;
    case 'mood_missing':
    default:
      return <Sparkles size={18} />;
  }
}

function buildRelationshipNextStep(signal?: RelationshipStateSignal): NextStepView | null {
  if (!signal?.cta) return null;

  return {
    to: signal.cta.to,
    title: signal.title,
    detail: signal.detail,
    button: signal.cta.label,
    icon: getRelationshipSignalIcon(signal.type),
  };
}

function buildSharedPendingItemFromSignal(signal: RelationshipStateSignal): SharedPendingItem | null {
  if (!signal.cta) return null;

  return {
    key: signal.id,
    title: signal.title,
    detail: signal.detail,
    to: signal.cta.to,
  };
}

const TodayRoleCard: React.FC<{ summary: RoleSummary; currentRole: Role; loading: boolean }> = ({ summary, currentRole, loading }) => {
  const isCurrentRole = summary.role === currentRole;

  return (
    <div className={`rounded-[1.7rem] p-5 shadow-sm ring-1 ${roleSurfaceTone[summary.role]}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-label">{summary.title}</p>
          <div className="mt-2">
            <PersonBadge
              role={summary.role}
              prefix="Góc của"
              variant={isCurrentRole ? 'solid' : 'soft'}
            />
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            summary.checkedInToday ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'
          }`}
        >
          {summary.checkedInToday ? 'Đã ghi cảm xúc hôm nay' : 'Còn mở ghi cảm xúc'}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-[1.3rem] bg-white/85 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b292a6]">Cảm xúc gần nhất</p>
          <p className="mt-2 text-lg font-black text-ink">{loading ? 'Đang xem lại...' : summary.moodValue}</p>
          <p className="mt-2 text-sm leading-6 text-soft">{summary.moodMeta}</p>
        </div>

        <div className="rounded-[1.3rem] bg-white/75 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b292a6]">Vừa cập nhật</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink">{summary.recentLabel}</p>
          <p className="mt-2 text-sm leading-6 text-soft">{summary.recentMeta}</p>
        </div>

        <div className="rounded-[1.3rem] bg-white/75 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b292a6]">Điều còn chờ</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink">{summary.waitingLabel}</p>
        </div>
      </div>

      <Link to={summary.actionTo} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">
        {summary.actionLabel}
        <ArrowRight size={15} />
      </Link>
    </div>
  );
};

const RelationshipSignalCard: React.FC<{ signal: RelationshipStateSignal; compact?: boolean }> = ({ signal, compact = false }) => {
  const target = resolveTarget(signal.target);
  const sourceOwner = resolveRole(signal.source.createdBy === 'system' ? undefined : signal.source.createdBy);

  return (
    <Link
      to={signal.cta?.to ?? '/'}
      className="card-hover block rounded-[1.35rem] bg-gradient-to-br from-[#fff9f4] via-white to-[#f7fbff] p-4 ring-1 ring-amber-100"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
              Tình hình hiện tại
            </span>
            {target === 'both' ? (
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-soft ring-1 ring-stone-200">
                Cho cả hai
              </span>
            ) : target ? (
              <PersonBadge role={target} prefix="Dành cho" showIcon={false} />
            ) : sourceOwner ? (
              <PersonBadge role={sourceOwner} prefix="Từ dữ liệu của" showIcon={false} />
            ) : null}
          </div>
          <p className={`${compact ? 'mt-2 text-sm' : 'mt-3 text-sm'} font-bold text-ink`}>{signal.title}</p>
          <p className="mt-2 text-sm leading-6 text-soft">{signal.detail}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
          {getRelationshipSignalIcon(signal.type)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-soft">{getRelationshipSignalMeta(signal)}</span>
        {signal.cta && (
          <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
            {signal.cta.label}
            <ArrowRight size={15} />
          </span>
        )}
      </div>
    </Link>
  );
};

const RelationshipStatePanel: React.FC<{ state: RelationshipState; currentRole: Role }> = ({ state, currentRole }) => {
  const nextSignal = state.nextStep;

  return (
    <div className="surface-card p-5 md:p-6">
      <p className="section-label">Tình hình hiện tại</p>
      <h2 className="mt-2 text-2xl font-black text-ink">Nhịp hôm nay của hai người</h2>
      <p className="mt-2 text-sm leading-6 text-soft">
        Hôm nay ai đã có nhịp riêng, điều gì còn đang chờ, và bước nào đáng mở tiếp.
      </p>

      <div className="mt-5 grid gap-3">
        {ROLE_ORDER.map((itemRole) => {
          const person = state.people[itemRole];
          const firstAction = person.today.actions[0];
          const firstSignal = person.signals[0];
          const isCurrentRole = itemRole === currentRole;

          return (
            <div key={itemRole} className={`rounded-[1.3rem] p-4 ring-1 ${roleSurfaceTone[itemRole]}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <PersonBadge role={itemRole} prefix="Góc của" showIcon={false} variant={isCurrentRole ? 'solid' : 'soft'} />
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${person.today.hasMoodCheckIn ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-soft ring-1 ring-stone-200'}`}>
                  {person.today.hasMoodCheckIn ? 'Đã ghi cảm xúc' : 'Còn mở ghi cảm xúc'}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-ink">
                {person.today.mood ? `${person.label} đang ${person.today.mood.value.toLowerCase()}` : person.summary}
              </p>
              <p className="mt-2 text-sm leading-6 text-soft">
                {firstAction
                  ? `${firstAction.label} · ${formatRelative(firstAction.at)}`
                  : firstSignal?.title ?? 'Chưa có gì mới từ phía này hôm nay.'}
              </p>
            </div>
          );
        })}
      </div>

      {nextSignal && (
        <div className="mt-4">
          <RelationshipSignalCard signal={nextSignal} compact />
        </div>
      )}
    </div>
  );
};

const FeedRow: React.FC<{ item: FeedItem }> = ({ item }) => (
  <Link to={item.to} className="card-hover flex items-start justify-between gap-4 rounded-[1.35rem] bg-[#fcfafb] p-4">
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        {item.role ? (
          <PersonBadge role={item.role} showIcon={false} />
        ) : (
          <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-600 ring-1 ring-stone-200">
            Đã lưu trước đây
          </span>
        )}
        <span className="text-xs text-soft">{item.meta}</span>
      </div>
      <p className="mt-3 text-sm font-bold text-ink">{item.title}</p>
      <p className="mt-1 text-sm leading-6 text-soft">{item.detail}</p>
    </div>
    <span className="pt-1 text-primary">
      <ArrowRight size={16} />
    </span>
  </Link>
);

const SmartSuggestionCard: React.FC<{ item: SmartSuggestion }> = ({ item }) => {
  const target = resolveTarget(item.targetRole);
  const sourceOwner = resolveRole(item.source.createdBy);

  return (
    <Link
      to={item.cta.to}
      className="card-hover block rounded-[1.35rem] bg-gradient-to-br from-[#f7fbff] via-white to-rose-50 p-4 ring-1 ring-sky-100"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-700">
              Gợi ý nhẹ
            </span>
            {target === 'both' ? (
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-soft ring-1 ring-stone-200">
                Cho cả hai
              </span>
            ) : target ? (
              <PersonBadge role={target} prefix="Dành cho" showIcon={false} />
            ) : sourceOwner ? (
              <PersonBadge role={sourceOwner} prefix="Từ dữ liệu của" showIcon={false} />
            ) : null}
          </div>
          <p className="mt-3 text-sm font-bold text-ink">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-soft">{item.detail}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
          <Sparkles size={18} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-soft">{getSmartSuggestionMeta(item)}</span>
        <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
          {item.cta.label}
          <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
};

const MemoryResurfacingCard: React.FC<{ item: MemoryResurfacingView; onOpen: (item: MemoryResurfacingItem) => void }> = ({ item, onOpen }) => (
  <Link
    to="/timeline"
    onClick={() => onOpen(item.item)}
    className="card-hover block rounded-[1.35rem] bg-gradient-to-br from-amber-50 via-white to-rose-50 p-4 ring-1 ring-amber-100"
  >
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
            {item.badge}
          </span>
          {item.owner ? (
            <PersonBadge role={item.owner} prefix="Góc của" showIcon={false} />
          ) : (
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-soft ring-1 ring-stone-200">
              Kỷ niệm cũ
            </span>
          )}
        </div>
        <p className="mt-3 text-sm font-bold text-ink">{item.title}</p>
        <p className="mt-2 text-sm leading-6 text-soft">{item.detail}</p>
      </div>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
        <CalendarDays size={18} />
      </div>
    </div>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-soft">{item.meta}</span>
      <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
        Mở Timeline
        <ArrowRight size={15} />
      </span>
    </div>
  </Link>
);

const RewardHandoffCard: React.FC<{ item: RewardHandoffView; onOpen: (reward: Reward) => void }> = ({ item, onOpen }) => (
  <Link
    to={item.to}
    onClick={() => onOpen(item.reward)}
    className={`card-hover block rounded-[1.35rem] p-4 ${
      item.reward.status === 'pending' ? 'bg-gradient-to-br from-rose-50 to-white ring-1 ring-rose-100' : 'bg-[#fcfafb]'
    }`}
  >
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              item.reward.status === 'pending'
                ? 'bg-rose-100 text-rose-700'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            {item.reward.status === 'pending' ? 'Vừa mở ra' : 'Đã mở gần đây'}
          </span>
          {item.reward.forWhom === 'both' ? (
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-soft ring-1 ring-stone-200">
              Cho cả hai
            </span>
          ) : item.reward.forWhom ? (
            <PersonBadge role={item.reward.forWhom} prefix="Dành cho" showIcon={false} />
          ) : null}
        </div>
        <p className="mt-3 text-sm font-bold text-ink">{item.reward.title}</p>
        <p className="mt-2 text-sm leading-6 text-soft">{item.reward.description || 'Một nhịp mới vừa được mở ra từ điều hai người vừa khép lại.'}</p>
      </div>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
        {item.icon}
      </div>
    </div>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-soft">{item.meta}</span>
      <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
        {item.button}
        <ArrowRight size={15} />
      </span>
    </div>
  </Link>
);

const Home: React.FC = () => {
  const { role } = useAuth();
  const [data, setData] = useState<DashboardState>({
    memories: [],
    resurfacingMemories: [],
    suggestions: [],
    relationshipState: null,
    moods: [],
    questions: [],
    events: [],
    challenges: [],
    coupons: [],
    rewards: [],
  });
  const [loading, setLoading] = useState(true);
  const [daysTogether, setDaysTogether] = useState(getElapsedDays);

  useEffect(() => {
    const timer = window.setInterval(() => setDaysTogether(getElapsedDays()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      api.get('/memories'),
      api.get('/memories/resurfacing'),
      api.get('/suggestions', { params: { surface: 'home', limit: 3, forWhom: role } }),
      api.get('/relationship-state', { params: { forWhom: role } }),
      api.get('/moods'),
      api.get('/deeptalk/questions'),
      api.get('/events'),
      api.get('/challenges'),
      api.get('/coupons'),
      api.get('/rewards', { params: { forWhom: role } }),
    ])
      .then(([memoryResult, resurfacingResult, suggestionResult, relationshipStateResult, moodResult, questionResult, eventResult, challengeResult, couponResult, rewardResult]) => {
        if (!mounted) return;

        setData({
          memories: memoryResult.status === 'fulfilled' ? memoryResult.value.data.data ?? [] : [],
          resurfacingMemories: resurfacingResult.status === 'fulfilled' ? resurfacingResult.value.data.data ?? [] : [],
          suggestions: suggestionResult.status === 'fulfilled' ? suggestionResult.value.data.data ?? [] : [],
          relationshipState: relationshipStateResult.status === 'fulfilled' ? relationshipStateResult.value.data.data ?? null : null,
          moods: moodResult.status === 'fulfilled' ? moodResult.value.data.data ?? [] : [],
          questions: questionResult.status === 'fulfilled' ? questionResult.value.data.data ?? [] : [],
          events: eventResult.status === 'fulfilled' ? eventResult.value.data.data ?? [] : [],
          challenges: challengeResult.status === 'fulfilled' ? challengeResult.value.data.data ?? [] : [],
          coupons: couponResult.status === 'fulfilled' ? couponResult.value.data.data ?? [] : [],
          rewards: rewardResult.status === 'fulfilled' ? rewardResult.value.data.data ?? [] : [],
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [role]);

  const daypart = getDaypart();
  const relationshipState = data.relationshipState;

  const moodsByRole = useMemo<Record<Role, Mood | undefined>>(() => {
    const grouped: Record<Role, Mood | undefined> = {
      girlfriend: undefined,
      boyfriend: undefined,
    };

    for (const mood of data.moods) {
      const owner = resolveRole(mood.createdBy);
      if (!owner || grouped[owner]) continue;
      grouped[owner] = mood;
    }

    return grouped;
  }, [data.moods]);

  const memoriesByRole = useMemo<Record<Role, Memory | undefined>>(() => {
    const grouped: Record<Role, Memory | undefined> = {
      girlfriend: undefined,
      boyfriend: undefined,
    };

    for (const memory of data.memories) {
      const owner = resolveRole(memory.createdBy);
      if (!owner || grouped[owner]) continue;
      grouped[owner] = memory;
    }

    return grouped;
  }, [data.memories]);

  const latestAnswerByRole = useMemo<Record<Role, { question: DeepTalkQuestion; answer: DeepTalkQuestion['answers'][Role] } | null>>(() => {
    const grouped: Record<Role, { question: DeepTalkQuestion; answer: DeepTalkQuestion['answers'][Role] } | null> = {
      girlfriend: null,
      boyfriend: null,
    };

    for (const currentRole of ROLE_ORDER) {
      const question = pickLatestByTimestamp(
        data.questions.filter(item => !!item.answers?.[currentRole]?.answeredAt),
        item => item.answers[currentRole].answeredAt,
      );

      if (!question) continue;
      grouped[currentRole] = {
        question,
        answer: question.answers[currentRole],
      };
    }

    return grouped;
  }, [data.questions]);

  const latestEventByRole = useMemo<Record<Role, EventItem | undefined>>(() => ({
    girlfriend: pickLatestByTimestamp(
      data.events.filter(item => resolveRole(item.createdBy) === 'girlfriend'),
      item => item.createdAt,
    ),
    boyfriend: pickLatestByTimestamp(
      data.events.filter(item => resolveRole(item.createdBy) === 'boyfriend'),
      item => item.createdAt,
    ),
  }), [data.events]);

  const latestChallengeByRole = useMemo<Record<Role, Challenge | undefined>>(() => ({
    girlfriend: pickLatestByTimestamp(
      data.challenges.filter(item => resolveRole(item.createdBy) === 'girlfriend'),
      item => item.createdAt,
    ),
    boyfriend: pickLatestByTimestamp(
      data.challenges.filter(item => resolveRole(item.createdBy) === 'boyfriend'),
      item => item.createdAt,
    ),
  }), [data.challenges]);

  const latestCouponGiftByRole = useMemo<Record<Role, Coupon | undefined>>(() => ({
    girlfriend: pickLatestByTimestamp(
      data.coupons.filter(item => resolveRole(item.createdBy) === 'girlfriend'),
      item => item.createdAt,
    ),
    boyfriend: pickLatestByTimestamp(
      data.coupons.filter(item => resolveRole(item.createdBy) === 'boyfriend'),
      item => item.createdAt,
    ),
  }), [data.coupons]);

  const latestCouponUseByRole = useMemo<Record<Role, Coupon | undefined>>(() => ({
    girlfriend: pickLatestByTimestamp(
      data.coupons.filter((item) => {
        const giver = resolveRole(item.createdBy);
        return item.isUsed && giver ? getOppositeRole(giver) === 'girlfriend' : false;
      }),
      item => item.updatedAt ?? item.createdAt,
    ),
    boyfriend: pickLatestByTimestamp(
      data.coupons.filter((item) => {
        const giver = resolveRole(item.createdBy);
        return item.isUsed && giver ? getOppositeRole(giver) === 'boyfriend' : false;
      }),
      item => item.updatedAt ?? item.createdAt,
    ),
  }), [data.coupons]);

  const pendingQuestionsByRole = useMemo<Record<Role, DeepTalkQuestion[]>>(() => ({
    girlfriend: data.questions.filter(question => !hasAnswered(question.answers?.girlfriend)),
    boyfriend: data.questions.filter(question => !hasAnswered(question.answers?.boyfriend)),
  }), [data.questions]);

  const checkedInToday = useMemo<Record<Role, boolean>>(() => ({
    girlfriend: isToday(moodsByRole.girlfriend?.createdAt),
    boyfriend: isToday(moodsByRole.boyfriend?.createdAt),
  }), [moodsByRole]);

  const incompleteQuestionCount = useMemo(
    () => data.questions.filter(question => ROLE_ORDER.some(currentRole => !hasAnswered(question.answers?.[currentRole]))).length,
    [data.questions],
  );

  const nextUpcomingEvent = useMemo(() => {
    const upcoming = data.events
      .map(event => ({ event, daysUntil: getDaysUntil(event.date) }))
      .filter((item): item is { event: EventItem; daysUntil: number } => item.daysUntil !== null && item.daysUntil >= 0)
      .sort((left, right) => left.daysUntil - right.daysUntil);

    return upcoming[0] ?? null;
  }, [data.events]);

  const waitingCouponForCurrentRole = useMemo(
    () => pickLatestByTimestamp(
      data.coupons.filter((coupon) => {
        const giver = resolveRole(coupon.createdBy);
        return !coupon.isUsed && giver ? getOppositeRole(giver) === role : false;
      }),
      coupon => coupon.createdAt,
    ),
    [data.coupons, role],
  );

  const rewardHandoffItems = useMemo<RewardHandoffView[]>(() => {
    return data.rewards
      .filter(reward => reward.status === 'pending' || reward.status === 'revealed')
      .sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime())
      .slice(0, 2)
      .map(reward => ({
        reward,
        meta: getRewardMeta(reward),
        ...getRewardRoute(reward),
      }));
  }, [data.rewards]);

  const memoryResurfacingItems = useMemo<MemoryResurfacingView[]>(() => (
    data.resurfacingMemories
      .slice(0, 2)
      .map(buildMemoryResurfacingView)
  ), [data.resurfacingMemories]);

  const smartSuggestionItems = useMemo(
    () => data.suggestions.slice(0, 3),
    [data.suggestions],
  );

  const handleRewardOpen = (reward: Reward) => {
    if (reward.status !== 'pending') return;

    setData(current => ({
      ...current,
      rewards: current.rewards.map(item =>
        item._id === reward._id
          ? {
              ...item,
              status: 'revealed',
              openedAt: new Date().toISOString(),
            }
          : item,
      ),
    }));

    void api.patch(`/rewards/${reward._id}/status`, { status: 'revealed' });
  };

  const handleMemoryResurfacingOpen = (item: MemoryResurfacingItem) => {
    setData(current => ({
      ...current,
      resurfacingMemories: current.resurfacingMemories.filter(candidate => candidate.memory._id !== item.memory._id),
    }));

    void api.post(`/memories/${item.memory._id}/resurfacing/mark`, { reason: item.reason }).catch(() => undefined);
  };

  const roleSummaries = useMemo<RoleSummary[]>(() => (
    ROLE_ORDER.map(currentRole => {
      const latestMood = moodsByRole[currentRole];
      const latestMemory = memoriesByRole[currentRole];
      const latestAnswer = latestAnswerByRole[currentRole];
      const latestEvent = latestEventByRole[currentRole];
      const latestChallenge = latestChallengeByRole[currentRole];
      const latestGift = latestCouponGiftByRole[currentRole];
      const latestUsedVoucher = latestCouponUseByRole[currentRole];
      const pendingCount = pendingQuestionsByRole[currentRole].length;
      const relationshipPerson = relationshipState?.people[currentRole];
      const relationshipMood = relationshipPerson?.today.mood;
      const relationshipAction = relationshipPerson?.today.actions[0];
      const relationshipSignal = relationshipPerson?.signals[0];

      const activityCandidates: Array<{ timestamp?: string; label: string; meta: string; to: string }> = [];

      if (latestMood) {
        activityCandidates.push({
          timestamp: latestMood.createdAt,
          label: `Vừa ghi cảm xúc ${latestMood.mood.toLowerCase()}`,
          meta: latestMood.note ? latestMood.note : `Cập nhật ${formatRelative(latestMood.createdAt)}`,
          to: '/mood',
        });
      }

      if (latestMemory) {
        activityCandidates.push({
          timestamp: latestMemory.createdAt ?? latestMemory.date,
          label: `Vừa lưu kỷ niệm "${latestMemory.title}"`,
          meta: latestMemory.content,
          to: '/timeline',
        });
      }

      if (latestAnswer) {
        activityCandidates.push({
          timestamp: latestAnswer.answer.answeredAt,
          label: latestAnswer.answer.isInPerson ? 'Vừa đánh dấu đã nói ngoài đời' : 'Vừa trả lời một câu hỏi',
          meta: latestAnswer.question.content,
          to: '/deeptalk',
        });
      }

      if (latestEvent) {
        activityCandidates.push({
          timestamp: latestEvent.createdAt,
          label: `Vừa ghim ngày "${latestEvent.title}"`,
          meta: getEventReminderCopy(latestEvent),
          to: '/events',
        });
      }

      if (latestChallenge) {
        activityCandidates.push({
          timestamp: latestChallenge.createdAt,
          label: `Vừa mở challenge "${latestChallenge.title}"`,
          meta: getChallengeDirectionLabel(latestChallenge),
          to: '/challenges',
        });
      }

      if (latestGift) {
        const recipient = getOppositeRole(currentRole);
        activityCandidates.push({
          timestamp: latestGift.createdAt,
          label: `Vừa để lại voucher "${latestGift.title}"`,
          meta: `Dành cho ${ROLE_NAME[recipient]}`,
          to: '/coupons',
        });
      }

      if (latestUsedVoucher) {
        const giver = resolveRole(latestUsedVoucher.createdBy);
        activityCandidates.push({
          timestamp: latestUsedVoucher.updatedAt ?? latestUsedVoucher.createdAt,
          label: `Vừa dùng voucher "${latestUsedVoucher.title}"`,
          meta: giver ? `Tấm vé từ ${ROLE_NAME[giver]}` : 'Một voucher vừa được dùng',
          to: '/coupons',
        });
      }

      const latestActivity = pickLatestByTimestamp(activityCandidates, candidate => candidate.timestamp);
      const hasOwnCheckIn = relationshipPerson?.today.hasMoodCheckIn ?? checkedInToday[currentRole];

      return {
        role: currentRole,
        title: `Hôm nay của ${ROLE_NAME[currentRole]}`,
        checkedInToday: hasOwnCheckIn,
        moodValue: relationshipMood?.value ?? (latestMood ? latestMood.mood : 'Còn mở ghi cảm xúc riêng'),
        moodMeta: relationshipPerson
          ? relationshipPerson.summary
          : latestMood
          ? `${hasOwnCheckIn ? 'Đã có nhịp hôm nay' : 'Lần gần nhất'} · ${formatRelative(latestMood.createdAt)}${latestMood.note ? ` · ${latestMood.note}` : ''}`
          : `Chưa có nhịp nào từ ${ROLE_NAME[currentRole]} hôm nay.`,
        recentLabel: relationshipAction?.label ?? (latestActivity ? latestActivity.label : `Chưa có cập nhật riêng gần đây từ ${ROLE_NAME[currentRole]}.`),
        recentMeta: relationshipAction
          ? `${relationshipAction.source.label} · ${formatRelative(relationshipAction.at)}`
          : latestActivity
            ? latestActivity.meta
            : 'Chưa có hoạt động mới từ phía này.',
        waitingLabel: relationshipSignal?.title ?? (pendingCount > 0
          ? `${pendingCount} câu hỏi đang mở cho ${ROLE_NAME[currentRole]}.`
          : hasOwnCheckIn
            ? `Phía ${ROLE_NAME[currentRole]} đang khá yên cho hôm nay.`
            : `Mọi thứ đang khá yên từ phía ${ROLE_NAME[currentRole]} hôm nay.`),
        actionTo: relationshipSignal?.cta?.to ?? (!hasOwnCheckIn ? '/mood' : pendingCount > 0 ? '/deeptalk' : latestActivity?.to ?? '/mood'),
        actionLabel: relationshipSignal?.cta?.label ?? (!hasOwnCheckIn ? 'Ghi một nhịp ngắn' : pendingCount > 0 ? 'Mở Deep Talk' : latestActivity?.to === '/timeline' ? 'Xem kỷ niệm' : 'Mở đúng chỗ'),
      };
    })
  ), [
    checkedInToday,
    latestAnswerByRole,
    latestChallengeByRole,
    latestCouponGiftByRole,
    latestCouponUseByRole,
    latestEventByRole,
    memoriesByRole,
    moodsByRole,
    pendingQuestionsByRole,
    relationshipState,
  ]);

  const sharedPendingItems = useMemo<SharedPendingItem[]>(() => {
    if (relationshipState) {
      const backendSignals = [
        relationshipState.nextStep,
        ...ROLE_ORDER.flatMap(currentRole => relationshipState.people[currentRole].signals),
        ...relationshipState.shared.signals,
      ].filter((signal): signal is RelationshipStateSignal => Boolean(signal));

      const seen = new Set<string>();
      return backendSignals
        .flatMap((signal) => {
          if (seen.has(signal.id)) return [];
          seen.add(signal.id);
          const item = buildSharedPendingItemFromSignal(signal);
          return item ? [item] : [];
        })
        .slice(0, 4);
    }

    const items: SharedPendingItem[] = [];

    for (const currentRole of ROLE_ORDER) {
      if (!checkedInToday[currentRole]) {
        items.push({
          key: `mood-${currentRole}`,
          title: `Một ghi cảm xúc nhẹ còn mở cho ${ROLE_NAME[currentRole]}`,
          detail: 'Chỉ cần một dòng ngắn là đủ.',
          to: '/mood',
        });
      }
    }

    for (const currentRole of ROLE_ORDER) {
      const pendingQuestion = pendingQuestionsByRole[currentRole][0];
      if (!pendingQuestion) continue;
      items.push({
        key: `question-${currentRole}`,
        title: `${pendingQuestionsByRole[currentRole].length} câu hỏi đang mở cho ${ROLE_NAME[currentRole]}`,
        detail: pendingQuestion.content,
        to: '/deeptalk',
      });
    }

    if (nextUpcomingEvent && nextUpcomingEvent.daysUntil <= 7) {
      items.push({
        key: `event-${nextUpcomingEvent.event._id}`,
        title: `"${nextUpcomingEvent.event.title}" đang tới gần`,
        detail: getEventReminderCopy(nextUpcomingEvent.event),
        to: '/events',
      });
    }

    if (waitingCouponForCurrentRole) {
      const giver = resolveRole(waitingCouponForCurrentRole.createdBy);
      items.push({
        key: `coupon-${waitingCouponForCurrentRole._id}`,
        title: giver
          ? `${ROLE_NAME[giver]} để sẵn một voucher cho ${ROLE_NAME[role]}`
          : 'Có một voucher đang chờ.',
        detail: waitingCouponForCurrentRole.description || waitingCouponForCurrentRole.title,
        to: '/coupons',
      });
    }

    return items.slice(0, 4);
  }, [checkedInToday, nextUpcomingEvent, pendingQuestionsByRole, relationshipState, role, waitingCouponForCurrentRole]);

  const nextStep = useMemo<NextStepView>(() => {
    const backendNextStep = buildRelationshipNextStep(relationshipState?.nextStep);
    if (backendNextStep) return backendNextStep;

    const myPendingQuestion = pendingQuestionsByRole[role][0];
    const myLatestMemory = memoriesByRole[role];

    if (!checkedInToday[role]) {
      return {
        to: '/mood',
        title: `Đặt một nhịp ngắn cho hôm nay của ${ROLE_NAME[role]}`,
        detail: 'Chỉ cần một dòng ngắn là đủ để bắt đầu hôm nay.',
        button: 'Ghi cảm xúc',
        icon: <Sparkles size={18} />,
      };
    }

    if (myPendingQuestion) {
      return {
        to: '/deeptalk',
        title: `Tiếp tục câu hỏi đang mở cho ${ROLE_NAME[role]}`,
        detail: myPendingQuestion.content,
        button: 'Tiếp tục Deep Talk',
        icon: <MessageCircleHeart size={18} />,
      };
    }

    if (waitingCouponForCurrentRole) {
      const giver = resolveRole(waitingCouponForCurrentRole.createdBy);
      return {
        to: '/coupons',
        title: giver
          ? `Mở voucher ${ROLE_NAME[giver]} để dành cho ${ROLE_NAME[role]}`
          : 'Có một voucher đang đợi bạn mở ra',
        detail: waitingCouponForCurrentRole.description || waitingCouponForCurrentRole.title,
        button: 'Mở ví voucher',
        icon: <Ticket size={18} />,
      };
    }

    if (nextUpcomingEvent && nextUpcomingEvent.daysUntil <= 5) {
      return {
        to: '/events',
        title: `Chuẩn bị cho "${nextUpcomingEvent.event.title}"`,
        detail: getEventReminderCopy(nextUpcomingEvent.event),
        button: 'Xem ngày đã ghim',
        icon: <CalendarDays size={18} />,
      };
    }

    if (!myLatestMemory) {
      return {
        to: '/timeline',
        title: `Lưu lại một kỷ niệm từ góc của ${ROLE_NAME[role]}`,
        detail: 'Không cần một dịp lớn. Chỉ một khoảnh khắc đủ muốn nhớ lại cũng làm Home ấm lên.',
        button: 'Ghi kỷ niệm',
        icon: <NotebookPen size={18} />,
      };
    }

    return {
      to: '/timeline',
      title: 'Xem lại một điều vừa được giữ lại',
      detail: `Kỷ niệm gần nhất: "${myLatestMemory.title}". Mở ra nếu còn muốn thêm gì.`,
      button: 'Mở timeline',
      icon: <CalendarDays size={18} />,
    };
  }, [checkedInToday, memoriesByRole, nextUpcomingEvent, pendingQuestionsByRole, relationshipState, role, waitingCouponForCurrentRole]);

  const pulseItems = useMemo(() => {
    const girlfriendState = relationshipState?.people.girlfriend;
    const boyfriendState = relationshipState?.people.boyfriend;
    const items = [
      girlfriendState
        ? girlfriendState.today.mood
          ? `Ni đang ${girlfriendState.today.mood.value.toLowerCase()}`
          : 'Ni còn mở ghi cảm xúc nhẹ'
        : checkedInToday.girlfriend && moodsByRole.girlfriend
          ? `Ni đang ${moodsByRole.girlfriend.mood.toLowerCase()}`
          : 'Ni còn mở ghi cảm xúc nhẹ',
      boyfriendState
        ? boyfriendState.today.mood
          ? `Được đang ${boyfriendState.today.mood.value.toLowerCase()}`
          : 'Được còn mở ghi cảm xúc nhẹ'
        : checkedInToday.boyfriend && moodsByRole.boyfriend
          ? `Được đang ${moodsByRole.boyfriend.mood.toLowerCase()}`
          : 'Được còn mở ghi cảm xúc nhẹ',
      incompleteQuestionCount > 0
        ? `${incompleteQuestionCount} câu hỏi đang chờ`
        : 'Deep Talk đang khá yên',
    ];

    if (rewardHandoffItems.length > 0) {
      items.push(rewardHandoffItems[0].reward.status === 'pending' ? 'Có một điều vừa mở ra' : 'Có một nhịp mới vẫn đang để đây');
    } else if (memoryResurfacingItems.length > 0) {
      items.push('Một kỷ niệm cũ đang quay lại');
    } else if (smartSuggestionItems.length > 0) {
      items.push('Có một gợi ý nhẹ từ dữ liệu thật');
    } else if (nextUpcomingEvent && nextUpcomingEvent.daysUntil <= 7) {
      items.push(
        nextUpcomingEvent.daysUntil === 0
          ? `"${nextUpcomingEvent.event.title}" là hôm nay`
          : `"${nextUpcomingEvent.event.title}" còn ${nextUpcomingEvent.daysUntil} ngày`,
      );
    } else if (waitingCouponForCurrentRole) {
      items.push('Có một voucher đang chờ được mở');
    }

    return items;
  }, [checkedInToday, incompleteQuestionCount, memoryResurfacingItems, moodsByRole, nextUpcomingEvent, relationshipState, rewardHandoffItems, smartSuggestionItems, waitingCouponForCurrentRole]);

  const recentFeed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [
      ...data.moods.map<FeedItem>((mood) => {
        const owner = resolveRole(mood.createdBy);
        return {
          key: `mood-${mood.createdAt ?? mood.mood}`,
          role: owner,
          title: owner ? `${ROLE_NAME[owner]} vừa ghi ${mood.mood.toLowerCase()}` : 'Một cảm xúc vừa được ghi lại',
          detail: mood.note ? mood.note : 'Một nhịp cảm xúc vừa được ghi lại.',
          meta: `${formatRelative(mood.createdAt)} · Cảm xúc`,
          to: '/mood',
          timestamp: mood.createdAt,
        };
      }),
      ...data.questions.flatMap(question =>
        ROLE_ORDER
          .filter(currentRole => !!question.answers?.[currentRole]?.answeredAt)
          .map<FeedItem>((currentRole) => ({
            key: `answer-${question._id}-${currentRole}-${question.answers[currentRole]?.answeredAt ?? 'legacy'}`,
            role: currentRole,
            title: question.answers[currentRole]?.isInPerson
              ? `${ROLE_NAME[currentRole]} vừa đánh dấu đã nói ngoài đời`
              : `${ROLE_NAME[currentRole]} vừa trả lời một câu hỏi`,
            detail: question.content,
            meta: `${formatRelative(question.answers[currentRole]?.answeredAt)} · Deep Talk`,
            to: '/deeptalk',
            timestamp: question.answers[currentRole]?.answeredAt,
          })),
      ),
      ...data.memories.map<FeedItem>((memory) => {
        const owner = resolveRole(memory.createdBy);
        return {
          key: `memory-${memory.createdAt ?? memory._id}`,
          role: owner,
          title: owner ? `${ROLE_NAME[owner]} vừa lưu một kỷ niệm` : 'Một kỷ niệm cũ vẫn đang được giữ ở đây',
          detail: memory.title,
          meta: `${formatRelative(memory.createdAt ?? memory.date)} · Timeline`,
          to: '/timeline',
          timestamp: memory.createdAt ?? memory.date,
        };
      }),
      ...data.events.map<FeedItem>((event) => {
        const creator = resolveRole(event.createdBy);
        return {
          key: `event-${event._id}`,
          role: creator,
          title: creator ? `${ROLE_NAME[creator]} vừa ghim ngày "${event.title}"` : 'Một ngày quan trọng vừa được ghim lại',
          detail: getEventReminderCopy(event),
          meta: `${formatRelative(event.createdAt)} · Sự kiện`,
          to: '/events',
          timestamp: event.createdAt,
        };
      }),
      ...data.challenges.map<FeedItem>((challenge) => {
        const creator = resolveRole(challenge.createdBy);
        return {
          key: `challenge-${challenge._id}`,
          role: creator,
          title: creator ? `${ROLE_NAME[creator]} vừa mở challenge "${challenge.title}"` : 'Một challenge vừa được giữ lại',
          detail: getChallengeDirectionLabel(challenge),
          meta: `${formatRelative(challenge.createdAt)} · Challenge`,
          to: '/challenges',
          timestamp: challenge.createdAt,
        };
      }),
      ...data.coupons.map<FeedItem>((coupon) => {
        const giver = resolveRole(coupon.createdBy);
        const receiver = giver ? getOppositeRole(giver) : null;
        const usedTimestamp = coupon.updatedAt ?? coupon.createdAt;

        if (coupon.isUsed) {
          return {
            key: `coupon-used-${coupon._id}`,
            role: receiver,
            title: receiver ? `${ROLE_NAME[receiver]} vừa dùng voucher "${coupon.title}"` : 'Một voucher vừa được dùng',
            detail: giver ? `Tấm vé từ ${ROLE_NAME[giver]}` : coupon.description || 'Một lời hứa vừa được chạm tới.',
            meta: `${formatRelative(usedTimestamp)} · Voucher`,
            to: '/coupons',
            timestamp: usedTimestamp,
          };
        }

        return {
          key: `coupon-${coupon._id}`,
          role: giver,
          title: giver ? `${ROLE_NAME[giver]} vừa để lại voucher "${coupon.title}"` : 'Một voucher mới vừa được để lại',
          detail: receiver ? `Dành cho ${ROLE_NAME[receiver]}` : coupon.description || 'Một đặc quyền nhỏ đang chờ đúng người.',
          meta: `${formatRelative(coupon.createdAt)} · Voucher`,
          to: '/coupons',
          timestamp: coupon.createdAt,
        };
      }),
    ];

    return items
      .filter(item => !!item.timestamp)
      .sort((left, right) => new Date(right.timestamp ?? 0).getTime() - new Date(left.timestamp ?? 0).getTime())
      .slice(0, 6);
  }, [data.challenges, data.coupons, data.events, data.memories, data.moods, data.questions]);

  return (
    <div className="page-container space-y-5 md:space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`surface-card-strong overflow-hidden bg-gradient-to-br ${roleCopy[role].accent} p-5 md:p-8`}
      >
        <div className="grid gap-5 md:grid-cols-[1.3fr_0.9fr] md:gap-8">
          <div>
            <p className="section-label">{roleCopy[role].eyebrow}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PersonBadge role={role} prefix="Góc của" variant="solid" />
              <span className="chip bg-white/85 text-soft">{ROLE_CORNER_LABEL[role]}</span>
              <span className="chip bg-white/85 text-soft">{daysTogether} ngày đi cùng nhau</span>
            </div>
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[0.95] text-ink md:text-6xl">{roleCopy[role].title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-soft md:text-base">{roleCopy[role].subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={nextStep.to} className="btn-primary">
                {nextStep.icon}
                {nextStep.button}
              </Link>
              <Link to="/timeline" className="btn-secondary">
                <CalendarDays size={16} />
                Xem dòng kỷ niệm
              </Link>
            </div>
          </div>

          <div className="rounded-[1.7rem] bg-white/82 p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
              {daypart.icon}
              <span>{daypart.label}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-soft">{daypart.note}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {pulseItems.map(item => (
                <span key={item} className="rounded-full bg-[#fcf7fa] px-3 py-1.5 text-xs font-bold text-soft ring-1 ring-rose-100">
                  {item}
                </span>
              ))}
            </div>
            {loading && (
              <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-soft">
                <Loader2 size={14} className="animate-spin" />
                Đang sắp lại nhịp hôm nay...
              </div>
            )}
          </div>
        </div>
      </motion.section>

      <ExpenseHomeWidget />

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-card p-5 md:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="section-label">Hôm nay</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Hôm nay của hai người</h2>
            </div>
            {loading && <span className="text-xs font-bold text-soft">Đang làm mới...</span>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {roleSummaries.map(summary => (
              <TodayRoleCard key={summary.role} summary={summary} currentRole={role} loading={loading} />
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {relationshipState && (
            <RelationshipStatePanel state={relationshipState} currentRole={role} />
          )}

          {rewardHandoffItems.length > 0 && (
            <div className="surface-card p-5 md:p-6">
              <p className="section-label">Vừa mở ra</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Một nhịp nhỏ đáng đi tiếp</h2>
              <p className="mt-2 text-sm leading-6 text-soft">
                Điều vừa được mở ra sau khi hai người khép lại một việc cùng nhau.
              </p>
              <div className="mt-5 space-y-3">
                {rewardHandoffItems.map(item => (
                  <RewardHandoffCard key={item.reward._id} item={item} onOpen={handleRewardOpen} />
                ))}
              </div>
            </div>
          )}

          {memoryResurfacingItems.length > 0 && (
            <div className="surface-card p-5 md:p-6">
              <p className="section-label">Kỷ niệm quay lại</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Một khoảnh khắc cũ vừa đúng lúc</h2>
              <p className="mt-2 text-sm leading-6 text-soft">
                Một kỷ niệm cũ vừa quay lại đúng ngày hoặc đúng dấu ghim. Không cần làm gì, chỉ mở nếu muốn nhìn lại.
              </p>
              <div className="mt-5 space-y-3">
                {memoryResurfacingItems.map(item => (
                  <MemoryResurfacingCard key={`${item.item.memory._id}-${item.item.reason}`} item={item} onOpen={handleMemoryResurfacingOpen} />
                ))}
              </div>
            </div>
          )}

          {smartSuggestionItems.length > 0 && (
            <div className="surface-card p-5 md:p-6">
              <p className="section-label">Gợi ý nhẹ</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Một hướng đi tiếp từ dữ liệu thật</h2>
              <p className="mt-2 text-sm leading-6 text-soft">
                Vài bước nhỏ từ những gì hai người đang có. Chọn hoặc bỏ qua, không bắt buộc.
              </p>
              <div className="mt-5 space-y-3">
                {smartSuggestionItems.map(item => (
                  <SmartSuggestionCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          <div className="surface-card p-5 md:p-6">
            <p className="section-label">Điều đang chờ giữa hai người</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Những chỗ còn dang dở</h2>
            {sharedPendingItems.length === 0 ? (
              <ContextualEmptyState
                layout="inline"
                className="mt-5"
                icon={<MessageCircleHeart size={18} />}
                title="Hiện chưa có điều gì cần kéo hai người đi ngay"
                description="Khu này chỉ giữ những việc đáng nhắc thật: ghi cảm xúc còn bỏ ngỏ, câu Deep Talk đang mở, ngày sắp tới, hoặc voucher đang chờ đúng người."
                action={{ label: nextStep.button, to: nextStep.to, variant: 'secondary' }}
              />
            ) : (
              <div className="mt-5 space-y-3">
                {sharedPendingItems.map(item => (
                  <Link key={item.key} to={item.to} className="card-hover block rounded-[1.35rem] bg-[#fcf7fa] p-4">
                    <p className="text-sm font-bold text-ink">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-soft">{item.detail}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="surface-card p-5 md:p-6">
            <p className="section-label">Một bước tiếp theo</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Chỉ một việc nổi bật nhất</h2>
            <div className="mt-5 rounded-[1.6rem] bg-gradient-to-br from-rose-50 to-white p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">{nextStep.icon}</div>
              <p className="mt-4 text-xl font-black text-ink">{nextStep.title}</p>
              <p className="mt-2 text-sm leading-6 text-soft">{nextStep.detail}</p>
              <Link to={nextStep.to} className="btn-primary mt-5">
                {nextStep.button}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card p-5 md:p-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="section-label">Vừa rồi</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Một luồng ngắn để biết ai vừa chạm vào điều gì</h2>
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-soft">Chạm để mở đúng chỗ</span>
        </div>

        {recentFeed.length === 0 ? (
          <ContextualEmptyState
            layout="inline"
            icon={<NotebookPen size={18} />}
            title="Hôm nay luồng này vẫn còn trống"
            description="Khi hai người ghi cảm xúc, trả lời câu hỏi, lưu kỷ niệm, hoặc dùng voucher, luồng này sẽ hiện lại theo thứ tự."
            action={{ label: nextStep.button, to: nextStep.to, variant: 'secondary' }}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {recentFeed.map(item => (
              <FeedRow key={item.key} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
