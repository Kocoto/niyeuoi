import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Ticket, CheckCircle, Loader2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface ICoupon {
  _id: string;
  title: string;
  description: string;
  isUsed: boolean;
  expiryDate?: string;
}

const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [loading, setLoading] = useState(true);

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

  const useCoupon = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn sử dụng tấm vé này không? 💕')) return;
    try {
      await api.put(`/coupons/${id}`, { isUsed: true });
      fetchCoupons();
    } catch (err) {
      alert('Không thể sử dụng voucher lúc này!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1 font-romantic">Ví Voucher Tình yêu</h1>
          <p className="text-gray-500 text-sm italic">Những đặc quyền dành riêng cho bạn... 🎟️</p>
        </div>
        <button className="bg-primary text-white p-3 rounded-full shadow-lg">
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
            <motion.div 
              key={coupon._id}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden flex bg-white rounded-2xl shadow-sm border-2 transition-all ${coupon.isUsed ? 'grayscale opacity-60 border-gray-100' : 'border-pink-100 hover:border-primary'}`}
            >
              {/* Left Part - Icon */}
              <div className={`w-24 flex items-center justify-center border-r-2 border-dashed ${coupon.isUsed ? 'bg-gray-50 text-gray-400' : 'bg-pink-50 text-primary border-pink-100'}`}>
                <Ticket size={32} />
              </div>

              {/* Right Part - Content */}
              <div className="flex-1 p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{coupon.title}</h3>
                <p className="text-gray-500 text-xs mb-4 line-clamp-2">{coupon.description}</p>
                
                <div className="flex justify-between items-end">
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Code: LOVE-{coupon._id.slice(-4)}</span>
                  {!coupon.isUsed ? (
                    <button 
                      onClick={() => useCoupon(coupon._id)}
                      className="bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-opacity-90 transition-all"
                    >
                      Sử dụng ngay
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                      <CheckCircle size={14} /> Đã dùng
                    </div>
                  )}
                </div>
              </div>

              {/* Decorative Half Circles */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 bg-background rounded-full border-2 border-pink-100"></div>
              <div className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 bg-background rounded-full border-2 border-pink-100"></div>
            </motion.div>
          ))}

          {coupons.length === 0 && (
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
              <p className="text-gray-400">Bạn chưa có voucher nào. Hãy chờ bất ngờ nhé! 🎁</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Coupons;
