import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import LucideL from 'leaflet';
import api from '../api/api';
import { Loader2, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  Cafe: '☕', 'Tra sua': '🧋', 'Nha hang': '🍽️', 'An vat': '🍢',
  'Lau & Nuong': '🔥', 'Hai san': '🦞', 'Pho & Bun': '🍜',
  'Banh & Kem': '🍰', 'Quan nhau': '🍺', Khac: '📍',
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
  }, [lat, lng, map]);
  return null;
}

const LoveMap: React.FC = () => {
  const [places, setPlaces] = useState<IPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [gfLocation, setGfLocation] = useState<IGirlfriendLocation | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [flyTo, setFlyTo] = useState(false);
  // Tracking is opt-in: only shown when BF explicitly enables it this session
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { role } = useAuth();

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await api.get('/places');
        setPlaces(res.data.data.filter((p: IPlace) => p.location && p.location.coordinates[0] !== 0));
      } catch {
        // silent
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
      // no location shared yet
    }
  };

  useEffect(() => {
    if (role !== 'boyfriend' || !trackingEnabled) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    fetchGfLocation();
    pollRef.current = setInterval(fetchGfLocation, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [role, trackingEnabled]);

  const secondsAgo = lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : null;
  const showTracking = role === 'boyfriend' && trackingEnabled;

  return (
    <div className="page-container flex min-h-[calc(100dvh-11rem)] flex-col gap-4">
      <div className="page-header mb-0 items-start">
        <div className="min-w-0 flex-1">
          <p className="section-label">Tiện ích</p>
          <h1 className="page-title">Bản đồ yêu thương</h1>
          <p className="page-subtitle">Những nơi hai bạn đã ghé qua và muốn ghé tới.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showTracking && gfLocation && (
            <button onClick={() => setFlyTo(f => !f)} className="btn-secondary">
              <Navigation size={16} aria-hidden="true" />
            </button>
          )}
          {role === 'boyfriend' && (
            <button
              onClick={() => setTrackingEnabled(e => !e)}
              className={`btn-secondary transition-all ${trackingEnabled ? 'bg-sky-50 text-sky-600' : ''}`}
              title={trackingEnabled ? 'Tắt chế độ riêng' : 'Bật chế độ riêng'}
            >
              <Navigation size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {showTracking && (
        <div className="mb-1 flex items-center gap-2">
          {gfLocation ? (
            <div className="flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
              </span>
              Vị trí đang được chia sẻ
              {secondsAgo !== null && <span className="font-normal text-sky-500">· {secondsAgo}s trước</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-400">
              <span className="h-2 w-2 rounded-full bg-gray-300"></span>
              Chưa có vị trí được chia sẻ
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[340px] flex-1 items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="surface-card-strong min-h-[340px] flex-1 overflow-hidden p-2 md:min-h-0">
          <style>{`@keyframes heartbeat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25)} }`}</style>
          <MapContainer
            center={showTracking && gfLocation ? [gfLocation.lat, gfLocation.lng] : [10.762622, 106.660172] as any}
            zoom={13}
            className="h-full min-h-[340px] w-full overflow-hidden rounded-[1.5rem]"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {showTracking && gfLocation && (
              <>
                {flyTo && <FlyTo lat={gfLocation.lat} lng={gfLocation.lng} />}
                <Marker position={[gfLocation.lat, gfLocation.lng] as any} icon={heartIcon}>
                  <Popup>
                    <div className="p-1 text-center">
                      <p className="text-sm font-bold text-pink-500">Đang ở đây</p>
                      {gfLocation.accuracy ? (
                        <p className="mt-1 text-xs text-gray-400">~{Math.round(gfLocation.accuracy)}m</p>
                      ) : null}
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {places.map((place) => (
              <Marker
                key={place._id}
                position={[place.location.coordinates[1], place.location.coordinates[0]] as any}
              >
                <Popup minWidth={200}>
                  <div className="p-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-lg">{CATEGORY_EMOJI[place.category] || '📍'}</span>
                      <strong className="text-sm text-gray-800">{place.name}</strong>
                    </div>
                    <p className="mb-2 text-xs leading-relaxed text-gray-500">{place.address}</p>
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${place.isVisited ? 'bg-pink-100 text-pink-600' : 'bg-violet-100 text-violet-600'}`}>
                        {place.isVisited ? 'Đã đi' : 'Muốn đi'}
                      </span>
                      {place.isVisited && place.rating && (
                        <span className="text-[11px] font-bold text-yellow-500">{'⭐'.repeat(place.rating)}</span>
                      )}
                    </div>
                    {place.note && <p className="mt-1.5 text-[10px] italic text-gray-400">"{place.note}"</p>}
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
