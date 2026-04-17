import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Leaflet from 'leaflet';
import { Ellipsis, Loader2, LockKeyhole, MapPinned, Navigation, Shield, X } from 'lucide-react';

import api from '../api/api';
import { ROLE_NAME } from '../constants/roles';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

delete (Leaflet.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
Leaflet.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const privateMarkerIcon = Leaflet.divIcon({
  className: '',
  html: '<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.18));">💗</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const CATEGORY_EMOJI: Record<string, string> = {
  Cafe: '☕',
  'Tra sua': '🧋',
  'Nha hang': '🍽️',
  'An vat': '🍢',
  'Lau & Nuong': '🔥',
  'Hai san': '🦞',
  'Pho & Bun': '🍜',
  'Banh & Kem': '🍰',
  'Quan nhau': '🍺',
  Khac: '📍',
};

const DEFAULT_CENTER: [number, number] = [10.762622, 106.660172];

type Place = {
  _id: string;
  name: string;
  address: string;
  category: string;
  rating?: number;
  isVisited: boolean;
  note?: string;
  location: { coordinates: number[] };
};

type CurrentLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
  updatedAt: string;
};

type PrivateAccessSession = {
  token: string;
  expiresAt: number;
};

const getErrorStatus = (error: unknown) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return null;
  }

  const response = (error as { response?: { status?: number } }).response;
  return typeof response?.status === 'number' ? response.status : null;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return null;
  }

  const response = (error as { response?: { data?: { error?: string } } }).response;
  return typeof response?.data?.error === 'string' ? response.data.error : null;
};

const formatRelativeTime = (value?: string) => {
  if (!value) return 'Cap nhat gan day';

  const diffMs = Date.now() - new Date(value).getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 60) return `Cap nhat ${diffSeconds}s truoc`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `Cap nhat ${diffMinutes}p truoc`;

  const diffHours = Math.floor(diffMinutes / 60);
  return `Cap nhat ${diffHours}h truoc`;
};

