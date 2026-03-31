import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Ticket, CheckCircle, Loader2, Plus, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface ICoupon {
  _id: string;
  title: string;
  description: string;
  isUsed: boolean;
}

const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data.data);
    } catch (err) {
      console.error('Lỗi khi tải voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/coupons', formData);
      setShowModal(false);
      setFormData({ title: '', description: '' });
      fetchCoupons();
    } catch (err) {
      alert('Lỗi khi tặng voucher!');
    }
  };

  const useCoupon = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn sử dụng tấm vé này không? 💕')) return;
    try {
      await api.put(`/coupons/${id}`, { isUsed: true });
      fetchCoupons();
    } catch (err) {
      alert('Không thể sử dụng voucher lúc này!');
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!window.confirm('Thu hồi tấm vé này nhé?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      fetchCoupons();
    } catch (err) {
      alert('Không xóa được!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1 font-romantic">Ví Voucher Tình yêu</h1>
          <p className="text-gray-500 text-sm italic">Những đặc quyền dành riêng cho bạn... 🎟️</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary text-white p-3 rounded-full shadow-lg">
          <Plus size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.map((coupon) => (
            <motion.div key={coupon._id} whileTap={{ scale: 0.98 }} className={`relative overflow-hidden flex bg-white rounded-2xl shadow-sm border-2 transition-all group ${coupon.isUsed ? 'grayscale opacity-60 border-gray-100' : 'border-pink-100 hover:border-primary'}`}>
              <div className={`w-24 flex items-center justify-center border-r-2 border-dashed ${coupon.isUsed ? 'bg-gray-50 text-gray-400' : 'bg-pink-50 text-primary border-pink-100'}`}>
                <Ticket size={32} />
              </div>
              <div className="flex-1 p-5 relative">
                {role === 'boyfriend' && (
                  <button onClick={() => deleteCoupon(coupon._id)} className="absolute top-3 right-3 p-2 text-gray-300 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                )}
                <h3 className="text-lg font-bold text-gray-800 mb-1">{coupon.title}</h3>
                <p className="text-gray-500 text-xs mb-4 line-clamp-2">{coupon.description}</p>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">LOVE-{coupon._id.slice(-4)}</span>
                  {!coupon.isUsed ? (
                    <button onClick={() => useCoupon(coupon._id)} className="bg-primary text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-opacity-90 transition-all">Sử dụng ngay</button>
                  ) : (
                    <div className="flex items-center gap-1 text-green-500 text-xs font-bold"><CheckCircle size={14} /> Đã dùng</div>
                  )}
                </div>
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 bg-background rounded-full border-2 border-pink-100"></div>
              <div className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-background rounded-full border-2 border-pink-100"></div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Thêm Voucher */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm"></motion.div>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Tặng vé đặc quyền 🎫</h2>
                <button onClick={() => setShowModal(false)}><X /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required className="w-full bg-gray-50 p-4 rounded-2xl outline-none" placeholder="Tên voucher (Ví dụ: 15p mát-xa...)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <textarea required className="w-full bg-gray-50 p-4 rounded-2xl outline-none" placeholder="Mô tả quyền lợi của tấm vé này..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg mt-4">Gửi tặng ngay 🎁</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Coupons;
