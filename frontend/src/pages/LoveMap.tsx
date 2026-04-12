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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { role } = useAuth();

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await api.get('/places');
        setPlaces(res.data.data.filter((p: IPlace) => p.location && p.location.coordinates[0] !== 0));
      } catch {
        console.error('Khong tai duoc du lieu ban do');
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
      // chua co vi tri chia se
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
    <div className="mx-auto flex min-h-[calc(100dvh-15rem)] max-w-6xl flex-col px-2 py-6 md:h-[calc(100vh-180px)] md:min-h-[500px] md:px-4 md:py-8">
      <div className="mb-4 flex items-start justify-between gap-3 md:mb-6 md:items-center">
        <div className="min-w-0 flex-1 text-center">
          <h1 className="mb-1 text-3xl font-bold text-gray-800">Ban do Tinh yeu</h1>
          <p className="text-sm italic text-gray-600">Nhung noi chung ta da cung nhau di qua...</p>
        </div>
        {role === 'boyfriend' && gfLocation && (
          <button
            onClick={() => setFlyTo(f => !f)}
            className="shrink-0 rounded-2xl bg-pink-50 px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white md:px-4"
          >
            <span className="flex items-center gap-2">
              <Navigation size={16} aria-hidden="true" />
              Tim Ni
            </span>
          </button>
        )}
      </div>

      {role === 'boyfriend' && (
        <div className="mb-3 flex items-center gap-2 md:mb-4">
          {gfLocation ? (
            <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-2 text-xs font-bold text-green-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              Dang theo doi vi tri Ni
              {secondsAgo !== null && <span className="font-normal text-green-500">· cap nhat {secondsAgo}s truoc</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-400">
              <span className="h-2 w-2 rounded-full bg-gray-300"></span>
              Ni chua chia se vi tri
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[340px] flex-1 items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="min-h-[340px] flex-1 overflow-hidden rounded-[2rem] border-4 border-white shadow-lg md:min-h-0">
          <style>{`@keyframes heartbeat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25)} }`}</style>
          <MapContainer
            center={gfLocation ? [gfLocation.lat, gfLocation.lng] : [10.762622, 106.660172] as any}
            zoom={13}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {role === 'boyfriend' && gfLocation && (
              <>
                {flyTo && <FlyTo lat={gfLocation.lat} lng={gfLocation.lng} />}
                <Marker position={[gfLocation.lat, gfLocation.lng] as any} icon={heartIcon}>
                  <Popup>
                    <div className="p-1 text-center">
                      <p className="text-sm font-bold text-pink-500">Ni dang o day</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {gfLocation.accuracy ? `Do chinh xac: ~${Math.round(gfLocation.accuracy)}m` : ''}
                      </p>
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
                        {place.isVisited ? 'Da di' : 'Muon di'}
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