const formatCountdown = (expiresAt: number, now: number) => {
  const diffSeconds = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const minutes = String(Math.floor(diffSeconds / 60)).padStart(2, '0');
  const seconds = String(diffSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const LegendChip: React.FC<{ label: string; tone: string }> = ({ label, tone }) => (
  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${tone}`}>
    {label}
  </span>
);

function FlyTo({ lat, lng, nonce }: { lat: number; lng: number; nonce: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.2 });
  }, [lat, lng, map, nonce]);

  return null;
}

const LoveMap: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [privateSheetOpen, setPrivateSheetOpen] = useState(false);
  const [privateLoading, setPrivateLoading] = useState(false);
  const [privateSession, setPrivateSession] = useState<PrivateAccessSession | null>(null);
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const [now, setNow] = useState(Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { role } = useAuth();
  const { prompt, toast } = useUI();

  const isPrivateMode = Boolean(privateSession);

  const closePrivateMode = useCallback((reason?: 'manual' | 'expired' | 'error') => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    setPrivateSession(null);
    setCurrentLocation(null);

    if (reason === 'expired') {
      toast('Che do rieng da tu tat de map quay ve khong gian chung.', 'info');
    }

    if (reason === 'error') {
      toast('Che do rieng da dong va map da quay ve che do chung.', 'info');
    }
  }, [toast]);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await api.get('/places');
        setPlaces((res.data.data ?? []).filter((place: Place) => place.location && place.location.coordinates[0] !== 0));
      } catch {
        console.error('Khong tai duoc du lieu ban do');
      } finally {
        setLoading(false);
      }
    };

    void fetchPlaces();
  }, []);

  const fetchPrivateLocation = useCallback(async (token: string) => {
    try {
      const res = await api.get('/location', {
        headers: {
          'x-private-access-token': token,
        },
      });

      setCurrentLocation(res.data.data ?? null);
    } catch (error: unknown) {
      const status = getErrorStatus(error);
      if (status === 401 || status === 403) {
        closePrivateMode('expired');
        return;
      }

      toast('Khong mo duoc du lieu vi tri hien tai luc nay.', 'error');
      closePrivateMode('error');
    }
  }, [closePrivateMode, toast]);

  useEffect(() => {
    if (!privateSession?.token) return;

    void fetchPrivateLocation(privateSession.token);

    pollRef.current = setInterval(() => {
      void fetchPrivateLocation(privateSession.token);
    }, 15000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [fetchPrivateLocation, privateSession?.token]);

  useEffect(() => {
    if (!privateSession) return;

    setNow(Date.now());
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [privateSession]);

  useEffect(() => {
    if (!privateSession) return;

    if (privateSession.expiresAt <= now) {
      closePrivateMode('expired');
    }
  }, [closePrivateMode, now, privateSession]);

  const openPrivateMode = useCallback(async () => {
    if (role !== 'boyfriend') return;

    const pin = await prompt(`Nhap PIN cua ${ROLE_NAME.boyfriend} de mo che do rieng`, '****', 'password');
    if (!pin) return;

    setPrivateLoading(true);

    try {
      const res = await api.post('/location/private-access', { pin });
      const nextSession = res.data.data as PrivateAccessSession;

      setPrivateSession(nextSession);
      setPrivateSheetOpen(false);
      setFocusNonce((current) => current + 1);
      toast('Che do rieng da mo trong mot khoang ngan.', 'success');
    } catch (error: unknown) {
      toast(getErrorMessage(error) || 'Khong mo duoc che do rieng.', 'error');
    } finally {
      setPrivateLoading(false);
    }
  }, [prompt, role, toast]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (isPrivateMode && currentLocation) {
      return [currentLocation.lat, currentLocation.lng];
    }

    const firstPlace = places[0];
    if (firstPlace?.location?.coordinates) {
      return [firstPlace.location.coordinates[1], firstPlace.location.coordinates[0]];
    }

    return DEFAULT_CENTER;
  }, [currentLocation, isPrivateMode, places]);

  const privateCountdown = privateSession ? formatCountdown(privateSession.expiresAt, now) : null;

  return (
    <div className="page-container flex min-h-[calc(100dvh-11rem)] flex-col gap-4">
      <div className="page-header mb-0 items-start">
        <div className="min-w-0 flex-1">
          <p className="section-label">Tiện ích</p>
          <h1 className="page-title">Bản đồ yêu thương</h1>
          <p className="page-subtitle">
            Map chung này chỉ giữ những nơi hai bạn đã ghé qua hoặc muốn nhớ lại. Vị trí hiện tại không xuất hiện trên giao diện mặc định.
          </p>
        </div>

        {role === 'boyfriend' ? (
          <button type="button" onClick={() => setPrivateSheetOpen(true)} className="btn-secondary shrink-0">
            <Ellipsis size={16} />
            Xem thêm
          </button>
        ) : null}
      </div>

      <section className="surface-card p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 flex-1">
            <p className="section-label">Map chung</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Chi giu nhung noi hai ban co the mo thoai mai</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-soft">
              Địa điểm đã đi, nơi muốn quay lại, và các marker đáng nhớ nằm ở đây. Nếu cần lớp riêng tư hơn, nó chỉ mở trong một mode tách biệt.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <LegendChip label="Da di" tone="bg-rose-50 text-rose-700 ring-rose-200/80" />
            <LegendChip label="Muon di" tone="bg-violet-50 text-violet-700 ring-violet-200/80" />
            <LegendChip label="Map chung" tone="bg-white text-ink ring-black/5" />
          </div>
        </div>
      </section>

      {isPrivateMode ? (
        <section className="surface-card p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
                <Shield size={14} />
                Private mode
              </span>
              <h2 className="mt-3 text-2xl font-black text-ink">Vị trí hiện tại</h2>
              <p className="mt-2 text-sm leading-6 text-soft">
                {currentLocation
                  ? `${formatRelativeTime(currentLocation.updatedAt)}${currentLocation.accuracy ? ` · do chinh xac ~${Math.round(currentLocation.accuracy)}m` : ''}`
                  : 'Chua co vi tri chia se gan day de hien thi trong mode rieng.'}
              </p>
              {privateCountdown ? (
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Tu tat sau {privateCountdown}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFocusNonce((current) => current + 1)}
                className="btn-secondary"
                disabled={!currentLocation}
              >
                <Navigation size={16} />
                Tập trung vị trí
              </button>
              <button type="button" onClick={() => closePrivateMode('manual')} className="btn-secondary">
                <X size={16} />
                Tắt mode
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="flex min-h-[340px] flex-1 items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="surface-card-strong min-h-[340px] flex-1 overflow-hidden p-2 md:min-h-0">
          <MapContainer
            center={mapCenter}
            zoom={13}
            className="h-full min-h-[340px] w-full overflow-hidden rounded-[1.5rem]"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {isPrivateMode && currentLocation ? (
              <>
                <FlyTo lat={currentLocation.lat} lng={currentLocation.lng} nonce={focusNonce} />
                <Marker position={[currentLocation.lat, currentLocation.lng]} icon={privateMarkerIcon}>
                  <Popup>
                    <div className="p-1 text-center">
                      <p className="text-sm font-bold text-pink-500">Vị trí hiện tại</p>
                      <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(currentLocation.updatedAt)}</p>
                    </div>
                  </Popup>
                </Marker>
              </>
            ) : null}

            {places.map((place) => (
              <Marker
                key={place._id}
                position={[place.location.coordinates[1], place.location.coordinates[0]]}
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
                      {place.isVisited && place.rating ? (
                        <span className="text-[11px] font-bold text-yellow-500">{'⭐'.repeat(place.rating)}</span>
                      ) : null}
                    </div>
                    {place.note ? <p className="mt-1.5 text-[10px] italic text-gray-400">"{place.note}"</p> : null}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      <AnimatePresence>
        {privateSheetOpen ? (
          <div className="sheet-shell">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPrivateSheetOpen(false)}
              className="sheet-backdrop"
              aria-label="Dong tuy chon rieng"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="sheet-panel max-h-[82vh] overflow-y-auto"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-rose-100" />
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="section-label">Khong gian rieng</p>
                  <h2 className="mt-2 text-2xl font-black text-ink">Map chung van giu nguyen nhip nhe</h2>
                  <p className="mt-2 text-sm leading-6 text-soft">
                    Cac tuy chon nhay cam khong nam san tren giao dien mac dinh. Neu can, ban moi mo mot mode rieng trong thoi gian ngan.
                  </p>
                </div>

                <button type="button" onClick={() => setPrivateSheetOpen(false)} className="rounded-full p-2 text-soft">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="rounded-[1.5rem] bg-[#fcf7fa] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-black/5">
                      <MapPinned size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-ink">Map chung</p>
                      <p className="mt-2 text-sm leading-6 text-soft">
                        Luon chi hien thi dia diem hai ban da di qua, muon di, hoac dang muon giu lai.
                      </p>
                    </div>
                  </div>
                </div>

                {role === 'boyfriend' ? (
                  <div className="rounded-[1.5rem] bg-slate-900 p-4 text-white">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10">
                        <LockKeyhole size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black">Che do rieng</p>
                        <p className="mt-2 text-sm leading-6 text-white/75">
                          Chi mo sau khi xac thuc PIN BF, tu tat sau mot khoang ngan, va khong de lai dau hieu tren map chung.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { void openPrivateMode(); }}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={privateLoading}
                    >
                      {privateLoading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                      {privateLoading ? 'Dang xac thuc...' : 'Mo che do rieng'}
                    </button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default LoveMap;
