import React, { useEffect, useMemo, useState } from 'react';
import { Coffee, CloudRain, Heart, Loader2, Music2, Smile, Sparkles, Volume2, Frown } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import PersonBadge from '../components/PersonBadge';
import { ROLE_CORNER_LABEL, ROLE_NAME, isRole, type Role } from '../constants/roles';

type MoodRole = Role;

type MoodEntry = {
  _id: string;
  mood: string;
  note?: string;
  createdBy?: MoodRole;
  createdAt?: string;
  date?: string;
};

const moods = [
  { icon: <Smile className="text-yellow-500" />, label: 'Hạnh phúc', note: 'Hôm nay có điều gì đó nhẹ và vui.', tone: 'bg-yellow-50' },
  { icon: <Heart className="text-pink-500" />, label: 'Đang yêu', note: 'Muốn lưu lại cảm giác gần nhau thật lâu.', tone: 'bg-pink-50' },
  { icon: <Coffee className="text-orange-500" />, label: 'Bình yên', note: 'Một ngày không cần ồn ào nhưng vẫn đủ ấm.', tone: 'bg-orange-50' },
  { icon: <CloudRain className="text-blue-500" />, label: 'Hơi buồn', note: 'Cần một góc chậm lại để thở cùng nhau.', tone: 'bg-blue-50' },
  { icon: <Frown className="text-gray-500" />, label: 'Mệt mỏi', note: 'Có lẽ hôm nay chỉ cần dịu đi một chút.', tone: 'bg-gray-100' },
];

