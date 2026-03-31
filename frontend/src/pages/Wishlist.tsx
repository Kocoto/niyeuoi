import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ExternalLink, CheckCircle2, Circle, Loader2, Plus, Trash2, X, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface IWish {
  _id: string;
  itemName: string;
  link: string;
  price: number;
  isSecretlyPrepared: boolean;
  status: string;
  note: string;
}

const Wishlist: React.FC = () => {
  const [wishes, setWishes] = useState<IWish[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = {
    itemName: '',
    link: '',
    price: 0,
    isSecretlyPrepared: false,
    note: ''
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchWishes();
  }, [role]);

  const fetchWishes = async () => {
    try {
      const res = await api.get('/wishlist');
      let data = res.data.data;
      if (role === 'girlfriend') {
        data = data.filter((w: IWish) => !w.isSecretlyPrepared);
      }
      setWishes(data);
    } catch (err) {
      console.error('Lỗi khi tải wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (wish: IWish) => {
    setFormData({
      itemName: wish.itemName,
      link: wish.link || '',
      price: wish.price || 0,
      isSecretlyPrepared: wish.isSecretlyPrepared,
      note: wish.note || ''
    });
    setEditingId(wish._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && editingId) {
        await api.put(`/wishlist/${editingId}`, formData);
      } else {
        await api.post('/wishlist', formData);
      }
      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      setFormData(initialForm);
      await fetchWishes();
    } catch (err) {
      alert('Lỗi khi lưu mong muốn!');
    }
  };

  const deleteWish = async (id: string) => {
    if (!window.confirm('Xóa mục này nhé? 🥺')) return;
    try {
      await api.delete(`/wishlist/${id}`);
      await fetchWishes();
    } catch (err) {
      alert('Không xóa được rồi!');
    }
  };

  const toggleStatus = async (wish: IWish) => {
    try {
      const newStatus = wish.status === 'Đang đợi' ? 'Đã mua' : 'Đang đợi';
      await api.put(`/wishlist/${wish._id}`, { status: newStatus });
      await fetchWishes();
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Danh sách Mong muốn</h1>
          <p className="page-subtitle">Những điều nhỏ bé chúng mình cùng ước ao... 🎁</p>
        </div>
        <button
          onClick={() => { setIsEditing(false); setFormData(initialForm); setShowModal(true); }}
          className="btn-add"
        >
          <Plus size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : wishes.length === 0 ? (
        <div className="empty-state">
          <Gift className="text-pink-200 mx-auto mb-3" size={36} />
          <p className="text-gray-400 font-medium">Danh sách trống.</p>
          <p className="text-gray-300 text-sm mt-1">Hãy thêm điều ước đầu tiên của bạn! 🎁</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {wishes.map((wish) => (
            <motion.div 
              key={wish._id}
              whileHover={{ y: -5 }}
              className={`bg-white rounded-[2.5rem] overflow-hidden border-2 shadow-sm transition-all relative group ${wish.status === 'Đã mua' ? 'border-green-100 opacity-75' : 'border-pink-50 hover:border-primary'}`}
            >
              {/* Edit/Delete Overlay */}
              {role === 'boyfriend' && (
                <div className="absolute top-4 right-4 z-10 flex gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(wish)} className="p-2.5 bg-white shadow-sm rounded-xl text-gray-500 hover:text-primary transition-all"><Pencil size={14} /></button>
                  <button onClick={() => deleteWish(wish._id)} className="p-2.5 bg-white shadow-sm rounded-xl text-gray-500 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                </div>
              )}

              <div className="p-5 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div 
                    onClick={() => toggleStatus(wish)}
                    className={`p-4 rounded-[1.5rem] cursor-pointer shadow-sm transition-all ${wish.status === 'Đã mua' ? 'bg-green-100 text-green-600' : 'bg-pink-100 text-primary hover:scale-110 active:scale-95'}`}
                  >
                    <Gift size={28} />
                  </div>
                  {wish.isSecretlyPrepared && (
                    <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                      Lén chuẩn bị 🤫
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">{wish.itemName}</h3>
                <p className="text-gray-500 text-sm mb-6 line-clamp-2">{wish.note || 'Hãy cùng thực hiện điều này nhé!'}</p>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                  <span className="text-lg font-bold text-primary">
                    {wish.price > 0 ? `${wish.price.toLocaleString()}đ` : 'Vô giá'}
                  </span>
                  
                  <div className="flex gap-2">
                    {wish.link && (
                      <a href={wish.link} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-primary transition-colors">
                        <ExternalLink size={20} />
                      </a>
                    )}
                    {wish.status === 'Đã mua' ? (
                      <CheckCircle2 className="text-green-500" size={24} />
                    ) : (
                      <Circle className="text-gray-200" size={24} />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Thêm/Sửa Mong Muốn */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm"></motion.div>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{isEditing ? 'Cập nhật điều ước ✨' : 'Ước một điều mới ✨'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 px-1">Tên món đồ / Địa điểm</label>
                  <input required className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:bg-white border-2 border-transparent focus:border-primary transition-all text-sm" placeholder="Bạn đang mong chờ điều gì..." value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 px-1">Link tham khảo (nếu có)</label>
                  <input className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:bg-white border-2 border-transparent focus:border-primary transition-all text-sm" placeholder="Dán link sản phẩm vào đây..." value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 px-1">Giá dự kiến</label>
                    <input type="number" className="w-full bg-gray-50 p-4 rounded-2xl outline-none text-sm" placeholder="Giá..." value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})} />
                  </div>
                  {role === 'boyfriend' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1 px-1">Bí mật</label>
                      <div className="flex items-center h-full gap-2 px-2 text-xs font-bold text-gray-500">
                        <input type="checkbox" id="secret" className="w-4 h-4 rounded text-primary" checked={formData.isSecretlyPrepared} onChange={e => setFormData({...formData, isSecretlyPrepared: e.target.checked})} />
                        <label htmlFor="secret">Lén chuẩn bị 🤫</label>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1 px-1">Ghi chú</label>
                  <textarea className="w-full bg-gray-50 p-4 rounded-2xl outline-none text-sm" rows={2} placeholder="Nhắn nhủ gì thêm không nè..." value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-100 hover:scale-[1.02] active:scale-95 transition-all mt-2">
                  {isEditing ? 'Cập nhật mong muốn ❤️' : 'Gửi điều ước ❤️'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wishlist;
