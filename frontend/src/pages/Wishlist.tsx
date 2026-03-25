import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { motion } from 'framer-motion';
import { Gift, ExternalLink, CheckCircle2, Circle, Loader2, Plus } from 'lucide-react';

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

  useEffect(() => {
    fetchWishes();
  }, []);

  const fetchWishes = async () => {
    try {
      const res = await api.get('/wishlist');
      setWishes(res.data.data);
    } catch (err) {
      console.error('Lỗi khi tải wishlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Danh sách Mong muốn</h1>
          <p className="text-gray-600 font-medium">Những điều nhỏ bé chúng mình cùng ước ao... 🎁</p>
        </div>
        <button className="bg-primary text-white p-4 rounded-2xl shadow-lg hover:rotate-6 transition-transform">
          <Plus />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {wishes.map((wish) => (
            <motion.div 
              key={wish._id}
              whileHover={{ y: -5 }}
              className={`bg-white rounded-[2rem] overflow-hidden border-2 shadow-sm transition-all ${wish.status === 'Đã mua' ? 'border-green-100 opacity-75' : 'border-pink-50'}`}
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${wish.status === 'Đã mua' ? 'bg-green-100 text-green-600' : 'bg-pink-100 text-primary'}`}>
                    <Gift size={24} />
                  </div>
                  {wish.isSecretlyPrepared && (
                    <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
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

          {wishes.length === 0 && (
            <div className="col-span-full text-center py-32 bg-white/40 rounded-[3rem] border-4 border-dashed border-pink-100">
              <p className="text-xl font-medium text-gray-400">Danh sách đang trống. Đừng ngần ngại ước nhé! ✨</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
