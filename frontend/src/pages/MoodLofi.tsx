import React, { useState } from 'react';
import { Coffee, CloudRain, Heart, Loader2, Music2, Smile, Sparkles, Volume2, Frown } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';
import { useUI } from '../context/UIContext';

const moods = [
  { icon: <Smile className="text-yellow-500" />, label: 'Hạnh phúc', note: 'Hôm nay có điều gì đó nhẹ và vui.', tone: 'bg-yellow-50' },
  { icon: <Heart className="text-pink-500" />, label: 'Đang yêu', note: 'Muốn lưu lại cảm giác gần nhau thật lâu.', tone: 'bg-pink-50' },
  { icon: <Coffee className="text-orange-500" />, label: 'Bình yên', note: 'Một ngày không cần ồn ào nhưng vẫn đủ ấm.', tone: 'bg-orange-50' },
  { icon: <CloudRain className="text-blue-500" />, label: 'Hơi buồn', note: 'Cần một góc chậm lại để thở cùng nhau.', tone: 'bg-blue-50' },
  { icon: <Frown className="text-gray-500" />, label: 'Mệt mỏi', note: 'Có lẽ hôm nay chỉ cần dịu đi một chút.', tone: 'bg-gray-100' },
];

const MoodLofi: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useUI();

  const handleMoodSelect = async (label: string) => {
    setSelectedMood(label);
    setLoading(true);
    try {
      await api.post('/moods', { mood: label, note: 'Cập nhật từ Góc cảm xúc' });
      toast(`Đã ghi lại cảm xúc: ${label}`, 'success');
    } catch {
      toast('Chưa lưu được cảm xúc lần này.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="surface-card-strong overflow-hidden p-5 md:p-7">
        <p className="section-label">Cảm xúc và trò chuyện</p>
        <h1 className="page-title mt-2">Góc cảm xúc</h1>
        <p className="page-subtitle">Một lần chạm nhẹ để app biết hôm nay nên dịu, vui hay cần chậm lại cùng bạn.</p>

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
                <p className="text-sm font-bold text-ink">{mood.label}</p>
                <p className="mt-1 text-sm text-soft">{mood.note}</p>
              </div>
              {loading && selectedMood === mood.label ? <Loader2 className="animate-spin text-primary" size={16} /> : <Sparkles size={16} className="text-soft" />}
            </motion.button>
          ))}
        </div>
      </section>

      <section className="surface-card p-5 md:p-7">
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
              <p className="text-sm font-bold text-ink">Một góc đủ riêng để hạ nhịp</p>
              <p className="mt-1 text-sm text-soft">Bật nhạc, chọn cảm xúc, rồi quay lại những câu hỏi hoặc kỷ niệm khi bạn sẵn sàng.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MoodLofi;
