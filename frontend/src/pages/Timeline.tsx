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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Dòng thời gian Kỷ niệm</h1>
        <p className="text-gray-600 italic">Nơi lưu giữ những thước phim hạnh phúc của hai ta... 🎞️</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="relative border-l-2 border-pink-200 ml-4 md:ml-0 md:left-1/2">
          {memories.map((memory, index) => (
            <motion.div 
              key={memory._id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`mb-12 relative w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right md:left-[-50%]' : 'md:pl-12 md:left-[50%]'}`}
            >
              {/* Dot trên trục */}
              <div className="absolute top-0 w-6 h-6 bg-primary rounded-full border-4 border-white shadow-sm left-[-13px] md:left-auto md:right-[-11px] index-%-2-conditional-dot">
                <style>{`
                  @media (min-width: 768px) {
                    .mb-12:nth-child(even) .index-%-2-conditional-dot { right: auto; left: -11px; }
                    .mb-12:nth-child(odd) .index-%-2-conditional-dot { right: -11px; left: auto; }
                  }
                `}</style>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-pink-50 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-primary font-bold mb-2 justify-start md:justify-normal">
                  <Calendar size={16} />
                  {new Date(memory.date).toLocaleDateString('vi-VN')}
                  <span className="ml-auto bg-pink-100 text-primary text-xs px-2 py-1 rounded-lg">{memory.mood}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{memory.title}</h3>
                
                {memory.media && memory.media.length > 0 && (
                  <div className="mb-4 overflow-hidden rounded-2xl bg-gray-100 aspect-video flex items-center justify-center">
                    <img src={memory.media[0]} alt={memory.title} className="w-full h-full object-cover" />
                  </div>
                )}
                
                <p className="text-gray-600 leading-relaxed text-sm">
                  {memory.content}
                </p>
              </div>
            </motion.div>
          ))}
          
          {memories.length === 0 && (
            <div className="text-center py-20 md:left-[-50%] md:w-[200%] relative">
              <Heart className="mx-auto text-pink-200 mb-4" size={48} />
              <p className="text-gray-400">Chưa có kỷ niệm nào được ghi lại. Hãy bắt đầu viết chương đầu tiên nhé!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Timeline;
