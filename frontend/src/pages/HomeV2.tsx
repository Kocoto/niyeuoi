import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Heart,
  MapPinned,
  MessageCircleHeart,
  NotebookPen,
  Sparkles,
  TimerReset,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';
import RolePill from '../components/RolePill';
import type { AppRole } from '../constants/appRoles';
import { ROLE_CORNER_LABEL, ROLE_NAME, getOtherRole } from '../constants/appRoles';
import { useAuth } from '../context/AuthContext';
import { formatCompactDate, formatRelativeTime, getGreetingLine } from '../utils/date';

type Memory = {
  _id: string;
  title: string;
  date: string;
  content: string;
  media?: string[];
  mood?: string;
  createdBy?: AppRole;
  createdAt?: string;
};

type Place = {
  _id: string;
  name: string;
  isVisited: boolean;
  note?: string;
};

type Mood = {
  _id?: string;
  mood: string;
  note?: string;
  createdAt?: string;
  date?: string;
  createdBy?: AppRole;
};

type Answer = {
  text?: string;
  isInPerson: boolean;
  answeredAt?: string;
};

type DeepTalkQuestion = {
  _id: string;
  content: string;
  createdAt?: string;
  createdBy?: AppRole;
  answers: Record<AppRole, Answer>;
};

type DashboardState = {
  memories: Memory[];
  places: Place[];
  moods: Mood[];
  questions: DeepTalkQuestion[];
};

type ActivityItem = {
  id: string;
  actor: AppRole;
  title: string;
  detail: string;
  time?: string;
  to: string;
};

const START_DATE = new Date(2026, 1, 7, 20, 46, 0);
const ROLE_ORDER: AppRole[] = ['girlfriend', 'boyfriend'];

function getElapsedDays() {
  return Math.max(0, Math.floor((Date.now() - START_DATE.getTime()) / 86400000));
}

function isAnswered(answer?: Answer) {
  return Boolean(answer?.isInPerson || answer?.text);
}

function sortByNewest<T extends { createdAt?: string; date?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftValue = new Date(left.createdAt ?? left.date ?? 0).getTime();
    const rightValue = new Date(right.createdAt ?? right.date ?? 0).getTime();
    return rightValue - leftValue;
  });
}

