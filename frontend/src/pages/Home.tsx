import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Stars, BookHeart, UtensilsCrossed, Smile, Frown, Coffee, CloudRain } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/api';

const START_DATE = new Date(2026, 1, 7, 20, 46, 0); // 20:46 ngày 7/2/2026

interface TimeElapsed {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface Stats {
  memories: number;
  places: number;
  latestMood: string | null;
}

function calcElapsed(): TimeElapsed {
  const diff = Math.max(0, Date.now() - START_DATE.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const moodIcon: Record<string, React.ReactNode> = {
  'Hạnh phúc':  <Smile size={16} className="text-yellow-500" />,
  'Đang yêu':   <Heart size={16} className="text-pink-500" />,
  'Bình yên':   <Coffee size={16} className="text-orange-400" />,
  'Hơi buồn':   <CloudRain size={16} className="text-blue-400" />,
  'Mệt mỏi':    <Frown size={16} className="text-gray-400" />,
};

const Home: React.FC = () => {
  const [elapsed, setElapsed] = useState<TimeElapsed>(calcElapsed);
  const [stats, setStats] = useState<Stats>({ memories: 0, places: 0, latestMood: null });

  useEffect(() => {
    const timer = setInterval(() => setElapsed(calcElapsed()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/memories'),
      api.get('/places'),
      api.get('/moods'),
    ]).then(([memRes, placeRes, moodRes]) => {
      setStats({
        memories: memRes.data.count ?? memRes.data.data.length,
        places: (placeRes.data.data as { isVisited: boolean }[]).filter(p => p.isVisited).length,
        latestMood: moodRes.data.data[0]?.mood ?? null,
      });
    }).catch(() => {});
  }, []);

  return (
    <div className="relative max-w-4xl mx-auto py-8 md:py-12 px-4 text-center overflow-hidden">
      {/* Background decoration */}
      <div aria-hidden className="pointer-events-none select-none">
        <span className="absolute top-8 left-4 text-5xl opacity-[0.04] rotate-[-20deg]">♥</span>
        <span className="absolute top-24 right-6 text-7xl opacity-[0.04] rotate-[15deg]">♥</span>
        <span className="absolute bottom-40 left-8 text-6xl opacity-[0.04] rotate-[10deg]">♥</span>
        <span className="absolute bottom-20 right-10 text-4xl opacity-[0.04] rotate-[-10deg]">♥</span>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[260px] opacity-[0.025]">♥</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Heart icon */}
        <div className="flex justify-center mb-4 md:mb-6">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Heart className="text-primary fill-primary w-12 h-12 md:w-16 md:h-16" />
          </motion.div>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4 text-gray-800">Chúng ta đã bên nhau</h1>

        {/* Số ngày */}
        <div className="relative inline-block my-4 md:my-8">
          <Stars className="absolute -top-4 -left-4 md:-top-6 md:-left-6 text-yellow-400 w-5 h-5 md:w-8 md:h-8" />
          <span className="text-6xl md:text-8xl font-black text-primary romantic-font leading-tight">
            {elapsed.days}
          </span>
          <Stars className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 text-yellow-400 w-5 h-5 md:w-8 md:h-8" />
        </div>

        <p className="text-xl md:text-2xl font-semibold text-gray-600 mb-8">Ngày hạnh phúc</p>

        {/* Bộ đếm giờ/phút/giây */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-3 md:gap-4 mb-12 md:mb-16"
        >
          <TimeUnit value={elapsed.hours} label="Giờ" />
          <Separator />
          <TimeUnit value={elapsed.minutes} label="Phút" />
          <Separator />
          <TimeUnit value={elapsed.seconds} label="Giây" />
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <FeatureCard
            to="/timeline"
            icon={<BookHeart size={22} className="text-pink-400" />}
            iconBg="bg-pink-100"
            title="Kỷ niệm"
            desc="Lưu lại những khoảnh khắc đáng nhớ nhất của chúng mình."
            color="bg-pink-50"
            stat={stats.memories > 0 ? `${stats.memories} kỷ niệm` : undefined}
            statColor="text-pink-400"
          />
          <FeatureCard
            to="/places"
            icon={<UtensilsCrossed size={22} className="text-orange-400" />}
            iconBg="bg-orange-100"
            title="Ẩm thực"
            desc="Đi ăn ở đâu, món gì ngon nhất đều ở đây cả."
            color="bg-orange-50"
            stat={stats.places > 0 ? `${stats.places} quán đã đi` : undefined}
            statColor="text-orange-400"
          />
          <FeatureCard
            to="/mood"
            icon={moodIcon[stats.latestMood ?? ''] ?? <Smile size={22} className="text-purple-400" />}
            iconBg="bg-purple-100"
            title="Góc cảm xúc"
            desc="Hôm nay bạn thấy thế nào? Ghi lại tâm trạng của mình nhé."
            color="bg-purple-50"
            stat={stats.latestMood ? `Đang: ${stats.latestMood}` : undefined}
            statColor="text-purple-400"
          />
        </div>
      </motion.div>
    </div>
  );
};

const TimeUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="bg-white border border-pink-100 shadow-sm rounded-2xl px-4 py-3 min-w-[64px] md:min-w-[80px]">
      <motion.span
        key={value}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="block text-2xl md:text-3xl font-black text-primary tabular-nums"
      >
        {String(value).padStart(2, '0')}
      </motion.span>
    </div>
    <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1.5">{label}</span>
  </div>
);

const Separator: React.FC = () => (
  <span className="text-2xl md:text-3xl font-black text-pink-200 self-start mt-3">:</span>
);

interface FeatureCardProps {
  to: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
  color: string;
  stat?: string;
  statColor: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ to, icon, iconBg, title, desc, color, stat, statColor }) => (
  <Link to={to}>
    <motion.div
      whileTap={{ scale: 0.97 }}
      className={`${color} p-6 rounded-[2rem] text-left border-2 border-transparent hover:border-white shadow-sm card-hover transition-all h-full`}
    >
      <div className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-1.5 text-gray-800">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-3">{desc}</p>
      {stat && (
        <span className={`text-xs font-bold ${statColor} bg-white/70 px-2.5 py-1 rounded-full`}>
          {stat}
        </span>
      )}
    </motion.div>
  </Link>
);

export default Home;
