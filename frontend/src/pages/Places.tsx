import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { MapPin, Star, Plus, RefreshCw, Loader2, X, Camera, CheckCircle2, Crosshair, Pencil, Trash2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

const CATEGORIES = [
  { value: 'Cafe',        emoji: '☕' },
  { value: 'Trà sữa',    emoji: '🧋' },
  { value: 'Nhà hàng',   emoji: '🍽️' },
  { value: 'Ăn vặt',     emoji: '🍢' },
  { value: 'Lẩu & Nướng',emoji: '🔥' },
  { value: 'Hải sản',    emoji: '🦞' },
  { value: 'Phở & Bún',  emoji: '🍜' },
  { value: 'Bánh & Kem', emoji: '🍰' },
  { value: 'Quán nhậu',  emoji: '🍺' },
  { value: 'Khác',       emoji: '📍' },
];

interface IPlace {
  _id: string;
  name: string;
  address: string;
  rating?: number;
  category: string;
  note: string;
  image?: string;
  isVisited: boolean;
  location: {
    type: string;
    coordinates: number[];
  };
}

const Places: React.FC = () => {
  const [places, setPlaces] = useState<IPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'visited' | 'wishlist'>('wishlist');
  const [randomPlace, setRandomPlace] = useState<IPlace | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const { role } = useAuth();
  const { toast, confirm } = useUI();
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingVisitId, setPendingVisitId] = useState<string | null>(null);
  const [tempRating, setTempRating] = useState(5);
  const [locatingId, setLocatingId] = useState<string | null>(null);

  const initialForm = {
    name: '',
    address: '',
    rating: 0,
    category: 'Cafe',
    note: '',
    image: '',
    isVisited: false,
    location: {
      type: 'Point',
      coordinates: [0, 0]
    }
  };

  const [formData, setFormData] = useState(initialForm);

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

  const handleEdit = (place: IPlace) => {
    setFormData({
      name: place.name,
      address: place.address,
      rating: place.rating ?? 0,
      category: place.category,
      note: place.note || '',
      image: place.image || '',
      isVisited: place.isVisited,
      location: place.location || { type: 'Point', coordinates: [0, 0] }
    });
    setEditingId(place._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const deletePlace = async (id: string) => {
    if (!await confirm('Xóa quán này nhé? 🥺')) return;
    try {
      await api.delete(`/places/${id}`);
      fetchPlaces();
    } catch (err) {
      toast('Không xóa được!', 'error');
    }
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
      setFormData({ ...formData, image: res.data.data.url });
    } catch (err) {
      toast('Lỗi tải ảnh!', 'error');
    } finally {
      setUploading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast('Trình duyệt của bạn không hỗ trợ định vị!', 'warning');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setFormData(prev => ({
        ...prev,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      }));

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
        const data = await res.json();
        if (data.display_name) {
          setFormData(prev => ({ ...prev, address: data.display_name }));
        }
      } catch (err) {
        console.error('Lỗi lấy địa chỉ từ tọa độ');
      } finally {
        setLocating(false);
      }
    }, (_error) => {
      toast('Không thể lấy vị trí!', 'warning');
      setLocating(false);
    }, { enableHighAccuracy: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.isVisited) delete (payload as any).rating;
      if (isEditing && editingId) {
        await api.put(`/places/${editingId}`, payload);
      } else {
        await api.post('/places', payload);
      }
      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      setActiveTab(formData.isVisited ? 'visited' : 'wishlist');
      setFormData(initialForm);
      await fetchPlaces();
    } catch (err) {
      toast('Lỗi khi lưu quán!', 'error');
    }
  };

  const markAsVisited = (id: string) => {
    setPendingVisitId(id);
    setTempRating(5);
    setShowRatingModal(true);
  };

  const confirmVisited = async () => {
    if (!pendingVisitId) return;
    try {
      await api.put(`/places/${pendingVisitId}`, { isVisited: true, rating: tempRating });
      setShowRatingModal(false);
      setPendingVisitId(null);
      await fetchPlaces();
    } catch (err) {
      toast('Lỗi cập nhật trạng thái!', 'error');
    }
  };

  const updatePlaceLocation = (id: string) => {
    if (!navigator.geolocation) {
      toast('Trình duyệt không hỗ trợ định vị!', 'warning');
      return;
    }
    setLocatingId(id);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        let address = '';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await res.json();
          address = data.display_name || '';
        } catch { /* giữ address cũ nếu lỗi */ }

        const updateData: Record<string, any> = {
          location: { type: 'Point', coordinates: [longitude, latitude] }
        };
        if (address) updateData.address = address;

        await api.put(`/places/${id}`, updateData);
        toast('Đã cập nhật vị trí! 📍', 'success');
        await fetchPlaces();
      } catch {
        toast('Lỗi cập nhật vị trí!', 'error');
      } finally {
        setLocatingId(null);
      }
    }, () => {
      toast('Không thể lấy vị trí!', 'warning');
      setLocatingId(null);
    }, { enableHighAccuracy: true });
  };

  const handleRandom = async () => {
    setIsRolling(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      const res = await api.get(`/places/random${activeTab === 'wishlist' ? '?isVisited=false' : ''}`);
      setRandomPlace(res.data.data);
    } catch (err) {
      toast('Hết quán để random rồi! Thêm nhiều hơn nhé 🍜', 'warning');
    } finally {
      setIsRolling(false);
    }
  };

  const filteredPlaces = places.filter(p => activeTab === 'visited' ? p.isVisited : !p.isVisited);

  return (
    <div className="max-w-6xl mx-auto px-2 md:px-4 py-6 md:py-8 pb-24 md:pb-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sổ tay Ẩm thực</h1>
          <p className="page-subtitle">Nơi lưu giữ hương vị tình yêu của đôi ta... 🍜</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={handleRandom} disabled={isRolling} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-secondary text-white px-4 md:px-6 py-3 rounded-2xl font-bold shadow-md hover:scale-105 transition-all text-sm">
            {isRolling ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />} Trạm Cứu đói
          </button>
          <button onClick={() => { setIsEditing(false); setFormData(initialForm); setShowModal(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-white px-4 md:px-6 py-3 rounded-2xl font-bold shadow-md hover:scale-105 transition-all text-sm">
            <Plus size={18} /> Thêm quán
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-10 p-1 bg-gray-100 rounded-2xl max-w-sm mx-auto">
        <button onClick={() => setActiveTab('visited')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'visited' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}>Đã măm măm 🍕</button>
        <button onClick={() => setActiveTab('wishlist')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'wishlist' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}>Muốn đi quá ✨</button>
      </div>

      <AnimatePresence>
        {randomPlace && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-yellow-100 border-2 border-yellow-300 p-6 rounded-3xl mb-10 text-center relative overflow-hidden shadow-lg">
            <h2 className="text-2xl font-black text-gray-800 mb-2">{randomPlace.name}</h2>
            <p className="text-gray-600 text-sm mb-4 px-10 line-clamp-2"><MapPin size={14} className="inline mr-1 text-primary" /> {randomPlace.address}</p>
            <button onClick={() => setRandomPlace(null)} className="text-yellow-700 font-bold underline text-sm">Đóng lại</button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => (
            <motion.div layout key={place._id} className="bg-white rounded-[2rem] shadow-sm border border-pink-50 hover:border-primary card-hover group overflow-hidden flex flex-col relative">
              {/* Edit/Delete Overlay */}
              {role === 'boyfriend' && (
                <div className="absolute top-3 right-3 z-10 flex gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(place); }} className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:text-primary shadow-md"><Pencil size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); deletePlace(place._id); }} className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-500 shadow-md"><Trash2 size={14} /></button>
                </div>
              )}

              {place.image && (
                <div className="h-44 overflow-hidden">
                  <img src={place.image} alt={place.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-orange-50 text-orange-600 text-[10px] px-3 py-1 rounded-full font-bold">
                    {CATEGORIES.find(c => c.value === place.category)?.emoji} {place.category}
                  </span>
                  {place.isVisited && place.rating ? (
                    <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm"><Star fill="currentColor" size={14} /> {place.rating}</div>
                  ) : (
                    <span className="text-[10px] text-gray-300 font-bold">Chưa có rating</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors line-clamp-1">{place.name}</h3>
                <p className="text-gray-500 text-xs mb-4 line-clamp-2 flex-1"><MapPin size={12} className="inline mr-1" /> {place.address}</p>
                <div className="bg-gray-50 p-3 rounded-2xl text-gray-600 text-xs italic mb-4">"{place.note || 'Để dành đi cùng nhau nhé!'}"</div>

                <div className="flex flex-col gap-2 mt-auto">
                  {place.location.coordinates[0] === 0 && (
                    <button
                      onClick={() => updatePlaceLocation(place._id)}
                      disabled={locatingId === place._id}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-50 text-violet-500 rounded-xl font-bold text-xs hover:bg-violet-500 hover:text-white transition-all disabled:opacity-60"
                    >
                      {locatingId === place._id
                        ? <><Loader2 size={13} className="animate-spin" /> Đang định vị...</>
                        : <><Navigation size={13} /> Cập nhật vị trí</>
                      }
                    </button>
                  )}
                  {activeTab === 'wishlist' && (
                    <button onClick={() => markAsVisited(place._id)} className="w-full flex items-center justify-center gap-2 py-3 bg-pink-50 text-primary rounded-xl font-bold text-xs hover:bg-primary hover:text-white transition-all">
                      <CheckCircle2 size={14} /> Đã đi rồi nè!
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {filteredPlaces.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">{activeTab === 'visited' ? 'Chưa có quán nào được măm măm. Đi ăn thôi bạn ơi! ❤️' : 'Danh sách muốn đi đang trống. Thấy quán nào hay hãy lưu lại nhé! ✨'}</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Chấm Điểm Khi Đánh Dấu Đã Đi */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRatingModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center">
              <div className="text-4xl mb-3">🍽️</div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Quán ăn thế nào?</h2>
              <p className="text-sm text-gray-400 mb-6">Chấm điểm để ghi nhớ nhé!</p>
              <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" onClick={() => setTempRating(star)} className="transition-transform hover:scale-125 active:scale-95">
                    <Star size={36} className={star <= tempRating ? 'text-yellow-400' : 'text-gray-200'} fill={star <= tempRating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <p className="text-sm font-bold text-gray-500 mb-6">{['', 'Tệ quá 😞', 'Tạm được thôi 😐', 'Ổn ổn 😊', 'Ngon lắm! 😋', 'Tuyệt vời! 🤩'][tempRating]}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowRatingModal(false)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm">Hủy</button>
                <button onClick={confirmVisited} className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-pink-100">Xác nhận ❤️</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Thêm/Sửa Quán */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm"></motion.div>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 font-romantic">{isEditing ? 'Cập nhật quán ăn 📝' : 'Lưu quán ăn mới 🍜'}</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative h-40 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden group cursor-pointer">
                    {formData.image ? <img src={formData.image} alt="Preview" className="w-full h-full object-cover" /> : (
                      <div className="text-center">{uploading ? <Loader2 className="animate-spin text-primary mx-auto" /> : <><Camera className="text-gray-400 mx-auto mb-2" /><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Chọn ảnh quán</span></>}</div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={uploading} />
                  </div>
                  
                  <div className="space-y-2">
                    <input required className="w-full bg-gray-50 p-4 rounded-2xl outline-none border-2 border-transparent focus:border-primary transition-all text-sm" placeholder="Tên quán ăn..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    
                    <div className="relative">
                      <input required className="w-full bg-gray-50 p-4 pr-12 rounded-2xl outline-none text-xs border-2 border-transparent focus:border-primary transition-all" placeholder="Địa chỉ..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                      <button type="button" onClick={getCurrentLocation} disabled={locating} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50">
                        {locating ? <Loader2 size={18} className="animate-spin" /> : <Crosshair size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4 p-1 bg-gray-50 rounded-2xl">
                    <button type="button" onClick={() => setFormData({...formData, isVisited: false})} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${!formData.isVisited ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}>Muốn đi ✨</button>
                    <button type="button" onClick={() => setFormData({...formData, isVisited: true})} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${formData.isVisited ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}>Đã đi 🍕</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <select className="w-full bg-gray-50 p-4 rounded-2xl outline-none text-sm border-2 border-transparent focus:border-primary transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.emoji} {c.value}</option>
                      ))}
                    </select>
                    {formData.isVisited ? (
                      <div className="w-full bg-gray-50 rounded-2xl flex items-center justify-center gap-1 py-3">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} type="button" onClick={() => setFormData({...formData, rating: star})} className="transition-transform hover:scale-125 active:scale-95">
                            <Star size={26} className={star <= (formData.rating || 0) ? 'text-yellow-400' : 'text-gray-200'} fill={star <= (formData.rating || 0) ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full bg-gray-50 p-4 rounded-2xl text-xs text-gray-300 font-bold flex items-center">Rating sau khi đi ✨</div>
                    )}
                  </div>
                  <textarea rows={2} className="w-full bg-gray-50 p-4 rounded-2xl outline-none text-sm border-2 border-transparent focus:border-primary transition-all" placeholder="Ghi chú về quán..." value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
                  <button type="submit" disabled={uploading || locating} className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg mt-2 disabled:opacity-50">
                    {isEditing ? 'Cập nhật ngay ❤️' : 'Lưu vào Sổ tay ❤️'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Places;
