import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle2, Circle, Loader2, Plus, X, Trash2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

interface IChallenge {
  _id: string;
  title: string;
  description: string;
  points: number;
  isCompleted: boolean;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  isAiGenerated?: boolean;
}

const Challenges: React.FC = () => {
  const [challenges, setChallenges] = useState<IChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const { toast, confirm } = useUI();
  
  const [showModal, setShowModal] = useState(false);
  const [detailChallenge, setDetailChallenge] = useState<IChallenge | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 10,
    difficulty: 'Dễ' as const
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const res = await api.get('/challenges');
      setChallenges(res.data.data);
    } catch (err) {
      console.error('Lỗi khi tải thử thách');
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (challenge: IChallenge) => {
    try {
      await api.put(`/challenges/${challenge._id}`, { isCompleted: !challenge.isCompleted });
      await fetchChallenges();
    } catch (err) {
      toast('Lỗi cập nhật trạng thái!', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/challenges', formData);
      setShowModal(false);
      setFormData({ title: '', description: '', points: 10, difficulty: 'Dễ' });
      await fetchChallenges();
    } catch (err) {
      toast('Lỗi khi thêm thử thách!', 'error');
    }
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      await api.post('/challenges/generate');
      await fetchChallenges();
      toast('AI vừa tạo thử thách mới! 🎉', 'success');
    } catch (err) {
      toast('AI đang bận, thử lại sau nhé!', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const deleteChallenge = async (id: string) => {
    if (!await confirm('Xóa thử thách này nhé?')) return;
    try {
      await api.delete(`/challenges/${id}`);
      await fetchChallenges();
    } catch (err) {
      toast('Không xóa được!', 'error');
    }
  };

  const totalPoints = challenges.reduce((acc, curr) => curr.isCompleted ? acc + curr.points : acc, 0);
  const pendingList = challenges.filter(c => !c.isCompleted);
  const completedList = challenges.filter(c => c.isCompleted);
  const displayList = activeTab === 'pending' ? pendingList : completedList;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Thử thách Tình yêu</h1>
          <p className="page-subtitle">Cùng nhau hoàn thành để hâm nóng tình cảm nhé... 🔥</p>
        </div>
        
        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-pink-100 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Tổng điểm tích lũy</p>
            <p className="text-xl font-black text-gray-800 leading-none">{totalPoints} ✨</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* Tabs + Actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
              >
                <Zap size={13} /> Đang làm
                {pendingList.length > 0 && <span className="bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">{pendingList.length}</span>}
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'completed' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
              >
                <CheckCircle2 size={13} /> Hoàn thành
                {completedList.length > 0 && <span className="bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">{completedList.length}</span>}
              </button>
            </div>
            <div className="flex gap-2">
              {role === 'boyfriend' && (
                <button
                  onClick={handleAiGenerate}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold text-xs px-3 py-2 rounded-xl transition-all disabled:opacity-60"
                >
                  {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <span>✨</span>}
                  AI sinh
                </button>
              )}
              <button onClick={() => setShowModal(true)} className="btn-add !p-2">
                <Plus size={18} />
              </button>
            </div>
          </div>

          {displayList.map((challenge) => (
            <motion.div 
              key={challenge._id}
              whileTap={{ scale: 0.98 }}
              className={`bg-white p-5 rounded-[2rem] border-2 transition-all flex items-center gap-4 group ${challenge.isCompleted ? 'border-green-50 bg-gray-50/50 grayscale' : 'border-pink-50 hover:border-primary shadow-sm'}`}
            >
              <button 
                onClick={() => toggleComplete(challenge)}
                className={`p-1 rounded-full transition-colors ${challenge.isCompleted ? 'text-green-500' : 'text-gray-200 hover:text-primary'}`}
              >
                {challenge.isCompleted ? <CheckCircle2 size={28} /> : <Circle size={28} />}
              </button>

              <div className="flex-1 cursor-pointer" onClick={() => setDetailChallenge(challenge)}>
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold ${challenge.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{challenge.title}</h3>
                  {challenge.isAiGenerated && <span className="text-[9px] font-bold bg-purple-100 text-purple-500 px-1.5 py-0.5 rounded-full shrink-0">✨ AI</span>}
                </div>
                <p className="text-xs text-gray-400 line-clamp-1">{challenge.description}</p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  challenge.difficulty === 'Dễ' ? 'bg-green-100 text-green-600' : 
                  challenge.difficulty === 'Trung bình' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                }`}>
                  {challenge.difficulty}
                </span>
                <span className="text-xs font-black text-primary">+{challenge.points}đ</span>
              </div>

              {role === 'boyfriend' && (
                <button onClick={() => deleteChallenge(challenge._id)} className="p-2.5 text-gray-300 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-all rounded-xl shrink-0">
                  <Trash2 size={16} />
                </button>
              )}
            </motion.div>
          ))}

          {displayList.length === 0 && (
            <div className="empty-state">
              <Trophy className="text-pink-200 mx-auto mb-3" size={36} />
              {activeTab === 'pending' ? (
                <>
                  <p className="text-gray-400 font-medium">Không có thử thách nào đang chờ.</p>
                  <p className="text-gray-300 text-sm mt-1">Tạo thêm hoặc để AI sinh thử thách mới nhé! 🔥</p>
                </>
              ) : (
                <>
                  <p className="text-gray-400 font-medium">Chưa hoàn thành thử thách nào.</p>
                  <p className="text-gray-300 text-sm mt-1">Cùng nhau chinh phục nhé! 💪</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Chi Tiết Thử Thách */}
      <AnimatePresence>
        {detailChallenge && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailChallenge(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
            >
              <button onClick={() => setDetailChallenge(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X /></button>

              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold mb-4 ${
                detailChallenge.difficulty === 'Dễ' ? 'bg-green-100 text-green-600' :
                detailChallenge.difficulty === 'Trung bình' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
              }`}>
                {detailChallenge.difficulty}
                {detailChallenge.isAiGenerated && <span className="bg-purple-100 text-purple-500 px-1.5 py-0.5 rounded-full">✨ AI</span>}
              </div>

              <h2 className={`text-2xl font-bold mb-3 ${detailChallenge.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {detailChallenge.title}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                {detailChallenge.description || 'Không có mô tả.'}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-2xl font-black text-primary">+{detailChallenge.points} ✨</span>
                <button
                  onClick={() => { toggleComplete(detailChallenge); setDetailChallenge(null); }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                    detailChallenge.isCompleted
                      ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      : 'bg-primary text-white shadow-lg shadow-pink-100 hover:scale-[1.02]'
                  }`}
                >
                  {detailChallenge.isCompleted ? <><Circle size={16} /> Bỏ hoàn thành</> : <><CheckCircle2 size={16} /> Hoàn thành! 🎉</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Thêm Thử Thách */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm"></motion.div>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 font-romantic">Tạo thử thách mới 🔥</h2>
                <button onClick={() => setShowModal(false)}><X /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required className="w-full bg-gray-50 p-4 rounded-2xl outline-none" placeholder="Tiêu đề (Ví dụ: Cùng đi xem phim...)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <textarea className="w-full bg-gray-50 p-4 rounded-2xl outline-none" placeholder="Mô tả thử thách..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <select className="w-full bg-gray-50 p-4 rounded-2xl outline-none" value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value as any})}>
                    <option value="Dễ">Dễ</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Khó">Khó</option>
                  </select>
                  <input type="number" className="w-full bg-gray-50 p-4 rounded-2xl outline-none" placeholder="Điểm thưởng..." value={formData.points} onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 0})} />
                </div>
                <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg mt-4 transition-all active:scale-95">Bắt đầu thử thách 💖</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Challenges;