const HomeV2: React.FC = () => {
  const { role } = useAuth();
  const [data, setData] = useState<DashboardState>({ memories: [], places: [], moods: [], questions: [] });
  const [loading, setLoading] = useState(true);
  const [daysTogether, setDaysTogether] = useState(getElapsedDays);

  useEffect(() => {
    const timer = window.setInterval(() => setDaysTogether(getElapsedDays()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchDashboard = async () => {
      const [memoryRes, placeRes, moodRes, questionRes] = await Promise.allSettled([
        api.get('/memories'),
        api.get('/places'),
        api.get('/moods'),
        api.get('/deeptalk/questions'),
      ]);

      if (!mounted) return;

      setData({
        memories: memoryRes.status === 'fulfilled' ? memoryRes.value.data.data ?? [] : [],
        places: placeRes.status === 'fulfilled' ? placeRes.value.data.data ?? [] : [],
        moods: moodRes.status === 'fulfilled' ? moodRes.value.data.data ?? [] : [],
        questions: questionRes.status === 'fulfilled' ? questionRes.value.data.data ?? [] : [],
      });
      setLoading(false);
    };

    void fetchDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const latestMoodByRole = useMemo(() => {
    const sorted = sortByNewest(data.moods);

    return ROLE_ORDER.reduce<Record<AppRole, Mood | undefined>>((accumulator, currentRole) => {
      accumulator[currentRole] = sorted.find(entry => (entry.createdBy ?? 'girlfriend') === currentRole);
      return accumulator;
    }, { boyfriend: undefined, girlfriend: undefined });
  }, [data.moods]);

  const latestMemoryByRole = useMemo(() => {
    const sorted = sortByNewest(data.memories);

    return ROLE_ORDER.reduce<Record<AppRole, Memory | undefined>>((accumulator, currentRole) => {
      accumulator[currentRole] = sorted.find(entry => (entry.createdBy ?? 'girlfriend') === currentRole);
      return accumulator;
    }, { boyfriend: undefined, girlfriend: undefined });
  }, [data.memories]);

  const pendingQuestions = useMemo(() => {
    return data.questions.filter(question => !ROLE_ORDER.every(currentRole => isAnswered(question.answers?.[currentRole])));
  }, [data.questions]);

  const waitingByRole = useMemo(() => {
    return ROLE_ORDER.reduce<Record<AppRole, DeepTalkQuestion[]>>((accumulator, currentRole) => {
      accumulator[currentRole] = pendingQuestions.filter(question => !isAnswered(question.answers?.[currentRole]));
      return accumulator;
    }, { boyfriend: [], girlfriend: [] });
  }, [pendingQuestions]);

  const nextPlace = useMemo(() => data.places.find(place => !place.isVisited), [data.places]);
  const visitedCount = useMemo(() => data.places.filter(place => place.isVisited).length, [data.places]);

  const recentFeed = useMemo(() => {
    const memoryItems: ActivityItem[] = sortByNewest(data.memories)
      .slice(0, 3)
      .map(memory => ({
        id: `memory-${memory._id}`,
        actor: memory.createdBy ?? 'girlfriend',
        title: `${ROLE_NAME[memory.createdBy ?? 'girlfriend']} vừa lưu một kỷ niệm`,
        detail: memory.title,
        time: memory.createdAt ?? memory.date,
        to: '/timeline',
      }));

    const moodItems: ActivityItem[] = sortByNewest(data.moods)
      .slice(0, 4)
      .map((entry, index) => ({
        id: `mood-${entry._id ?? index}`,
        actor: entry.createdBy ?? 'girlfriend',
        title: `${ROLE_NAME[entry.createdBy ?? 'girlfriend']} vừa ghi cảm xúc`,
        detail: entry.note ? `${entry.mood} · ${entry.note}` : entry.mood,
        time: entry.createdAt ?? entry.date,
        to: '/mood',
      }));

    const answerItems: ActivityItem[] = data.questions.flatMap(question =>
      ROLE_ORDER.flatMap(currentRole => {
        const answer = question.answers?.[currentRole];

        if (!answer?.answeredAt || !isAnswered(answer)) {
          return [];
        }

        return [
          {
            id: `answer-${question._id}-${currentRole}`,
            actor: currentRole,
            title: `${ROLE_NAME[currentRole]} vừa trả lời một câu hỏi`,
            detail: question.content,
            time: answer.answeredAt,
            to: '/deeptalk',
          },
        ];
      }),
    );

    return [...memoryItems, ...moodItems, ...answerItems]
      .sort((left, right) => new Date(right.time ?? 0).getTime() - new Date(left.time ?? 0).getTime())
      .slice(0, 5);
  }, [data.memories, data.moods, data.questions]);

  const nextStep = useMemo(() => {
    const currentRole = role as AppRole;
    const otherRole = getOtherRole(currentRole);
    const latestMood = latestMoodByRole[currentRole];

    if (waitingByRole[currentRole].length > 0) {
      return {
        to: '/deeptalk',
        title: `Có ${waitingByRole[currentRole].length} câu hỏi đang chờ ${ROLE_NAME[currentRole]}`,
        detail: waitingByRole[currentRole][0]?.content ?? 'Mở ra để nối tiếp cuộc trò chuyện còn dang dở.',
        button: 'Tiếp tục trò chuyện',
        icon: <MessageCircleHeart size={18} />,
      };
    }

    if (!latestMood) {
      return {
        to: '/mood',
        title: `Hôm nay của ${ROLE_NAME[currentRole]} vẫn chưa được ghi lại`,
        detail: `Một dòng ngắn sẽ giúp ${ROLE_NAME[otherRole].toLowerCase()} hiểu hôm nay của bạn hơn.`,
        button: 'Ghi cảm xúc',
        icon: <Sparkles size={18} />,
      };
    }

    if (nextPlace) {
      return {
        to: '/places',
        title: 'Có một địa điểm đang chờ được biến thành kế hoạch',
        detail: nextPlace.name,
        button: 'Xem địa điểm',
        icon: <MapPinned size={18} />,
      };
    }

    return {
      to: '/timeline',
      title: 'Kể thêm một điều vừa mới đi qua',
      detail: 'Khi có thêm một khoảnh khắc mới, dòng kỷ niệm sẽ bớt lạnh và rõ câu chuyện hơn.',
      button: 'Ghi kỷ niệm',
      icon: <NotebookPen size={18} />,
    };
  }, [latestMoodByRole, nextPlace, role, waitingByRole]);

  const todayPanels = useMemo(() => {
    return ROLE_ORDER.map(currentRole => {
      const latestMood = latestMoodByRole[currentRole];
      const latestMemory = latestMemoryByRole[currentRole];
      const waitingCount = waitingByRole[currentRole].length;

      return {
        role: currentRole,
        moodLine: latestMood ? `${latestMood.mood}${latestMood.note ? ` · ${latestMood.note}` : ''}` : 'Chưa có check-in nào',
        moodMeta: latestMood ? `Cập nhật ${formatRelativeTime(latestMood.createdAt ?? latestMood.date)}` : 'Một câu ngắn là đủ để bắt đầu',
        memoryLine: latestMemory?.title ?? 'Chưa có kỷ niệm mới được lưu',
        memoryMeta: latestMemory ? formatCompactDate(latestMemory.date) : 'Khi có điều mới, phần này sẽ giữ lại',
        waitingLine: waitingCount > 0 ? `${waitingCount} câu hỏi đang chờ` : 'Không có điều gì bị bỏ lửng',
      };
    });
  }, [latestMemoryByRole, latestMoodByRole, waitingByRole]);

  const betweenYouItems = useMemo(() => {
    const items = [];

    if (pendingQuestions[0]) {
      items.push({
        title: 'Câu hỏi vẫn đang chờ đủ hai phía',
        detail: pendingQuestions[0].content,
        to: '/deeptalk',
      });
    }

    if (nextPlace) {
      items.push({
        title: 'Một nơi nên chốt cho lần hẹn tới',
        detail: nextPlace.name,
        to: '/places',
      });
    }

    if (!latestMoodByRole.girlfriend || !latestMoodByRole.boyfriend) {
      items.push({
        title: 'Nhịp hôm nay của hai người vẫn chưa đủ',
        detail: 'Mở góc cảm xúc để nhìn hai phía cạnh nhau.',
        to: '/mood',
      });
    }

    if (recentFeed.length === 0) {
      items.push({
        title: 'Không gian này đang chờ điều đầu tiên',
        detail: 'Chỉ cần một cảm xúc hoặc một kỷ niệm nhỏ để app bắt đầu có nhịp sống.',
        to: '/mood',
      });
    }

    return items.slice(0, 4);
  }, [latestMoodByRole, nextPlace, pendingQuestions, recentFeed.length]);

  const stats = [
    {
      icon: <TimerReset size={16} />,
      label: 'Đã bên nhau',
      value: `${daysTogether} ngày`,
      hint: 'Vẫn đang tiếp tục tăng',
    },
    {
      icon: <MessageCircleHeart size={16} />,
      label: 'Điều đang chờ',
      value: `${pendingQuestions.length}`,
      hint: 'Những câu hỏi và việc nhỏ chưa khép lại',
    },
    {
      icon: <Heart size={16} />,
      label: 'Kỷ niệm đã lưu',
      value: `${data.memories.length}`,
      hint: 'Những lần quay lại để nhớ',
    },
  ];

  return (
    <div className="page-container space-y-5 md:space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className={`surface-card-strong overflow-hidden bg-gradient-to-br ${
          role === 'boyfriend' ? 'from-sky-100 via-white to-rose-50' : 'from-pink-100 via-rose-50 to-white'
        } p-5 md:p-8`}
      >
        <div className="grid gap-5 md:grid-cols-[1.4fr_0.9fr] md:gap-8">
          <div>
            <p className="section-label">{getGreetingLine()}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RolePill role={role as AppRole} text={ROLE_CORNER_LABEL[role as AppRole]} />
              <span className="chip bg-white/80 text-soft">Trang chủ giờ là dashboard theo vai trò</span>
            </div>

            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[0.95] text-ink md:text-6xl">
              Mở app lên là biết hôm nay của hai bạn đang ở đâu.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-soft md:text-base">
              Không còn một khối shortcut chung chung. Trang chủ này giữ rõ góc của {ROLE_NAME[role as AppRole]}, nhìn được
              nhịp của người còn lại, và chỉ đẩy một việc tiếp theo đủ rõ ràng.
            </p>

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

          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            {stats.map(stat => (
              <div key={stat.label} className="rounded-[1.4rem] bg-white/84 p-4 shadow-sm ring-1 ring-black/5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-primary">
                  {stat.icon}
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b292a6]">{stat.label}</p>
                <p className="mt-2 text-xl font-black text-ink">{stat.value}</p>
                <p className="mt-1 text-sm text-soft">{stat.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <section className="surface-card p-5 md:p-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="section-label">Hôm nay</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Hai nhịp đứng cạnh nhau</h2>
          </div>
          {loading ? <span className="text-xs font-bold text-soft">Đang làm mới dữ liệu...</span> : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {todayPanels.map(panel => (
            <div key={panel.role} className="rounded-[1.6rem] bg-[#fcf7fa] p-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-label">Nhịp riêng</p>
                  <h3 className="mt-2 text-xl font-black text-ink">{ROLE_CORNER_LABEL[panel.role]}</h3>
                </div>
                <RolePill role={panel.role} />
              </div>

              <div className="mt-4 grid gap-3">
                <InfoRow label="Cảm xúc gần nhất" value={panel.moodLine} meta={panel.moodMeta} />
                <InfoRow label="Kỷ niệm gần nhất" value={panel.memoryLine} meta={panel.memoryMeta} />
                <InfoRow label="Điều đang chờ" value={panel.waitingLine} meta="Deep Talk và việc chung còn dang dở" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="surface-card p-5 md:p-6">
          <p className="section-label">Giữa hai người</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Điều đang chờ được nối tiếp</h2>

          <div className="mt-5 space-y-3">
            {betweenYouItems.map(item => (
              <Link
                key={`${item.title}-${item.to}`}
                to={item.to}
                className="flex items-start gap-3 rounded-[1.4rem] bg-[#faf6f8] px-4 py-4 transition hover:bg-white"
              >
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                  <Clock3 size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-soft">{item.detail}</p>
                </div>
                <ArrowRight size={16} className="mt-1 text-soft" />
              </Link>
            ))}
          </div>
        </div>

        <div className="surface-card p-5 md:p-6">
          <p className="section-label">Bước tiếp theo</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Một việc đủ rõ</h2>

          <div className="mt-5 rounded-[1.6rem] bg-gradient-to-br from-rose-50 to-white p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
              {nextStep.icon}
            </div>
            <p className="mt-4 text-xl font-black text-ink">{nextStep.title}</p>
            <p className="mt-2 text-sm leading-6 text-soft">{nextStep.detail}</p>
            <Link to={nextStep.to} className="btn-primary mt-5">
              {nextStep.button}
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-4 rounded-[1.4rem] bg-[#faf6f8] p-4">
            <p className="text-sm font-bold text-ink">Bản đồ nhịp hiện tại</p>
            <div className="mt-3 space-y-2">
              {ROLE_ORDER.map(currentRole => (
                <div key={currentRole} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <RolePill role={currentRole} className="px-2.5 py-1" />
                    <span className="text-sm text-soft">{latestMoodByRole[currentRole] ? 'Đã có check-in gần đây' : 'Cần được ghi lại hôm nay'}</span>
                  </div>
                  {waitingByRole[currentRole].length === 0 ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <span className="text-xs font-bold text-soft">{waitingByRole[currentRole].length} chờ</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card p-5 md:p-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="section-label">Gần đây</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Luồng vừa mới xảy ra</h2>
          </div>
          <div className="text-sm text-soft">{visitedCount} địa điểm đã đi · {nextPlace ? `1 nơi đang chờ` : 'Danh sách hẹn khá đầy'}</div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {recentFeed.map(item => (
            <Link key={item.id} to={item.to} className="flex items-start gap-3 rounded-[1.4rem] bg-[#faf6f8] px-4 py-4 transition hover:bg-white">
              <RolePill role={item.actor} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-soft">{item.detail}</p>
              </div>
              <span className="shrink-0 text-xs font-bold text-soft">{formatRelativeTime(item.time)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string; meta: string }> = ({ label, value, meta }) => (
  <div className="rounded-[1.2rem] bg-white px-4 py-4 shadow-sm ring-1 ring-black/5">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b292a6]">{label}</p>
    <p className="mt-2 text-base font-bold text-ink">{value}</p>
    <p className="mt-1 text-sm text-soft">{meta}</p>
  </div>
);

export default HomeV2;
