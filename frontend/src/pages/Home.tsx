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
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';
import PersonBadge from '../components/PersonBadge';
import { useAuth } from '../context/AuthContext';
import { ROLE_CORNER_LABEL, ROLE_NAME, isRole, type Role } from '../constants/roles';

type Memory = {
  _id: string;
  title: string;
  date: string;
  content: string;
  media?: string[];
  mood?: string;
  createdAt?: string;
  createdBy?: Role;
};

type Mood = {
  mood: string;
  note?: string;
  createdAt?: string;
  createdBy?: Role;
};

type DeepTalkQuestion = {
  _id: string;
  content: string;
  createdAt?: string;
  answers: Record<Role, { text?: string; isInPerson?: boolean; answeredAt?: string }>;
};

type DashboardState = {
  memories: Memory[];
  moods: Mood[];
  questions: DeepTalkQuestion[];
};

type RoleSummary = {
  role: Role;
  title: string;
  checkedInToday: boolean;
  moodValue: string;
  moodMeta: string;
  recentLabel: string;
  recentMeta: string;
  waitingLabel: string;
  actionTo: string;
  actionLabel: string;
};

type SharedPendingItem = {
  key: string;
  title: string;
  detail: string;
  to: string;
};

type FeedItem = {
  key: string;
  role: Role | null;
  title: string;
  detail: string;
  meta: string;
  to: string;
  timestamp?: string;
};

type Daypart = {
  label: string;
  note: string;
  icon: React.ReactNode;
};

const ROLE_ORDER: Role[] = ['girlfriend', 'boyfriend'];
const START_DATE = new Date(2026, 1, 7, 20, 46, 0);

const roleCopy: Record<Role, { eyebrow: string; title: string; subtitle: string; accent: string }> = {
  girlfriend: {
    eyebrow: 'Home của Ni',
    title: 'Mở ra là thấy hôm nay của cả hai đang ở đâu.',
    subtitle: 'Trang chủ cần giữ riêng góc của bạn, nhưng vẫn cho thấy điều gì đang chờ giữa hai người để không còn cảm giác một khối chung mơ hồ.',
    accent: 'from-pink-100 via-rose-50 to-white',
  },
  boyfriend: {
    eyebrow: 'Home của Được',
    title: 'Thấy rõ nhịp của từng người rồi mới quyết định bước tiếp theo.',
    subtitle: 'Home giờ nên dẫn lại đúng ngữ cảnh: ai vừa cập nhật gì, phía nào còn đang chờ, và việc nào đáng làm nhất ngay lúc này.',
    accent: 'from-sky-100 via-white to-rose-50',
  },
};

