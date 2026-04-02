import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import LucideL from 'leaflet';
import api from '../api/api';
import { Loader2, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Sửa lỗi hiển thị icon của Leaflet trong React
delete (LucideL.Icon.Default.prototype as any)._getIconUrl;
LucideL.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const heartIcon = LucideL.divIcon({
  className: '',
  html: `<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));animation:heartbeat 1.5s ease-in-out infinite;">💗</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const CATEGORY_EMOJI: Record<string, string> = {
  'Cafe': '☕', 'Trà sữa': '🧋', 'Nhà hàng': '🍽️', 'Ăn vặt': '🍢',
  'Lẩu & Nướng': '🔥', 'Hải sản': '🦞', 'Phở & Bún': '🍜',
  'Bánh & Kem': '🍰', 'Quán nhậu': '🍺', 'Khác': '📍',
};

interface IPlace {
  _id: string;
  name: string;
  address: string;
  category: string;
  rating?: number;
  isVisited: boolean;
  note?: string;
  location: { coordinates: number[] };
}

interface IGirlfriendLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  updatedAt: string;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.5 });
  }, [lat, lng]);
  return null;
}

const LoveMap: React.FC = () => {
  const [places, setPlaces] = useState<IPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [gfLocation, setGfLocation] = useState<IGirlfriendLocation | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [flyTo, setFlyTo] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { role } = useAuth();

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await api.get('/places');
        setPlaces(res.data.data.filter((p: IPlace) => p.location && p.location.coordinates[0] !== 0));
      } catch {
        console.error('Lỗi khi tải bản đồ');
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  const fetchGfLocation = async () => {
    try {
      const res = await api.get('/location');
      setGfLocation(res.data.data);
      setLastUpdated(Date.now());
    } catch {
      // Chưa có vị trí
    }
  };

  useEffect(() => {
    if (role !== 'boyfriend') return;
    fetchGfLocation();
    pollRef.current = setInterval(fetchGfLocation, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [role]);

  const secondsAgo = lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : null;

  return (
    <div className="max-w-6xl mx-auto px-2 md:px-4 py-6 md:py-8 h-[calc(100vh-180px)] min-h-[500px]">
      <div className="flex items-center justify-between mb-6">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Bản đồ Tình yêu</h1>
          <p className="text-gray-600 text-sm italic">Những nơi chúng ta đã cùng nhau đi qua... 🗺️❤️</p>
        </div>
        {role === 'boyfriend' && gfLocation && (
          <button
            onClick={() => setFlyTo(f => !f)}
            className="flex items-center gap-2 bg-pink-50 text-primary px-4 py-2 rounded-2xl text-sm font-bold hover:bg-primary hover:text-white transition-all shrink-0"
          >
            <Navigation size={16} />
            Tìm em
          </button>
        )}
      </div>

      {role === 'boyfriend' && (
        <div className="mb-4 flex items-center gap-2">
          {gfLocation ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-2 rounded-2xl text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Đang theo dõi vị trí em
              {secondsAgo !== null && <span className="font-normal text-green-500">· cập nhật {secondsAgo}s trước</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 text-gray-400 px-4 py-2 rounded-2xl text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              Em chưa bật chia sẻ vị trí
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="h-full rounded-[2rem] overflow-hidden shadow-lg border-4 border-white">
          <style>{`@keyframes heartbeat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25)} }`}</style>
          <MapContainer
            center={gfLocation ? [gfLocation.lat, gfLocation.lng] : [10.762622, 106.660172] as any}
            zoom={13}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Vị trí girlfriend */}
            {role === 'boyfriend' && gfLocation && (
              <>
                {flyTo && <FlyTo lat={gfLocation.lat} lng={gfLocation.lng} />}
                <Marker position={[gfLocation.lat, gfLocation.lng] as any} icon={heartIcon}>
                  <Popup>
                    <div className="text-center p-1">
                      <p className="font-bold text-pink-500 text-sm">💗 Vị trí của em</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {gfLocation.accuracy ? `Độ chính xác: ~${Math.round(gfLocation.accuracy)}m` : ''}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Các địa điểm */}
            {places.map((place) => (
              <Marker
                key={place._id}
                position={[place.location.coordinates[1], place.location.coordinates[0]] as any}
              >
                <Popup minWidth={200}>
                  <div className="p-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{CATEGORY_EMOJI[place.category] || '📍'}</span>
                      <strong className="text-gray-800 text-sm">{place.name}</strong>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 leading-relaxed">{place.address}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${place.isVisited ? 'bg-pink-100 text-pink-600' : 'bg-violet-100 text-violet-600'}`}>
                        {place.isVisited ? '✅ Đã đi' : '✨ Muốn đi'}
                      </span>
                      {place.isVisited && place.rating && (
                        <span className="text-[11px] font-bold text-yellow-500">{'⭐'.repeat(place.rating)}</span>
                      )}
                    </div>
                    {place.note && <p className="text-[10px] text-gray-400 italic mt-1.5">"{place.note}"</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default LoveMap;
