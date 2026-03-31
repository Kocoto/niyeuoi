import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Loader2, Plus, X, Trash2, Camera, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const { role } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const initialForm = {
    title: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    media: '',
    mood: 'Hạnh phúc'
  };

  const [formData, setFormData] = useState(initialForm);

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

  const handleEdit = (memory: IMemory) => {
    setFormData({
      title: memory.title,
      date: new Date(memory.date).toISOString().split('T')[0],
      content: memory.content,
      media: memory.media?.[0] || '',
      mood: memory.mood || 'Hạnh phúc'
    });
    setEditingId(memory._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('image', file);
    try {
      const res = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, media: res.data.data.url });
    } catch (err) {
      alert('Lỗi tải ảnh!');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, media: formData.media ? [formData.media] : [] };
      if (isEditing && editingId) {
        await api.put(`/memories/${editingId}`, data);
      } else {
        await api.post('/memories', data);
      }
      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      setFormData(initialForm);
      fetchMemories();
    } catch (err) {
      alert('Lỗi khi lưu kỷ niệm!');
    }
  };

  const deleteMemory = async (id: string) => {
    if (!window.confirm('Xóa kỷ niệm này? 🥺')) return;
    try {
      await api.delete(`/memories/${id}`);
      fetchMemories();
    } catch (err) {
      alert('Không xóa được rồi!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-2 md:px-4 py-6 md:py-8 pb-24 md:pb-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dòng thời gian Kỷ niệm</h1>
          <p className="page-subtitle">Nơi lưu giữ những thước phim hạnh phúc của hai ta... 🎞️</p>
        </div>
        <button
          onClick={() => { setIsEditing(false); setFormData(initialForm); setShowModal(true); }}
          className="btn-add"
        >
          <Plus size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : (
        <div className="relative border-l-2 border-pink-200 ml-6 md:ml-0 md:left-1/2">
          {memories.map((memory, index) => (
            <motion.div key={memory._id} initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className={`mb-8 md:mb-12 relative w-full md:w-1/2 pl-8 md:pl-0 ${index % 2 === 0 ? 'md:pr-12 md:text-right md:left-[-50%]' : 'md:pl-12 md:left-[50%]'}`}>
              <div className="absolute top-2 w-5 h-5 bg-primary rounded-full border-4 border-white shadow-sm -left-[11px] md:left-auto md:right-[-10px] desktop-dot"></div>

              <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-pink-50 hover:shadow-md transition-shadow relative group">
                {role === 'boyfriend' && (
                  <div className="absolute top-3 right-3 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEdit(memory)} className="p-2 text-gray-400 hover:text-primary rounded-lg"><Pencil size={16} /></button>
                    <button onClick={() => deleteMemory(memory._id)} className="p-2 text-gray-400 hover:text-red-400 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                )}
                <div className={`flex flex-wrap items-center gap-2 text-primary font-bold mb-2 ${index % 2 === 0 ? 'md:justify-end' : 'justify-start'}`}>
                  <div className="flex items-center gap-1 text-sm order-2 md:order-none">
                    <Calendar size={14} />
                    {new Date(memory.date).toLocaleDateString('vi-VN')}
                  </div>
                  <span className="bg-pink-100 text-primary text-[10px] px-2 py-1 rounded-lg uppercase">{memory.mood}</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 md:mb-3 line-clamp-2">{memory.title}</h3>
                
                {memory.media && memory.media.length > 0 && (
                  <div className="mb-3 md:mb-4 overflow-hidden rounded-xl md:rounded-2xl bg-gray-100 aspect-video flex items-center justify-center">
                    <img src={memory.media[0]} alt={memory.title} className="w-full h-full object-cover" />
                  </div>
                )}
                
                <p className="text-gray-600 leading-relaxed text-xs md:text-sm">{memory.content}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Thêm/Sửa Kỷ Niệm */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm"></motion.div>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 font-romantic">{isEditing ? 'Sửa lại kỷ niệm 📝' : 'Ghi lại kỷ niệm 📝'}</h2>
                <button onClick={() => setShowModal(false)}><X /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative aspect-video bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden group cursor-pointer">
                  {formData.media ? <img src={formData.media} alt="Preview" className="w-full h-full object-cover" /> : (
                    <div className="text-center">{uploading ? <Loader2 className="animate-spin text-primary mx-auto" /> : <><Camera className="text-gray-400 mx-auto mb-2" /><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Chọn ảnh kỷ niệm</span></>}</div>
                  )}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={uploading} />
                </div>
                <input required className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:bg-white border-2 border-transparent focus:border-primary transition-all text-sm" placeholder="Tiêu đề kỷ niệm..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <input type="date" required className="w-full bg-gray-50 p-4 rounded-2xl outline-none text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                <textarea required className="w-full bg-gray-50 p-4 rounded-2xl outline-none text-sm" rows={3} placeholder="Hôm đó chúng mình đã thế nào..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                <div className="flex flex-wrap gap-2">
                  {['Hạnh phúc', 'Đang yêu', 'Bình yên', 'Cảm động', 'Vui vẻ'].map(m => (
                    <button key={m} type="button" onClick={() => setFormData({...formData, mood: m})} className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${formData.mood === m ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}>{m}</button>
                  ))}
                </div>
                <button type="submit" disabled={uploading} className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg mt-2 disabled:opacity-50">
                  {isEditing ? 'Cập nhật kỷ niệm ❤️' : 'Lưu lại mãi mãi ❤️'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Timeline;
