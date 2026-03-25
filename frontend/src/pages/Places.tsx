import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { MapPin, Star, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IPlace {
  _id: string;
  name: string;
  address: string;
  rating: number;
  category: string;
  note: string;
}

const Places: React.FC = () => {
  const [places, setPlaces] = useState<IPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [randomPlace, setRandomPlace] = useState<IPlace | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const res = await api.get('/places');
      setPlaces(res.data.data);
    } catch (err) {
      console.error('Lỗi khi tải địa điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleRandom = async () => {
    setIsRolling(true);
    try {
      // Giả lập hiệu ứng quay 1 giây
      await new Promise(r => setTimeout(r, 1000));
      const res = await api.get('/places/random');
      setRandomPlace(res.data.data);
    } catch (err) {
      alert('Không tìm thấy quán nào để random rồi!');
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Sổ tay Ẩm thực</h1>
          <p className="text-gray-600">Những chốn hẹn hò yêu thích của chúng mình ✨</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleRandom}
            disabled={isRolling}
            className="flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-2xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isRolling ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Trạm Cứu đói
          </button>
          
          <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all">
            <Plus /> Thêm quán mới
          </button>
        </div>
      </div>

      <AnimatePresence>
        {randomPlace && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-yellow-100 border-2 border-yellow-300 p-8 rounded-3xl mb-12 relative overflow-hidden text-center"
          >
            <div className="romantic-font text-2xl text-yellow-700 mb-2">Hôm nay hãy ăn ở...</div>
            <h2 className="text-4xl font-black text-gray-800 mb-4">{randomPlace.name}</h2>
            <p className="flex items-center justify-center gap-2 text-gray-600 font-medium mb-6">
              <MapPin size={18} className="text-primary" /> {randomPlace.address}
            </p>
            <button 
              onClick={() => setRandomPlace(null)}
              className="text-yellow-700 font-bold underline"
            >
              Đóng lại
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {places.map((place) => (
            <div key={place._id} className="bg-white p-6 rounded-3xl shadow-sm border border-pink-50 hover:border-primary card-hover group">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  {place.category}
                </span>
                <div className="flex items-center gap-1 text-yellow-400 font-bold">
                  <Star fill="currentColor" size={16} /> {place.rating}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">{place.name}</h3>
              <p className="flex items-start gap-2 text-gray-500 text-sm mb-4">
                <MapPin size={16} className="mt-0.5 shrink-0" /> {place.address}
              </p>
              <div className="bg-gray-50 p-3 rounded-xl text-gray-600 text-sm italic">
                "{place.note || 'Không có ghi chú nào'}"
              </div>
            </div>
          ))}
          
          {places.length === 0 && !loading && (
            <div className="col-span-full text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400">Chưa có quán nào trong sổ tay cả. Hãy thêm ngay nhé! ❤️</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Places;
