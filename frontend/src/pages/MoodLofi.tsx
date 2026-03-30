import React, { useState } from 'react';
import { Music, Music2, Volume2, Heart, Smile, Frown, Coffee, CloudRain, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';

const moods = [
  { icon: <Smile className="text-yellow-500" />, label: 'Hạnh phúc', color: 'bg-yellow-50' },
  { icon: <Heart className="text-pink-500" />, label: 'Đang yêu', color: 'bg-pink-50' },
  { icon: <Coffee className="text-brown-500" />, label: 'Bình yên', color: 'bg-orange-50' },
  { icon: <CloudRain className="text-blue-500" />, label: 'Hơi buồn', color: 'bg-blue-50' },
  { icon: <Frown className="text-gray-500" />, label: 'Mệt mỏi', color: 'bg-gray-100' },
];

const MoodLofi: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMoodSelect = async (label: string) => {
    setSelectedMood(label);
    setLoading(true);
    try {
      await api.post('/moods', { mood: label, note: 'Cập nhật từ Lofi Room' });
      alert(`Đã ghi lại tâm trạng "${label}" của bạn. Mong bạn luôn vui vẻ! ❤️`);
    } catch (err) {
      console.error('Lỗi khi lưu tâm trạng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Mood Tracker */}
        <div className="lg:col-span-1 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 font-romantic">Góc Cảm xúc</h1>
            <p className="text-gray-500 text-sm italic">Hôm nay bạn thấy thế nào? ✨</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {moods.map((mood) => (
              <motion.button
                key={mood.label}
                whileHover={{ x: 10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMoodSelect(mood.label)}
                disabled={loading}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${selectedMood === mood.label ? 'border-primary bg-white shadow-md' : 'border-transparent bg-white shadow-sm hover:shadow-md'}`}
              >
                <div className={`p-3 rounded-xl ${mood.color}`}>
                  {mood.icon}
                </div>
                <span className="font-bold text-gray-700">{mood.label}</span>
                {loading && selectedMood === mood.label && <Loader2 className="ml-auto animate-spin text-primary" size={16} />}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right: Lofi Room */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-gray-800 aspect-video relative group">
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0&controls=1&rel=0" 
              title="Lofi Music"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
            
            <div className="absolute bottom-6 left-6 flex items-center gap-2 text-white/50 text-xs bg-black/40 backdrop-blur-md px-4 py-2 rounded-full pointer-events-none">
              <Music2 size={14} className="animate-pulse" />
              <span>Đang phát: Lofi Girl Radio</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-pink-50 shadow-sm flex items-center gap-6">
            <div className="p-4 bg-pink-100 rounded-2xl text-primary">
              <Volume2 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Không gian thư giãn</h3>
              <p className="text-sm text-gray-500 italic">Bật nhạc lên, chọn một cảm xúc và cùng tận hưởng khoảnh khắc này nhé.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MoodLofi;
