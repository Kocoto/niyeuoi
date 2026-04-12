import React, { useEffect, useMemo, useState } from 'react';
import { CloudRain, Coffee, Frown, Heart, Loader2, MessageCircleHeart, Smile, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';
import EmptyState from '../components/EmptyState';
import RolePill from '../components/RolePill';
import type { AppRole } from '../constants/appRoles';
import { ROLE_CORNER_LABEL, ROLE_NAME, getOtherRole } from '../constants/appRoles';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { formatRelativeTime } from '../utils/date';

type MoodEntry = {
  _id: string;
  mood: string;
  note?: string;
  createdBy?: AppRole;
  createdAt?: string;
  date?: string;
};

const moodOptions = [
  {
    label: 'Hạnh phúc',
    note: 'Hôm nay có điều gì đó sáng và dễ mỉm cười.',
    icon: <Smile className="text-yellow-500" size={20} />,
    tone: 'bg-yellow-50',
  },
  {
    label: 'Đang yêu',
    note: 'Muốn giữ cảm giác gần nhau lâu thêm một chút.',
    icon: <Heart className="text-pink-500" size={20} />,
    tone: 'bg-pink-50',
  },
  {
    label: 'Bình yên',
    note: 'Không cần quá nhiều lời nhưng vẫn đủ ấm.',
    icon: <Coffee className="text-orange-500" size={20} />,
    tone: 'bg-orange-50',
  },
  {
    label: 'Hơi buồn',
    note: 'Có lẽ chỉ cần một câu hỏi nhẹ và một chỗ để thở.',
    icon: <CloudRain className="text-blue-500" size={20} />,
    tone: 'bg-blue-50',
  },
  {
    label: 'Mệt mỏi',
    note: 'Ngày hôm nay cần dịu đi nhiều hơn là cố gắng thêm.',
    icon: <Frown className="text-gray-500" size={20} />,
    tone: 'bg-gray-100',
  },
];

function sortByNewest(entries: MoodEntry[]) {
  return [...entries].sort((left, right) => {
    const leftTime = new Date(left.createdAt ?? left.date ?? 0).getTime();
    const rightTime = new Date(right.createdAt ?? right.date ?? 0).getTime();
    return rightTime - leftTime;
  });
}

function getSupportSuggestion(entry?: MoodEntry, viewerRole?: AppRole) {
  if (!entry || !viewerRole) return null;

  const owner = entry.createdBy ?? 'girlfriend';
  const otherRole = getOtherRole(owner);

  if (viewerRole !== otherRole) {
    return null;
  }

  if (entry.mood === 'Hơi buồn') {
    return `Hỏi ${ROLE_NAME[owner].toLowerCase()} một câu thật ngắn và để khoảng trống cho người ấy nói khi sẵn sàng.`;
  }

  if (entry.mood === 'Mệt mỏi') {
    return `Hôm nay ${ROLE_NAME[owner].toLowerCase()} có thể chỉ cần được nghỉ ngơi, đừng ép cuộc trò chuyện phải dài.`;
  }

  return null;
}

const MoodV2: React.FC = () => {
  const { role } = useAuth();
  const { toast } = useUI();
  const [selectedMood, setSelectedMood] = useState<string>(moodOptions[0].label);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMoods = async () => {
    try {
      const response = await api.get('/moods');
      setEntries(response.data.data ?? []);
    } catch {
      toast('Chưa tải được luồng cảm xúc.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMoods();
  }, []);

  const handleSaveMood = async () => {
    setSaving(true);

    try {
      await api.post('/moods', {
        mood: selectedMood,
        note: note.trim() || undefined,
        createdBy: role,
      });

      setNote('');
      toast(`Đã ghi lại cảm xúc của ${ROLE_NAME[role as AppRole]}.`, 'success');
      await fetchMoods();
    } catch {
      toast('Chưa lưu được cảm xúc lần này.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const groupedEntries = useMemo(() => {
    const sorted = sortByNewest(entries);

    return {
      girlfriend: sorted.filter(entry => (entry.createdBy ?? 'girlfriend') === 'girlfriend'),
      boyfriend: sorted.filter(entry => (entry.createdBy ?? 'girlfriend') === 'boyfriend'),
    };
  }, [entries]);

  const latestByRole = useMemo(() => {
    return {
      girlfriend: groupedEntries.girlfriend[0],
      boyfriend: groupedEntries.boyfriend[0],
    };
  }, [groupedEntries]);

  const supportSuggestion = useMemo(() => {
    return getSupportSuggestion(latestByRole[getOtherRole(role as AppRole)], role as AppRole);
  }, [latestByRole, role]);

  const selectedMoodMeta = moodOptions.find(item => item.label === selectedMood) ?? moodOptions[0];

  return (
    <div className="page-container grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="surface-card-strong overflow-hidden p-5 md:p-7">
        <p className="section-label">Cảm xúc và trò chuyện</p>
        <h1 className="page-title mt-2">Góc cảm xúc</h1>
        <p className="page-subtitle">
          Ở đây không còn một luồng chung mơ hồ. Mỗi lần ghi cảm xúc sẽ đi thẳng vào nhịp của Ni hoặc Được, để nhìn
          vào là biết hôm nay ai đang cần được để ý hơn.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <RolePill role={role as AppRole} text={`Bạn đang ghi với vai trò ${ROLE_NAME[role as AppRole]}`} />
          <span className="chip bg-white/80 text-soft">{ROLE_CORNER_LABEL[role as AppRole]}</span>
        </div>

        <div className="mt-6 grid gap-3">
          {moodOptions.map(option => {
            const active = option.label === selectedMood;

            return (
              <motion.button
                key={option.label}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setSelectedMood(option.label)}
                className={`flex w-full items-start gap-4 rounded-[1.5rem] px-4 py-4 text-left transition ${
                  active ? 'bg-white shadow-sm ring-2 ring-primary/20' : 'bg-[#fbf6f8]'
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${option.tone}`}>{option.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-ink">{option.label}</p>
                    <RolePill role={role as AppRole} className="px-2.5 py-1" />
                  </div>
                  <p className="mt-1 text-sm leading-6 text-soft">{option.note}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-5 rounded-[1.6rem] bg-[#faf6f8] p-4">
          <p className="text-sm font-bold text-ink">Lời nhắn rất ngắn đi kèm</p>
          <p className="mt-1 text-sm leading-6 text-soft">{selectedMoodMeta.note}</p>
          <textarea
            value={note}
            onChange={event => setNote(event.target.value)}
            maxLength={140}
            rows={3}
            placeholder={`Ví dụ: ${ROLE_NAME[role as AppRole]} muốn yên tĩnh một chút thôi.`}
            className="form-input mt-4 min-h-[108px] resize-none"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-soft">{note.length}/140 ký tự</span>
            <button type="button" onClick={handleSaveMood} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Lưu cảm xúc
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="surface-card p-5 md:p-7">
          <p className="section-label">Nhịp chung</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Hai người đang thế nào gần đây</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(['girlfriend', 'boyfriend'] as AppRole[]).map(currentRole => {
              const latest = latestByRole[currentRole];

              return (
                <div key={currentRole} className="rounded-[1.5rem] bg-[#faf6f8] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="section-label">Gần nhất</p>
                      <h3 className="mt-2 text-xl font-black text-ink">{ROLE_NAME[currentRole]}</h3>
                    </div>
                    <RolePill role={currentRole} />
                  </div>

                  {latest ? (
                    <>
                      <p className="mt-4 text-lg font-black text-ink">{latest.mood}</p>
                      <p className="mt-1 text-sm leading-6 text-soft">
                        {latest.note || `Chưa có lời nhắn đi kèm từ ${ROLE_NAME[currentRole].toLowerCase()}.`}
                      </p>
                      <p className="mt-3 text-xs font-bold text-soft">{formatRelativeTime(latest.createdAt ?? latest.date)}</p>
                    </>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-soft">
                      Chưa có cập nhật nào từ {ROLE_NAME[currentRole]}. Khi người này ghi cảm xúc, phần này sẽ hiện ra ngay.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {supportSuggestion ? (
            <div className="mt-4 rounded-[1.5rem] bg-white px-4 py-4 shadow-sm ring-1 ring-black/5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-primary">
                  <MessageCircleHeart size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">Gợi ý phản hồi nhẹ cho hôm nay</p>
                  <p className="mt-1 text-sm leading-6 text-soft">{supportSuggestion}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <MoodColumn title="Cảm xúc của Ni" role="girlfriend" entries={groupedEntries.girlfriend} loading={loading} />
          <MoodColumn title="Cảm xúc của Được" role="boyfriend" entries={groupedEntries.boyfriend} loading={loading} />
        </div>
      </section>
    </div>
  );
};

const MoodColumn: React.FC<{ title: string; role: AppRole; entries: MoodEntry[]; loading: boolean }> = ({
  title,
  role,
  entries,
  loading,
}) => (
  <section className="surface-card p-5 md:p-6">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="section-label">Luồng riêng</p>
        <h2 className="mt-2 text-2xl font-black text-ink">{title}</h2>
      </div>
      <RolePill role={role} />
    </div>

    {loading ? (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={22} />
      </div>
    ) : entries.length === 0 ? (
      <div className="mt-4">
        <EmptyState
          icon={<Sparkles size={18} />}
          title={`Chưa có cảm xúc nào từ ${ROLE_NAME[role]}`}
          description="Khi người này check-in, lịch sử sẽ đứng riêng ở đây thay vì trộn vào một luồng chung."
        />
      </div>
    ) : (
      <div className="mt-4 space-y-3">
        {entries.slice(0, 5).map(entry => (
          <div key={entry._id} className="rounded-[1.35rem] bg-[#faf6f8] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-ink">{entry.mood}</p>
              <span className="text-xs text-soft">{formatRelativeTime(entry.createdAt ?? entry.date)}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-soft">{entry.note || 'Không có lời nhắn đi kèm lần này.'}</p>
          </div>
        ))}
      </div>
    )}
  </section>
);

export default MoodV2;
