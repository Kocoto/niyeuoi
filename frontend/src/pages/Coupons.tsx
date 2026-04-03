import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Ticket, CheckCircle, Loader2, Plus, X, Trash2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { ROLE_NAME } from '../constants/roles';

interface ICoupon {
  _id: string;
  title: string;
  description: string;
  isUsed: boolean;
  isAiGenerated?: boolean;
  createdBy: 'boyfriend' | 'girlfriend';
}

const ROLE_LABEL = ROLE_NAME;

const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const { toast, confirm } = useUI();

  const [showModal, setShowModal] = useState(false);
  const [detailCoupon, setDetailCoupon] = useState<ICoupon | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'mine' | 'theirs'>('theirs');
  const [formData, setFormData] = useState({ title: '', description: '' });

  useEffect(() => { fetchCoupons(); }, []);

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
      await api.post('/coupons', { ...formData, createdBy: role });
      setShowModal(false);
      setFormData({ title: '', description: '' });
      await fetchCoupons();
    } catch (err) {
      toast('Lỗi khi tặng voucher!', 'error');
    }
  };

  const useCoupon = async (id: string) => {
    if (!await confirm('Bạn có chắc muốn sử dụng tấm vé này không? 💕')) return;
    try {
      await api.put(`/coupons/${id}`, { isUsed: true });
      await fetchCoupons();
    } catch (err) {
      toast('Không thể sử dụng voucher lúc này!', 'error');
    }
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      await api.post('/coupons/generate');
      await fetchCoupons();
      toast('AI vừa tạo voucher mới! 🎉', 'success');
    } catch (err) {
      toast('AI đang bận, thử lại sau nhé!', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!await confirm('Thu hồi tấm vé này nhé?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      await fetchCoupons();
    } catch (err) {
      toast('Không xóa được!', 'error');
    }
  };

  // "Tôi nhận" = người khác tặng mình; "Tôi tặng" = mình tặng người khác
  const theirCoupons = coupons.filter(c => c.createdBy !== role);
  const myCoupons = coupons.filter(c => c.createdBy === role);
  const displayList = activeTab === 'theirs' ? theirCoupons : myCoupons;

  const oppositeRole = role === 'boyfriend' ? 'girlfriend' : 'boyfriend';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ví Voucher Tình yêu</h1>
          <p className="page-subtitle">Những đặc quyền dành riêng cho bạn... 🎟️</p>
        </div>
        <div className="flex gap-2">
          {role === 'boyfriend' && (
            <button
              onClick={handleAiGenerate}
              disabled={aiLoading}
              className="flex items-center gap-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold text-xs px-3 py-2 rounded-xl transition-all disabled:opacity-60"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              AI sinh
            </button>
          )}
          <button onClick={() => setShowModal(true)} className="btn-add">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-2xl p-1 gap-1 mb-6">
            <button
              onClick={() => setActiveTab('theirs')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'theirs' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
            >
              🎁 {ROLE_LABEL[oppositeRole]} tặng tôi
              {theirCoupons.filter(c => !c.isUsed).length > 0 && (
                <span className="bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                  {theirCoupons.filter(c => !c.isUsed).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'mine' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
            >
              💌 Tôi đã tặng
              {myCoupons.filter(c => !c.isUsed).length > 0 && (
                <span className="bg-pink-200 text-pink-700 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                  {myCoupons.filter(c => !c.isUsed).length}
                </span>
              )}
            </button>
          </div>

          {displayList.length === 0 ? (
            <div className="empty-state">
              <Ticket className="text-pink-200 mx-auto mb-3" size={36} />
              {activeTab === 'theirs' ? (
                <>
                  <p className="text-gray-400 font-medium">{ROLE_LABEL[oppositeRole]} chưa tặng voucher nào.</p>
                  <p className="text-gray-300 text-sm mt-1">Hãy nhắc {ROLE_LABEL[oppositeRole].toLowerCase()} tặng bạn một đặc quyền nào! 🥺</p>
                </>
              ) : (
                <>
                  <p className="text-gray-400 font-medium">Bạn chưa tặng voucher nào.</p>
                  <p className="text-gray-300 text-sm mt-1">Tặng {ROLE_LABEL[oppositeRole].toLowerCase()} một đặc quyền đặc biệt nào! 🎁</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayList.map((coupon) => (
                <motion.div
                  key={coupon._id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDetailCoupon(coupon)}
                  className={`relative overflow-hidden flex bg-white rounded-2xl shadow-sm border-2 transition-all group cursor-pointer ${coupon.isUsed ? 'grayscale opacity-60 border-gray-100' : 'border-pink-100 hover:border-primary'}`}
                >
                  <div className={`w-20 flex flex-col items-center justify-center border-r-2 border-dashed gap-1 ${coupon.isUsed ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-pink-50 text-primary border-pink-100'}`}>
                    <Ticket size={28} />
                    <span className="text-[9px] font-bold text-center leading-tight px-1">
                      {ROLE_LABEL[coupon.createdBy]}
                    </span>
                  </div>
                  <div className="flex-1 p-5 relative">
                    {role === 'boyfriend' && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteCoupon(coupon._id); }}
                        className="absolute top-3 right-3 p-2 text-gray-300 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-gray-800 leading-tight">{coupon.title}</h3>
                    </div>
                    <p className="text-gray-500 text-xs mb-3 line-clamp-2">{coupon.description}</p>
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">LOVE-{coupon._id.slice(-4)}</span>
                      {coupon.isUsed ? (
                        <div className="flex items-center gap-1 text-green-500 text-xs font-bold"><CheckCircle size={14} /> Đã dùng</div>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); useCoupon(coupon._id); }}
                          className="bg-primary text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-opacity-90 transition-all"
                        >
                          Sử dụng
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 bg-background rounded-full border-2 border-pink-100" />
                  <div className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-background rounded-full border-2 border-pink-100" />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal Chi Tiết Voucher */}
      <AnimatePresence>
        {detailCoupon && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailCoupon(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className={`flex items-center gap-4 px-8 py-6 ${detailCoupon.isUsed ? 'bg-gray-50' : 'bg-pink-50'}`}>
                <div className={`p-4 rounded-2xl ${detailCoupon.isUsed ? 'bg-gray-200 text-gray-400' : 'bg-white text-primary shadow-sm'}`}>
                  <Ticket size={32} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-xl font-bold text-gray-800">{detailCoupon.title}</h2>
                    {detailCoupon.isAiGenerated && <span className="text-[9px] font-bold bg-purple-100 text-purple-500 px-1.5 py-0.5 rounded-full">✨ AI</span>}
                  </div>
                  <p className="text-xs text-gray-500">
                    🎀 <span className="font-semibold">{ROLE_LABEL[detailCoupon.createdBy]}</span> tặng {ROLE_LABEL[detailCoupon.createdBy === 'boyfriend' ? 'girlfriend' : 'boyfriend'].toLowerCase()}
                  </p>
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">LOVE-{detailCoupon._id.slice(-4)}</span>
                </div>
                <button onClick={() => setDetailCoupon(null)} className="text-gray-400 hover:text-gray-600 shrink-0"><X /></button>
              </div>

              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full bg-gray-100 -ml-2.5 shrink-0" />
                <div className="flex-1 border-t-2 border-dashed border-gray-100 mx-2" />
                <div className="w-5 h-5 rounded-full bg-gray-100 -mr-2.5 shrink-0" />
              </div>

              <div className="px-8 py-6">
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  {detailCoupon.description || 'Không có mô tả.'}
                </p>

                {detailCoupon.isUsed ? (
                  <div className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-600 font-bold rounded-2xl">
                    <CheckCircle size={18} /> Voucher đã được sử dụng
                  </div>
                ) : (
                  <button
                    onClick={() => { useCoupon(detailCoupon._id); setDetailCoupon(null); }}
                    className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-100 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Sử dụng ngay 🎁
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Thêm Voucher */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Tặng vé đặc quyền 🎫</h2>
                  <p className="text-xs text-gray-400 mt-1">Tặng cho: <span className="font-bold text-primary">{ROLE_LABEL[oppositeRole]}</span></p>
                </div>
                <button onClick={() => setShowModal(false)}><X /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required className="w-full bg-gray-50 p-4 rounded-2xl outline-none" placeholder="Tên voucher (Ví dụ: 15p mát-xa...)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                <textarea required className="w-full bg-gray-50 p-4 rounded-2xl outline-none" rows={3} placeholder="Mô tả quyền lợi của tấm vé này..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
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
