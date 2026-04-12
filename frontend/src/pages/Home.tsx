import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Heart,
  MapPinned,
  MessageCircleHeart,
  NotebookPen,
  Sparkles,
  TimerReset,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { ROLE_CORNER_LABEL, ROLE_NAME } from '../constants/roleLabels';

type Role = 'boyfriend' | 'girlfriend';

type Memory = {
  _id: string;
  title: string;
  date: string;
  content: string;
  media?: string[];
  mood?: string;
};

type Place = {
  _id: string;
  name: string;
  isVisited: boolean;
  note?: string;
};

type Mood = {
  mood: string;
  note?: string;
  createdAt?: string;
};

type DeepTalkQuestion = {
  _id: string;
  content: string;
  answers: Record<Role, { text?: string; isInPerson: boolean }>;
};

type DashboardState = {
  memories: Memory[];
  places: Place[];
  moods: Mood[];
  questions: DeepTalkQuestion[];
};

const START_DATE = new Date(2026, 1, 7, 20, 46, 0);

const roleCopy: Record<Role, { eyebrow: string; title: string; subtitle: string; accent: string }> = {
  girlfriend: {
    eyebrow: 'Không gian của Ni',
    title: 'Mọi điều hôm nay nên thật nhẹ và gần.',
    subtitle: 'Mở app lên để nhớ mình đang ở đâu trong câu chuyện của hai đứa, chứ không phải chỉ đi qua một danh sách tính năng.',
    accent: 'from-pink-100 via-rose-50 to-white',
  },
  boyfriend: {
    eyebrow: 'Không gian của Được',
    title: 'Giữ nhịp cho những điều đáng nhớ của hai đứa.',
    subtitle: 'Trang chủ giờ là nơi nhìn nhanh điều quan trọng, việc còn chờ, và bước tiếp theo nên làm trong hôm nay.',
    accent: 'from-sky-100 via-white to-rose-50',
  },
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

const Home: React.FC = () => {
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
    Promise.all([
      api.get('/memories'),
      api.get('/places'),
      api.get('/moods'),
      api.get('/deeptalk/questions'),
    ])
      .then(([memoryRes, placeRes, moodRes, questionRes]) => {
        if (!mounted) return;
        setData({
          memories: memoryRes.data.data ?? [],
          places: placeRes.data.data ?? [],
          moods: moodRes.data.data ?? [],
          questions: questionRes.data.data ?? [],
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const latestMemory = data.memories[0];
  const latestMood = data.moods[0];
  const unansweredQuestion = data.questions.find(question => {
    const answer = question.answers?.[role as Role];
    return !answer?.isInPerson && !answer?.text;
  });
  const nextPlace = data.places.find(place => !place.isVisited);
  const visitedCount = data.places.filter(place => place.isVisited).length;

  const nextStep = useMemo(() => {
    if (unansweredQuestion) {
      return {
        to: '/deeptalk',
        title: 'Có một câu hỏi vẫn đang chờ bạn',
        detail: unansweredQuestion.content,
        button: 'Trả lời ngay',
        icon: <MessageCircleHeart size={18} />,
      };
    }

    if (nextPlace) {
      return {
        to: '/places',
        title: 'Có một địa điểm nên lên lịch cho lần tới',
        detail: nextPlace.name,
        button: 'Xem địa điểm',
        icon: <MapPinned size={18} />,
      };
    }

    return {
      to: latestMood ? '/timeline' : '/mood',
      title: latestMood ? 'Ghi lại thêm một khoảnh khắc mới' : 'Check-in cảm xúc cho hôm nay',
      detail: latestMood ? 'Trang chủ sẽ đỡ lạnh hơn khi có thêm điều mới để nhớ.' : 'Chỉ cần một câu ngắn để app biết hôm nay của bạn đang thế nào.',
      button: latestMood ? 'Viết kỷ niệm' : 'Ghi cảm xúc',
      icon: latestMood ? <NotebookPen size={18} /> : <Sparkles size={18} />,
    };
  }, [latestMood, nextPlace, unansweredQuestion]);

  const todayCards = [
    {
      label: 'Cảm xúc gần nhất',
      value: latestMood?.mood ?? 'Chưa có check-in',
      hint: latestMood ? `Cập nhật ${formatRelative(latestMood.createdAt)}` : 'Ghi một dòng để không khí app ấm hơn',
      to: '/mood',
      icon: <Sparkles size={18} />,
    },
    {
      label: 'Kỷ niệm mới nhất',
      value: latestMemory?.title ?? 'Chưa có điều gì mới được lưu',
      hint: latestMemory ? new Date(latestMemory.date).toLocaleDateString('vi-VN') : 'Một tấm ảnh hay một dòng ngắn cũng đủ',
      to: '/timeline',
      icon: <CalendarDays size={18} />,
    },
    {
      label: 'Địa điểm đã đi',
      value: `${visitedCount} nơi`,
      hint: nextPlace ? `Lần tới có thể ghé ${nextPlace.name}` : 'Danh sách của hai bạn đã khá đầy rồi',
      to: '/places',
      icon: <MapPinned size={18} />,
    },
  ];

  const recentBlocks = [
    {
      title: 'Kỷ niệm gần đây',
      body: latestMemory ? latestMemory.content : 'Khi có một khoảnh khắc mới được lưu, phần này sẽ kể lại cho bạn ngay ở đây.',
      meta: latestMemory ? new Date(latestMemory.date).toLocaleDateString('vi-VN') : 'Đang chờ điều mới',
      to: '/timeline',
    },
    {
      title: 'Điều đang đợi phía trước',
      body: nextPlace ? `${nextPlace.name}${nextPlace.note ? ` · ${nextPlace.note}` : ''}` : 'Danh sách địa điểm đang trống. Thêm một chỗ muốn đi để lần tới mở app là có gợi ý.',
      meta: nextPlace ? 'Từ mục Địa điểm' : 'Gợi ý cho lần hẹn tới',
      to: '/places',
    },
  ];

  return (
    <div className="page-container space-y-5 md:space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`surface-card-strong overflow-hidden bg-gradient-to-br ${roleCopy[role as Role].accent} p-5 md:p-8`}
      >
        <div className="grid gap-5 md:grid-cols-[1.4fr_0.9fr] md:gap-8">
          <div>
            <p className="section-label">{roleCopy[role as Role].eyebrow}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`role-pill ${role === 'boyfriend' ? 'pill-duoc' : 'pill-ni'}`}>{ROLE_CORNER_LABEL[role]}</span>
              <span className="chip bg-white/80 text-soft">Đang dùng với vai trò {ROLE_NAME[role]}</span>
            </div>
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[0.95] text-ink md:text-6xl">{roleCopy[role as Role].title}</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-soft md:text-base">{roleCopy[role as Role].subtitle}</p>
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
            <StatTile icon={<TimerReset size={16} />} label="Đã bên nhau" value={`${daysTogether} ngày`} hint="Vẫn đang tiếp tục tăng" />
            <StatTile icon={<MessageCircleHeart size={16} />} label="Câu hỏi đang chờ" value={`${data.questions.filter(question => !(question.answers?.[role as Role]?.isInPerson || question.answers?.[role as Role]?.text)).length}`} hint="Để không bỏ lỡ điều cần nói" />
            <StatTile icon={<Heart size={16} />} label="Kỷ niệm đã lưu" value={`${data.memories.length}`} hint="Những lần quay lại để nhớ" />
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.9fr]">
        <div className="surface-card p-5 md:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="section-label">Hôm nay</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Điều đáng để xem ngay</h2>
            </div>
            {loading && <span className="text-xs font-bold text-soft">Đang làm mới...</span>}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {todayCards.map(card => (
              <Link key={card.label} to={card.to} className="card-hover rounded-[1.4rem] bg-[#fcf7fa] p-4">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm text-primary">{card.icon}</div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b292a6]">{card.label}</p>
                <p className="mt-2 line-clamp-2 text-base font-bold text-ink">{card.value}</p>
                <p className="mt-2 text-sm leading-6 text-soft">{card.hint}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="surface-card p-5 md:p-6">
          <p className="section-label">Tiếp theo</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Một bước đủ rõ ràng</h2>
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
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {recentBlocks.map(block => (
          <Link key={block.title} to={block.to} className="surface-card card-hover p-5 md:p-6">
            <p className="section-label">Gần đây</p>
            <h2 className="mt-2 text-2xl font-black text-ink">{block.title}</h2>
            <p className="mt-4 line-clamp-4 text-sm leading-7 text-soft">{block.body}</p>
            <div className="mt-5 flex items-center justify-between text-sm font-bold text-primary">
              <span className="text-soft">{block.meta}</span>
              <span className="inline-flex items-center gap-1">
                Mở ra
                <ArrowRight size={15} />
              </span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
};

const StatTile: React.FC<{ icon: React.ReactNode; label: string; value: string; hint: string }> = ({ icon, label, value, hint }) => (
  <div className="rounded-[1.4rem] bg-white/82 p-4 shadow-sm ring-1 ring-black/5">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-primary">{icon}</div>
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b292a6]">{label}</p>
    <p className="mt-2 text-xl font-black text-ink">{value}</p>
    <p className="mt-1 text-sm text-soft">{hint}</p>
  </div>
);

export default Home;
