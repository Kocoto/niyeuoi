import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Calendar, Clock, Plus, Loader2, PartyPopper, X, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = {
    title: '',
    date: '',
    description: ''
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data.data.sort((a: IEvent, b: IEvent) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (err) {
      console.error('Lỗi khi tải sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: IEvent) => {
    setFormData({
      title: event.title,
      date: new Date(event.date).toISOString().split('T')[0],
      description: event.description || ''
    });
    setEditingId(event._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && editingId) {
        await api.put(`/events/${editingId}`, formData);
      } else {
        await api.post('/events', formData);
      }
      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      setFormData(initialForm);
      fetchEvents();
    } catch (err) {
      alert('Lỗi khi lưu sự kiện!');
    }
  };

  const deleteEvent = async (id: string) => {
    if (!window.confirm('Xóa sự kiện này nhé?')) return;
    try {
      await api.delete(`/events/${id}`);
      fetchEvents();
    } catch (err) {
      alert('Không xóa được!');
    }
  };

  const calculateDaysLeft = (dateStr: string) => {
    const targetDate = new Date(dateStr);
    const today = new Date();
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = targetDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1 font-romantic">Sự kiện & Cột mốc</h1>
          <p className="text-gray-500 text-sm italic text-gray-400">Đừng để lỡ những ngày quan trọng của đôi ta... 🌹</p>
        </div>
        <button 
          onClick={() => { setIsEditing(false); setFormData(initialForm); setShowModal(true); }}
          className="bg-primary text-white p-3 rounded-full shadow-lg hover:rotate-12 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : (
        <div className="space-y-6">
          {events.map((event) => {
            const daysLeft = calculateDaysLeft(event.date);
            return (
              <motion.div key={event._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl shadow-sm border border-pink-50 flex items-center gap-6 relative group">
                <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white font-bold ${daysLeft < 0 ? 'bg-gray-300' : 'bg-primary shadow-lg shadow-pink-100'}`}>
                  {daysLeft === 0 ? <PartyPopper size={32} /> : (
                    <>
                      <span className="text-2xl leading-none">{Math.abs(daysLeft)}</span>
                      <span className="text-[10px] uppercase">{daysLeft > 0 ? 'Ngày nữa' : 'Ngày trước'}</span>
                    </>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{event.title}</h3>
                  <p className="text-gray-500 text-sm flex items-center gap-2"><Calendar size={14} className="text-primary" /> {new Date(event.date).toLocaleDateString('vi-VN')}</p>
                  <p className="text-gray-400 text-xs mt-2 line-clamp-1">{event.description}</p>
                </div>
                {role === 'boyfriend' && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all ml-4">
                    <button onClick={() => handleEdit(event)} className="p-2 text-gray-400 hover:text-primary transition-all"><Pencil size={18} /></button>
                    <button onClick={() => deleteEvent(event._id)} className="p-2 text-gray-400 hover:text-red-400 transition-all"><Trash2 size={18} /></button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm/Sửa Sự Kiện */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm"></motion.div>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 font-romantic">{isEditing ? 'Sửa lịch sự kiện 📅' : 'Lên lịch sự kiện 📅'}</h2>
                <button onClick={() => setShowModal(false)}><X /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:bg-white border-2 border-transparent focus:border-primary transition-all text-sm" placeholder="Tên sự kiện..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <input type="date" required className="w-full bg-gray-50 p-4 rounded-2xl outline-none text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                <textarea className="w-full bg-gray-50 p-4 rounded-2xl outline-none text-sm" placeholder="Mô tả ngắn gọn..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg mt-2 transition-all active:scale-95">
                  {isEditing ? 'Cập nhật sự kiện ❤️' : 'Lưu sự kiện ❤️'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Events;
