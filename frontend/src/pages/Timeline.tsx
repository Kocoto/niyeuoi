import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { motion } from 'framer-motion';
import { Calendar, Heart, Loader2 } from 'lucide-react';

interface IMemory {
  _id: string;
  title: string;
  date: string;
  content: string;
  media: string[];
  mood: string;
}

const Timeline: React.FC = () => {
  const [memories, setMemories] = useState<IMemory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const res = await api.get('/memories');
      setMemories(res.data.data);
    } catch (err) {
      console.error('Lỗi khi tải kỷ niệm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 md:px-4 py-6 md:py-8">
      <div className="text-center mb-10 md:mb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Dòng thời gian Kỷ niệm</h1>
        <p className="text-gray-600 italic text-sm md:text-base px-4">Nơi lưu giữ những thước phim hạnh phúc của hai ta... 🎞️</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="relative border-l-2 border-pink-200 ml-6 md:ml-0 md:left-1/2">
          {memories.map((memory, index) => (
            <motion.div 
              key={memory._id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`mb-8 md:mb-12 relative w-full md:w-1/2 pl-8 md:pl-0 ${index % 2 === 0 ? 'md:pr-12 md:text-right md:left-[-50%]' : 'md:pl-12 md:left-[50%]'}`}
            >
              {/* Dot trên trục */}
              <div className="absolute top-2 w-5 h-5 bg-primary rounded-full border-4 border-white shadow-sm -left-[11px] md:left-auto md:right-[-10px] md:group-even:left-[-10px] desktop-dot">
                <style>{`
                  @media (min-width: 768px) {
                    .mb-8:nth-child(even) .desktop-dot { right: auto; left: -10px; }
                    .mb-8:nth-child(odd) .desktop-dot { right: -10px; left: auto; }
                  }
                `}</style>
              </div>

              <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-pink-50 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-center gap-2 text-primary font-bold mb-2 justify-start md:justify-normal">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar size={14} />
                    {new Date(memory.date).toLocaleDateString('vi-VN')}
                  </div>
                  <span className="ml-auto bg-pink-100 text-primary text-[10px] px-2 py-1 rounded-lg uppercase">{memory.mood}</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 md:mb-3">{memory.title}</h3>
                
                {memory.media && memory.media.length > 0 && (
                  <div className="mb-3 md:mb-4 overflow-hidden rounded-xl md:rounded-2xl bg-gray-100 aspect-video flex items-center justify-center">
                    <img src={memory.media[0]} alt={memory.title} className="w-full h-full object-cover" />
                  </div>
                )}
                
                <p className="text-gray-600 leading-relaxed text-xs md:text-sm">
                  {memory.content}
                </p>
              </div>
            </motion.div>
          ))}
          
          {memories.length === 0 && (
            <div className="text-center py-20 md:left-[-50%] md:w-[200%] relative">
              <Heart className="mx-auto text-pink-200 mb-4" size={40} />
              <p className="text-gray-400 px-10">Chưa có kỷ niệm nào được ghi lại. Hãy bắt đầu viết chương đầu tiên nhé!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Timeline;