const roleSurfaceTone: Record<Role, string> = {
  girlfriend: 'bg-[#fff7fb] ring-pink-100',
  boyfriend: 'bg-[#f7fbff] ring-sky-100',
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
      note: 'Một lần mở app là đủ thấy phía nào vừa cập nhật, phía nào còn đang chờ.',
      icon: <Sunset size={16} />,
    };
  }

  return {
    label: 'Buổi tối là lúc kéo nhau quay lại đúng chỗ',
    note: 'Home nên giúp hai người tiếp tục câu chuyện đang dở, không phải nhìn một bảng số liệu.',
    icon: <MoonStar size={16} />,
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
              prefix={isCurrentRole ? 'Bạn đang là' : 'Góc của'}
              variant={isCurrentRole ? 'solid' : 'soft'}
            />
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            summary.checkedInToday ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'
          }`}
        >
          {summary.checkedInToday ? 'Đã check-in hôm nay' : 'Chưa check-in hôm nay'}
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

const FeedRow: React.FC<{ item: FeedItem }> = ({ item }) => (
  <Link to={item.to} className="card-hover flex items-start justify-between gap-4 rounded-[1.35rem] bg-[#fcfafb] p-4">
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        {item.role ? (
          <PersonBadge role={item.role} showIcon={false} />
        ) : (
          <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-600 ring-1 ring-stone-200">
            Bản ghi cũ chưa rõ người
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

const Home: React.FC = () => {
  const { role } = useAuth();
  const [data, setData] = useState<DashboardState>({ memories: [], moods: [], questions: [] });
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
      api.get('/moods'),
      api.get('/deeptalk/questions'),
    ])
      .then(([memoryResult, moodResult, questionResult]) => {
        if (!mounted) return;

        setData({
          memories: memoryResult.status === 'fulfilled' ? memoryResult.value.data.data ?? [] : [],
          moods: moodResult.status === 'fulfilled' ? moodResult.value.data.data ?? [] : [],
          questions: questionResult.status === 'fulfilled' ? questionResult.value.data.data ?? [] : [],
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const daypart = getDaypart();

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

  const roleSummaries = useMemo<RoleSummary[]>(() => (
    ROLE_ORDER.map(currentRole => {
      const latestMood = moodsByRole[currentRole];
      const latestMemory = memoriesByRole[currentRole];
      const latestAnswer = latestAnswerByRole[currentRole];
      const pendingCount = pendingQuestionsByRole[currentRole].length;

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

      const latestActivity = pickLatestByTimestamp(activityCandidates, candidate => candidate.timestamp);
      const hasOwnCheckIn = checkedInToday[currentRole];

      return {
        role: currentRole,
        title: `Hôm nay của ${ROLE_NAME[currentRole]}`,
        checkedInToday: hasOwnCheckIn,
        moodValue: latestMood ? latestMood.mood : 'Chưa có check-in riêng',
        moodMeta: latestMood
          ? `${hasOwnCheckIn ? 'Đã có nhịp hôm nay' : 'Lần gần nhất'} · ${formatRelative(latestMood.createdAt)}${latestMood.note ? ` · ${latestMood.note}` : ''}`
          : `Home vẫn giữ chỗ cho nhịp của ${ROLE_NAME[currentRole]} kể cả khi hôm nay chưa có dữ liệu.`,
        recentLabel: latestActivity ? latestActivity.label : `Chưa có cập nhật riêng gần đây từ ${ROLE_NAME[currentRole]}.`,
        recentMeta: latestActivity ? latestActivity.meta : 'Khi có mood, Deep Talk hoặc kỷ niệm mới, phần này sẽ hiện đúng phía của người đó.',
        waitingLabel: pendingCount > 0
          ? `${pendingCount} câu hỏi vẫn đang chờ phần của ${ROLE_NAME[currentRole]}.`
          : hasOwnCheckIn
            ? `Phía ${ROLE_NAME[currentRole]} đang khá yên cho hôm nay.`
            : `${ROLE_NAME[currentRole]} vẫn chưa check-in hôm nay.`,
        actionTo: !hasOwnCheckIn ? '/mood' : pendingCount > 0 ? '/deeptalk' : latestActivity?.to ?? '/mood',
        actionLabel: !hasOwnCheckIn ? 'Ghi cảm xúc ngay' : pendingCount > 0 ? 'Mở Deep Talk' : latestActivity?.to === '/timeline' ? 'Xem kỷ niệm' : 'Xem thêm',
      };
    })
  ), [checkedInToday, latestAnswerByRole, memoriesByRole, moodsByRole, pendingQuestionsByRole]);

  const sharedPendingItems = useMemo<SharedPendingItem[]>(() => {
    const items: SharedPendingItem[] = [];

    for (const currentRole of ROLE_ORDER) {
      if (!checkedInToday[currentRole]) {
        items.push({
          key: `mood-${currentRole}`,
          title: `${ROLE_NAME[currentRole]} chưa check-in hôm nay`,
          detail: 'Chỉ một dòng ngắn cũng đủ để Home hiểu hôm nay phía này đang thế nào.',
          to: '/mood',
        });
      }
    }

    for (const currentRole of ROLE_ORDER) {
      const pendingQuestion = pendingQuestionsByRole[currentRole][0];
      if (!pendingQuestion) continue;
      items.push({
        key: `question-${currentRole}`,
        title: `${pendingQuestionsByRole[currentRole].length} câu hỏi đang chờ phần của ${ROLE_NAME[currentRole]}`,
        detail: pendingQuestion.content,
        to: '/deeptalk',
      });
    }

    return items.slice(0, 4);
  }, [checkedInToday, pendingQuestionsByRole]);

  const nextStep = useMemo(() => {
    const myPendingQuestion = pendingQuestionsByRole[role][0];
    const myLatestMemory = memoriesByRole[role];

    if (!checkedInToday[role]) {
      return {
        to: '/mood',
        title: `Ghi cảm xúc của ${ROLE_NAME[role]} cho hôm nay`,
        detail: 'Home đang giữ sẵn chỗ cho check-in của bạn để nhịp hôm nay không bị trôi qua mơ hồ.',
        button: 'Ghi cảm xúc',
        icon: <Sparkles size={18} />,
      };
    }

    if (myPendingQuestion) {
      return {
        to: '/deeptalk',
        title: `Tiếp tục câu hỏi đang chờ ${ROLE_NAME[role]}`,
        detail: myPendingQuestion.content,
        button: 'Tiếp tục Deep Talk',
        icon: <MessageCircleHeart size={18} />,
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
      detail: `Kỷ niệm gần nhất từ phía bạn là "${myLatestMemory.title}". Nếu còn điều gì muốn thêm, đây là chỗ quay lại nhanh nhất.`,
      button: 'Mở timeline',
      icon: <CalendarDays size={18} />,
    };
  }, [checkedInToday, memoriesByRole, pendingQuestionsByRole, role]);

  const pulseItems = useMemo(() => [
    checkedInToday.girlfriend && moodsByRole.girlfriend
      ? `Ni đang ${moodsByRole.girlfriend.mood.toLowerCase()}`
      : 'Ni chưa check-in',
    checkedInToday.boyfriend && moodsByRole.boyfriend
      ? `Được đang ${moodsByRole.boyfriend.mood.toLowerCase()}`
      : 'Được chưa check-in',
    incompleteQuestionCount > 0
      ? `${incompleteQuestionCount} câu hỏi đang chờ`
      : 'Deep Talk đang khá yên',
  ], [checkedInToday, incompleteQuestionCount, moodsByRole]);

  const recentFeed = useMemo<FeedItem[]>(() => {
    const latestMood = data.moods[0];
    const moodOwner = resolveRole(latestMood?.createdBy);

    const latestMemory = data.memories[0];
    const memoryOwner = resolveRole(latestMemory?.createdBy);

    const latestAnsweredByAnyone = pickLatestByTimestamp(
      data.questions.flatMap(question =>
        ROLE_ORDER
          .filter(currentRole => !!question.answers?.[currentRole]?.answeredAt)
          .map(currentRole => ({
            question,
            role: currentRole,
            answer: question.answers[currentRole],
          })),
      ),
      item => item.answer.answeredAt,
    );

    const items: FeedItem[] = [];

    if (latestMood) {
      items.push({
        key: `mood-${latestMood.createdAt ?? latestMood.mood}`,
        role: moodOwner,
        title: moodOwner ? `${ROLE_NAME[moodOwner]} vừa ghi ${latestMood.mood.toLowerCase()}` : 'Một check-in vừa được giữ lại',
        detail: latestMood.note ? latestMood.note : 'Mood mới sẽ hiện đúng phía của người ghi thay vì dồn vào một luồng chung.',
        meta: `${formatRelative(latestMood.createdAt)} · Cảm xúc`,
        to: '/mood',
        timestamp: latestMood.createdAt,
      });
    }

    if (latestAnsweredByAnyone) {
      items.push({
        key: `answer-${latestAnsweredByAnyone.answer.answeredAt ?? latestAnsweredByAnyone.question._id}`,
        role: latestAnsweredByAnyone.role,
        title: latestAnsweredByAnyone.answer.isInPerson
          ? `${ROLE_NAME[latestAnsweredByAnyone.role]} vừa đánh dấu đã nói ngoài đời`
          : `${ROLE_NAME[latestAnsweredByAnyone.role]} vừa trả lời một câu hỏi`,
        detail: latestAnsweredByAnyone.question.content,
        meta: `${formatRelative(latestAnsweredByAnyone.answer.answeredAt)} · Deep Talk`,
        to: '/deeptalk',
        timestamp: latestAnsweredByAnyone.answer.answeredAt,
      });
    }

    if (latestMemory) {
      items.push({
        key: `memory-${latestMemory.createdAt ?? latestMemory._id}`,
        role: memoryOwner,
        title: memoryOwner ? `${ROLE_NAME[memoryOwner]} vừa lưu một kỷ niệm` : 'Một kỷ niệm cũ vẫn đang được giữ ở đây',
        detail: latestMemory.title,
        meta: `${formatRelative(latestMemory.createdAt ?? latestMemory.date)} · Timeline`,
        to: '/timeline',
        timestamp: latestMemory.createdAt ?? latestMemory.date,
      });
    }

    return items
      .sort((left, right) => new Date(right.timestamp ?? 0).getTime() - new Date(left.timestamp ?? 0).getTime())
      .slice(0, 4);
  }, [data.memories, data.moods, data.questions]);

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
              <PersonBadge role={role} prefix="Bạn đang ở" variant="solid" />
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

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-card p-5 md:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="section-label">Hôm nay</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Hai nhịp tách rõ, không còn một khối chung</h2>
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
          <div className="surface-card p-5 md:p-6">
            <p className="section-label">Điều đang chờ giữa hai người</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Những chỗ còn dang dở</h2>
            {sharedPendingItems.length === 0 ? (
              <div className="mt-5 rounded-[1.5rem] bg-[#fcf7fa] p-4 text-sm leading-6 text-soft">
                Hôm nay chưa có gì quá gấp. Giao diện vẫn giữ hai phía tách riêng để khi có điều mới, bạn nhìn vào là biết nó thuộc về ai.
              </div>
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
            <p className="section-label">Gần đây</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Một luồng ngắn để thấy app vẫn đang sống</h2>
          </div>
          <Link to="/timeline" className="text-sm font-bold text-primary">
            Xem thêm
          </Link>
        </div>

        {recentFeed.length === 0 ? (
          <div className="rounded-[1.5rem] bg-[#fcf7fa] p-4 text-sm leading-6 text-soft">
            Khi có mood, câu trả lời Deep Talk hoặc một kỷ niệm mới, Home sẽ kéo chúng về đây dưới dạng luồng ngắn thay vì ép mọi thứ thành shortcut khô khan.
          </div>
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
