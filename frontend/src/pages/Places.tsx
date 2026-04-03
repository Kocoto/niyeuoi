import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { OpenLocationCode } from 'open-location-code';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingVisitId, setPendingVisitId] = useState<string | null>(null);
  const [tempRating, setTempRating] = useState(5);
  const [locatingId, setLocatingId] = useState<string | null>(null);
  const [detailPlace, setDetailPlace] = useState<IPlace | null>(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationResults, setLocationResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);

  // Tìm địa chỉ cho form thêm/sửa
  const [formLocationQuery, setFormLocationQuery] = useState('');
  const [formLocationSearching, setFormLocationSearching] = useState(false);
  const [formLocationResults, setFormLocationResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);

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
      const data: IPlace[] = res.data.data;
      setPlaces(data);
      // Sync detail modal nếu đang mở
      setDetailPlace(prev => prev ? (data.find(p => p._id === prev._id) ?? null) : null);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.warn('[Location] Trình duyệt không hỗ trợ geolocation');
      toast('Trình duyệt của bạn không hỗ trợ định vị!', 'warning');
      return;
    }

    console.log('[Location] Bắt đầu lấy vị trí GPS (form)...');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log('[Location] GPS thành công:', { latitude, longitude, accuracy: `${accuracy}m` });
      setFormData(prev => ({
        ...prev,
        location: { type: 'Point', coordinates: [longitude, latitude] }
      }));

      try {
        console.log('[Location] Reverse geocode tọa độ:', { latitude, longitude });
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
        const data = await res.json();
        console.log('[Location] Nominatim reverse result:', data.display_name);
        if (data.display_name) {
          setFormData(prev => ({ ...prev, address: data.display_name }));
        }
      } catch (err) {
        console.error('[Location] Lỗi reverse geocode:', err);
      } finally {
        setLocating(false);
      }
    }, (err) => {
      console.error('[Location] GPS thất bại:', { code: err.code, message: err.message });
      toast('Không thể lấy vị trí!', 'warning');
      setLocating(false);
    }, { enableHighAccuracy: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = formData.image;
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('image', selectedFile);
        const res = await api.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = res.data.data.url;
      }
      const payload = { ...formData, image: imageUrl };
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
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      setFormLocationQuery('');
      setFormLocationResults([]);
      await fetchPlaces();
    } catch (err) {
      toast('Lỗi khi lưu quán!', 'error');
    } finally {
      setUploading(false);
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

  // Nhận diện Plus Code: có dấu + và chỉ dùng ký tự OLC
  const isPlusCode = (input: string) =>
    /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]*/i.test(input.trim().split(' ')[0]);

  const searchAndDecodePlusCode = async (query: string): Promise<{ display_name: string; lat: string; lon: string }[]> => {
    console.log('[Location] Bắt đầu tìm kiếm:', { query, isPlusCode: isPlusCode(query) });

    if (isPlusCode(query)) {
      const olc = new OpenLocationCode();
      const parts = query.trim().split(/\s+/);
      let code = parts[0].toUpperCase();
      const locality = parts.slice(1).join(' ');
      console.log('[Location] Phát hiện Plus Code:', { code, locality, isFull: olc.isFull(code) });

      if (!olc.isFull(code)) {
        let refLat = 10.776530, refLon = 106.700981;
        if (locality) {
          try {
            console.log('[Location] Geocode locality để lấy tọa độ tham chiếu:', locality);
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locality)}&limit=1`);
            const data = await res.json();
            if (data[0]) {
              refLat = parseFloat(data[0].lat);
              refLon = parseFloat(data[0].lon);
              console.log('[Location] Tọa độ tham chiếu từ locality:', { refLat, refLon, name: data[0].display_name });
            } else {
              console.warn('[Location] Không tìm thấy locality, dùng fallback TP.HCM');
            }
          } catch (err) {
            console.error('[Location] Lỗi geocode locality:', err);
          }
        }
        code = olc.recoverNearest(code, refLat, refLon);
        console.log('[Location] Plus Code đã recover:', code);
      }

      const decoded = olc.decode(code);
      const lat = String(decoded.latitudeCenter);
      const lon = String(decoded.longitudeCenter);
      console.log('[Location] Tọa độ decode từ Plus Code:', { lat, lon });

      let displayName = query;
      try {
        console.log('[Location] Reverse geocode tọa độ Plus Code...');
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await res.json();
        console.log('[Location] Địa chỉ từ Plus Code:', data.display_name);
        if (data.display_name) displayName = data.display_name;
      } catch (err) {
        console.error('[Location] Lỗi reverse geocode:', err);
      }

      return [{ display_name: displayName, lat, lon }];
    }

    // Tìm địa chỉ thường
    console.log('[Location] Tìm địa chỉ thường qua Nominatim:', query);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=4&countrycodes=vn`);
    const data = await res.json();
    console.log('[Location] Kết quả Nominatim:', data.length, 'kết quả', data.map((d: any) => d.display_name));
    return data;
  };

  const searchFormLocation = async () => {
    const query = formLocationQuery.trim();
    if (!query) return;
    setFormLocationSearching(true);
    setFormLocationResults([]);
    try {
      const results = await searchAndDecodePlusCode(query);
      setFormLocationResults(results);
      if (results.length === 0) toast('Không tìm thấy địa chỉ này!', 'warning');
    } catch {
      toast('Lỗi tìm kiếm địa chỉ!', 'error');
    } finally {
      setFormLocationSearching(false);
    }
  };

  const applyFormLocation = (r: { display_name: string; lat: string; lon: string }) => {
    console.log('[Location] Áp dụng vị trí vào form:', { lat: r.lat, lon: r.lon, display_name: r.display_name });
    setFormData(prev => ({
      ...prev,
      address: r.display_name,
      location: { type: 'Point', coordinates: [parseFloat(r.lon), parseFloat(r.lat)] }
    }));
    setFormLocationQuery('');
    setFormLocationResults([]);
  };

  const searchLocationByAddress = async () => {
    const query = locationQuery.trim();
    if (!query) return;
    setLocationSearching(true);
    setLocationResults([]);
    try {
      const results = await searchAndDecodePlusCode(query);
      setLocationResults(results);
      if (results.length === 0) toast('Không tìm thấy địa chỉ này!', 'warning');
    } catch {
      toast('Lỗi tìm kiếm địa chỉ!', 'error');
    } finally {
      setLocationSearching(false);
    }
  };

  const applyManualLocation = async (id: string, lat: string, lon: string, displayName: string) => {
    console.log('[Location] Cập nhật vị trí thủ công:', { id, lat, lon, displayName });
    try {
      await api.put(`/places/${id}`, {
        location: { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] },
        address: displayName
      });
      console.log('[Location] Cập nhật vị trí thành công');
      toast('Đã cập nhật vị trí! 📍', 'success');
      setShowLocationInput(false);
      setLocationQuery('');
      setLocationResults([]);
      await fetchPlaces();
    } catch (err) {
      console.error('[Location] Lỗi cập nhật vị trí:', err);
      toast('Lỗi cập nhật vị trí!', 'error');
    }
  };

  const updatePlaceLocation = (id: string) => {
    if (!navigator.geolocation) {
      console.warn('[Location] Trình duyệt không hỗ trợ geolocation');
      toast('Trình duyệt không hỗ trợ định vị!', 'warning');
      return;
    }
    console.log('[Location] Bắt đầu lấy GPS để cập nhật quán:', id);
    setLocatingId(id);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log('[Location] GPS thành công:', { latitude, longitude, accuracy: `${accuracy}m` });
      try {
        let address = '';
        try {
          console.log('[Location] Reverse geocode...');
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await res.json();
          address = data.display_name || '';
          console.log('[Location] Địa chỉ từ GPS:', address);
        } catch (err) {
          console.error('[Location] Lỗi reverse geocode:', err);
        }

        const updateData: Record<string, any> = {
          location: { type: 'Point', coordinates: [longitude, latitude] }
        };
        if (address) updateData.address = address;

        console.log('[Location] Gửi cập nhật lên server:', updateData);
        await api.put(`/places/${id}`, updateData);
        console.log('[Location] Cập nhật GPS thành công');
        toast('Đã cập nhật vị trí! 📍', 'success');
        await fetchPlaces();
      } catch (err) {
        console.error('[Location] Lỗi cập nhật GPS lên server:', err);
        toast('Lỗi cập nhật vị trí!', 'error');
      } finally {
        setLocatingId(null);
      }
    }, (err) => {
      console.error('[Location] GPS thất bại:', { code: err.code, message: err.message });
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
            <motion.div
              layout key={place._id}
              onClick={() => setDetailPlace(place)}
              className="bg-white rounded-[2rem] shadow-sm border border-pink-50 hover:border-primary card-hover group overflow-hidden flex flex-col relative cursor-pointer"
            >
              {role === 'boyfriend' && (
                <div className="absolute top-3 right-3 z-10 flex gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); handleEdit(place); }} className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:text-primary shadow-md"><Pencil size={14} /></button>
                  <button onClick={e => { e.stopPropagation(); deletePlace(place._id); }} className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-500 shadow-md"><Trash2 size={14} /></button>
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
                <div className="bg-gray-50 p-3 rounded-2xl text-gray-600 text-xs italic">"{place.note || 'Để dành đi cùng nhau nhé!'}"</div>
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

      {/* Modal Chi Tiết Quán */}
      <AnimatePresence>
        {detailPlace && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setDetailPlace(null); setShowLocationInput(false); setLocationResults([]); }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Ảnh */}
              {detailPlace.image ? (
                <div className="h-52 overflow-hidden relative">
                  <img src={detailPlace.image} alt={detailPlace.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <button onClick={() => { setDetailPlace(null); setShowLocationInput(false); setLocationResults([]); }} className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-700"><X size={18} /></button>
                </div>
              ) : (
                <div className="flex justify-end p-4">
                  <button onClick={() => setDetailPlace(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
              )}

              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="bg-orange-50 text-orange-600 text-[10px] px-3 py-1 rounded-full font-bold inline-block mb-2">
                      {CATEGORIES.find(c => c.value === detailPlace.category)?.emoji} {detailPlace.category}
                    </span>
                    <h2 className="text-2xl font-bold text-gray-800">{detailPlace.name}</h2>
                  </div>
                  {detailPlace.isVisited && detailPlace.rating ? (
                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-2 rounded-2xl shrink-0">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} className={s <= detailPlace.rating! ? 'text-yellow-400' : 'text-gray-200'} fill={s <= detailPlace.rating! ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Địa chỉ */}
                <div className="flex items-start gap-2 text-gray-500 text-sm">
                  <MapPin size={15} className="text-primary mt-0.5 shrink-0" />
                  <span>{detailPlace.address}</span>
                </div>

                {/* Ghi chú */}
                {detailPlace.note && (
                  <div className="bg-gray-50 p-4 rounded-2xl text-gray-600 text-sm italic">"{detailPlace.note}"</div>
                )}

                {/* Nút hành động */}
                <div className="flex flex-col gap-2 pt-2">
                  {/* Google Maps */}
                  {detailPlace.location?.coordinates[0] !== 0 && detailPlace.location?.coordinates[1] !== 0 ? (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${detailPlace.location.coordinates[1]},${detailPlace.location.coordinates[0]}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-2xl font-bold text-sm hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <Navigation size={16} /> Dẫn đường Google Maps
                    </a>
                  ) : null}

                  {/* Cập nhật vị trí */}
                  {!showLocationInput ? (
                    <button
                      onClick={e => { e.stopPropagation(); setShowLocationInput(true); setLocationResults([]); setLocationQuery(''); }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-violet-50 text-violet-600 rounded-2xl font-bold text-sm hover:bg-violet-600 hover:text-white transition-all"
                    >
                      <Crosshair size={15} /> {detailPlace.location?.coordinates[0] !== 0 ? 'Cập nhật lại vị trí' : 'Cập nhật vị trí'}
                    </button>
                  ) : (
                    <div className="bg-violet-50 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Chọn cách cập nhật</span>
                        <button onClick={() => { setShowLocationInput(false); setLocationResults([]); }} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
                      </div>

                      {/* GPS */}
                      <button
                        onClick={e => { e.stopPropagation(); updatePlaceLocation(detailPlace._id); }}
                        disabled={locatingId === detailPlace._id}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-violet-600 border-2 border-violet-200 rounded-xl font-bold text-sm hover:border-violet-500 transition-all disabled:opacity-60"
                      >
                        {locatingId === detailPlace._id
                          ? <><Loader2 size={14} className="animate-spin" /> Đang định vị...</>
                          : <><Navigation size={14} /> Lấy vị trí hiện tại (GPS)</>
                        }
                      </button>

                      {/* Tìm thủ công / Plus Code */}
                      <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider px-1">Hoặc nhập thủ công / Plus Code</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={locationQuery}
                          onChange={e => setLocationQuery(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && searchLocationByAddress()}
                          placeholder="Dán Plus Code (VD: QMJ6+WJ6 Hoa Hung...) hoặc tên quán"
                          className="flex-1 bg-white border-2 border-violet-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-500 transition-all"
                          onClick={e => e.stopPropagation()}
                        />
                        <button
                          onClick={e => { e.stopPropagation(); searchLocationByAddress(); }}
                          disabled={locationSearching}
                          className="px-3 py-2 bg-violet-500 text-white rounded-xl font-bold text-sm disabled:opacity-60 hover:bg-violet-600 transition-all"
                        >
                          {locationSearching ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
                        </button>
                      </div>

                      {/* Kết quả tìm kiếm */}
                      {locationResults.length > 0 && (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {locationResults.map((r, i) => (
                            <div key={i} className="bg-white border border-violet-100 rounded-xl p-2.5 space-y-2">
                              <p className="text-xs text-gray-600 leading-relaxed">📍 {r.display_name}</p>
                              <button
                                onClick={e => { e.stopPropagation(); applyManualLocation(detailPlace._id, r.lat, r.lon, r.display_name); }}
                                className="w-full py-2 bg-violet-500 text-white rounded-lg text-xs font-bold hover:bg-violet-600 transition-all"
                              >
                                Lưu vị trí này
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Đánh dấu đã đi */}
                  {!detailPlace.isVisited && (
                    <button
                      onClick={e => { e.stopPropagation(); setDetailPlace(null); markAsVisited(detailPlace._id); }}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-pink-50 text-primary rounded-2xl font-bold text-sm hover:bg-primary hover:text-white transition-all"
                    >
                      <CheckCircle2 size={15} /> Đã đi rồi nè!
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowModal(false); setSelectedFile(null); if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(''); } }} className="absolute inset-0 bg-black/40 backdrop-blur-sm"></motion.div>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 font-romantic">{isEditing ? 'Cập nhật quán ăn 📝' : 'Lưu quán ăn mới 🍜'}</h2>
                  <button onClick={() => { setShowModal(false); setSelectedFile(null); if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(''); } }} className="text-gray-400 hover:text-gray-600"><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative h-40 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden group cursor-pointer">
                    {(previewUrl || formData.image) ? <img src={previewUrl || formData.image} alt="Preview" className="w-full h-full object-cover" /> : (
                      <div className="text-center"><Camera className="text-gray-400 mx-auto mb-2" /><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Chọn ảnh quán</span></div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileSelect} />
                  </div>
                  
                  <div className="space-y-2">
                    <input required className="w-full bg-gray-50 p-4 rounded-2xl outline-none border-2 border-transparent focus:border-primary transition-all text-sm" placeholder="Tên quán ăn..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    
                    <div className="relative">
                      <input required className="w-full bg-gray-50 p-4 pr-24 rounded-2xl outline-none text-xs border-2 border-transparent focus:border-primary transition-all" placeholder="Địa chỉ..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                        <button type="button" onClick={getCurrentLocation} disabled={locating} title="Lấy vị trí GPS" className="p-2 bg-white rounded-xl shadow-sm text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50">
                          {locating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
                        </button>
                        <button type="button" onClick={() => { setFormLocationResults([]); setFormLocationQuery(''); }} title="Tìm địa chỉ / Plus Code" className="p-2 bg-white rounded-xl shadow-sm text-violet-500 hover:bg-violet-500 hover:text-white transition-all" onFocus={() => {}}>
                          <MapPin size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Tìm địa chỉ / Plus Code */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formLocationQuery}
                        onChange={e => { setFormLocationQuery(e.target.value); setFormLocationResults([]); }}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchFormLocation())}
                        placeholder="Dán Plus Code hoặc tìm tên quán, địa chỉ..."
                        className="flex-1 bg-violet-50 border-2 border-violet-100 focus:border-violet-400 rounded-2xl px-4 py-3 text-xs outline-none transition-all"
                      />
                      <button type="button" onClick={searchFormLocation} disabled={formLocationSearching || !formLocationQuery.trim()} className="px-4 py-3 bg-violet-500 text-white rounded-2xl font-bold text-xs disabled:opacity-40 hover:bg-violet-600 transition-all">
                        {formLocationSearching ? <Loader2 size={14} className="animate-spin" /> : 'Tìm'}
                      </button>
                    </div>
                    {formLocationResults.length > 0 && (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {formLocationResults.map((r, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => applyFormLocation(r)}
                            className="w-full text-left px-3 py-2.5 bg-violet-50 rounded-xl text-xs text-gray-700 hover:bg-violet-500 hover:text-white transition-all leading-relaxed"
                          >
                            📍 {r.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                    {formData.location.coordinates[0] !== 0 && (
                      <p className="text-[10px] text-green-600 font-bold px-1">✓ Đã có tọa độ ({formData.location.coordinates[1].toFixed(5)}, {formData.location.coordinates[0].toFixed(5)})</p>
                    )}
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