function formatRelative(dateStr?: string) {
  if (!dateStr) return 'vừa ghi gần đây';
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

function resolveMoodOwner(createdBy?: MoodRole): MoodRole | null {
  return isRole(createdBy) ? createdBy : null;
}

const MoodLofi: React.FC = () => {
  const { role } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { toast } = useUI();

  const fetchMoods = async () => {
    try {
      const response = await api.get('/moods');
      setEntries(response.data.data ?? []);
    } catch {
      toast('Chưa tải được luồng cảm xúc.', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void fetchMoods();
  }, []);

  const handleMoodSelect = async (label: string) => {
    setSelectedMood(label);
    setLoading(true);
    try {
      await api.post('/moods', {
        mood: label,
        note: `Cập nhật từ ${ROLE_CORNER_LABEL[role]}`,
        createdBy: role,
      });
      toast(`Đã ghi lại cảm xúc của ${ROLE_NAME[role]}: ${label}`, 'success');
      await fetchMoods();
    } catch {
      toast('Chưa lưu được cảm xúc lần này.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const grouped = useMemo(() => {
    const byRole = {
      girlfriend: entries.filter(entry => resolveMoodOwner(entry.createdBy) === 'girlfriend'),
      boyfriend: entries.filter(entry => resolveMoodOwner(entry.createdBy) === 'boyfriend'),
      legacy: entries.filter(entry => resolveMoodOwner(entry.createdBy) === null),
    };
    return byRole;
  }, [entries]);

  return (
    <div className="page-container grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="surface-card-strong overflow-hidden p-5 md:p-7">
        <p className="section-label">Cảm xúc và trò chuyện</p>
        <h1 className="page-title mt-2">Góc cảm xúc</h1>
        <p className="page-subtitle">Ở đây cần rõ ràng cảm xúc là của ai. Mỗi lần ghi sẽ gắn thẳng với Ni hoặc Được, không còn là một luồng chung mơ hồ.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <PersonBadge role={role} prefix="Bạn đang ghi với vai trò" />
          <span className="chip bg-white/80 text-soft">{ROLE_CORNER_LABEL[role]}</span>
        </div>

        <div className="mt-6 space-y-3">
          {moods.map(mood => (
            <motion.button
              key={mood.label}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleMoodSelect(mood.label)}
              disabled={loading}
              className={`flex w-full items-center gap-4 rounded-[1.5rem] px-4 py-4 text-left transition ${selectedMood === mood.label ? 'bg-white shadow-sm ring-2 ring-primary/20' : 'bg-[#fbf6f8]'} `}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${mood.tone}`}>{mood.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-ink">{mood.label}</p>
                  <PersonBadge role={role} showIcon={false} className="shrink-0" />
                </div>
                <p className="mt-1 text-sm text-soft">{mood.note}</p>
              </div>
              {loading && selectedMood === mood.label ? <Loader2 className="animate-spin text-primary" size={16} /> : <Sparkles size={16} className="text-soft" />}
            </motion.button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="surface-card p-5 md:p-7">
          <div className="overflow-hidden rounded-[1.8rem] bg-[#1e1d24] shadow-[0_30px_80px_rgba(31,24,38,0.22)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.22em] text-white/55">
              <span className="inline-flex items-center gap-2"><Music2 size={14} /> Không gian chậm</span>
              <span>Lofi</span>
            </div>
            <div className="aspect-video">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0&controls=1&rel=0"
                title="Lofi Music"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          <div className="mt-4 rounded-[1.5rem] bg-[#faf6f8] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                <Volume2 size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Hai luồng cảm xúc tách riêng</p>
                <p className="mt-1 text-sm text-soft">Phần dưới giữ riêng cảm xúc của Ni và Được để nhìn vào là biết ai đang cần được để ý hơn trong hôm nay.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <MoodColumn
            title="Cảm xúc của Ni"
            role="girlfriend"
            entries={grouped.girlfriend}
            loading={historyLoading}
          />
          <MoodColumn
            title="Cảm xúc của Được"
            role="boyfriend"
            entries={grouped.boyfriend}
            loading={historyLoading}
          />
        </div>

        {grouped.legacy.length > 0 && (
          <section className="surface-card p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">Bản ghi cũ</p>
                <h2 className="mt-2 text-2xl font-black text-ink">Một vài check-in chưa rõ là của ai</h2>
              </div>
              <span className="chip bg-white/80 text-soft">Giữ nguyên dữ liệu cũ</span>
            </div>
            <p className="mt-3 text-sm text-soft">
              Các check-in này chưa có metadata người tạo. Màn hình sẽ giữ wording trung tính thay vì tự gán về Ni hay Được.
            </p>
            <div className="mt-4 space-y-3">
              {grouped.legacy.slice(0, 4).map(entry => (
                <div key={entry._id} className="rounded-[1.35rem] bg-[#faf6f8] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-ink">{entry.mood}</p>
                    <span className="text-xs text-soft">{formatRelative(entry.createdAt || entry.date)}</span>
                  </div>
                  <p className="mt-2 text-sm text-soft">{entry.note || 'Check-in cũ chưa có lời nhắn kèm theo.'}</p>
                  <p className="mt-3 text-xs font-medium text-soft">Chưa rõ ai đã ghi check-in này.</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
};

const MoodColumn: React.FC<{ title: string; role: MoodRole; entries: MoodEntry[]; loading: boolean }> = ({ title, role, entries, loading }) => (
  <section className="surface-card p-5 md:p-6">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="section-label">Luồng riêng</p>
        <h2 className="mt-2 text-2xl font-black text-ink">{title}</h2>
      </div>
      <PersonBadge role={role} prefix="Nhịp của" />
    </div>

    {loading ? (
      <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={22} /></div>
    ) : entries.length === 0 ? (
      <div className="mt-4 rounded-[1.4rem] bg-[#faf6f8] p-4 text-sm text-soft">
        Chưa có cập nhật nào từ {ROLE_NAME[role]}. Khi người này ghi cảm xúc, nó sẽ hiện tách riêng ở đây.
      </div>
    ) : (
      <div className="mt-4 space-y-3">
        {entries.slice(0, 4).map(entry => (
          <div key={entry._id} className="rounded-[1.35rem] bg-[#faf6f8] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-ink">{entry.mood}</p>
              <span className="text-xs text-soft">{formatRelative(entry.createdAt || entry.date)}</span>
            </div>
            <p className="mt-2 text-sm text-soft">{entry.note || 'Không có lời nhắn kèm theo.'}</p>
          </div>
        ))}
      </div>
    )}
  </section>
);

export default MoodLofi;
