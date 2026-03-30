import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Calendar, Clock, Plus, Loader2, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface IEvent {
  _id: string;
  title: string;
  date: string;
  description: string;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data.data);
    } catch (err) {
      console.error('Lỗi khi tải sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysLeft = (dateStr: string) => {
    const targetDate = new Date(dateStr);
    const today = new Date();
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diff = targetDate.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1 font-romantic">Sự kiện & Cột mốc</h1>
          <p className="text-gray-500 text-sm">Đừng để lỡ những ngày quan trọng của đôi ta... 🌹</p>
        </div>
        {role === 'boyfriend' && (
          <button className="bg-primary text-white p-3 rounded-full shadow-lg">
            <Plus size={20} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event) => {
            const daysLeft = calculateDaysLeft(event.date);
            return (
              <motion.div 
                key={event._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-pink-50 flex items-center gap-6"
              >
                <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white font-bold ${daysLeft < 0 ? 'bg-gray-300' : 'bg-primary shadow-lg shadow-pink-200'}`}>
                  {daysLeft === 0 ? (
                    <PartyPopper size={32} />
                  ) : (
                    <>
                      <span className="text-2xl leading-none">{Math.abs(daysLeft)}</span>
                      <span className="text-[10px] uppercase">{daysLeft > 0 ? 'Ngày nữa' : 'Ngày trước'}</span>
                    </>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{event.title}</h3>
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />
                    {new Date(event.date).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="text-gray-400 text-xs mt-2 line-clamp-1">{event.description}</p>
                </div>

                <div className="hidden md:block">
                  {daysLeft > 0 ? (
                    <div className="flex items-center gap-2 text-secondary font-bold text-sm">
                      <Clock size={16} /> Sắp tới
                    </div>
                  ) : daysLeft === 0 ? (
                    <div className="text-red-500 font-black animate-bounce">HÔM NAY! ❤️</div>
                  ) : (
                    <div className="text-gray-400 text-sm italic font-medium">Đã qua</div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {events.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <p className="text-gray-400">Chưa có sự kiện nào được lên lịch. Hãy thêm ngay nhé! ✨</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Events;
