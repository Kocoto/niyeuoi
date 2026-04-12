import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Camera, CheckCircle2, Crosshair, Loader2, MapPin,
  Navigation, Pencil, Plus, RefreshCw, Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OpenLocationCode } from 'open-location-code';
import api from '../api/api';
import EmptyState from '../components/EmptyState';
import RolePill from '../components/RolePill';
import SheetDialog from '../components/SheetDialog';
import type { AppRole } from '../constants/appRoles';
import { ROLE_NAME } from '../constants/appRoles';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: 'Cafe', emoji: '☕' },
  { value: 'Trà sữa', emoji: '🧋' },
  { value: 'Nhà hàng', emoji: '🍽️' },
  { value: 'Ăn vặt', emoji: '🍢' },
  { value: 'Lẩu & Nướng', emoji: '🔥' },
  { value: 'Hải sản', emoji: '🦞' },
  { value: 'Phở & Bún', emoji: '🍜' },
  { value: 'Bánh & Kem', emoji: '🍰' },
  { value: 'Quán nhậu', emoji: '🍺' },
  { value: 'Khác', emoji: '📍' },
];

const STAR_LABEL = ['', 'Tệ quá 😞', 'Tạm được 😐', 'Ổn ổn 😊', 'Ngon lắm! 😋', 'Tuyệt vời! 🤩'];

interface IPlace {
  _id: string;
  name: string;
  address: string;
  image?: string;
  rating?: number;
  note?: string;
  category: string;
  addedBy: AppRole;
  isVisited: boolean;
  location: { type: string; coordinates: number[] };
  createdAt?: string;
}

type Tab = 'wishlist' | 'visited';
type FilterRole = 'all' | AppRole;

type NominatimResult = { display_name: string; lat: string; lon: string };

// ── Utilities ─────────────────────────────────────────────────────────────────

function isPlusCode(input: string) {
  return /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]*/i.test(input.trim().split(' ')[0]);
}

async function geocodeQuery(query: string): Promise<NominatimResult[]> {
  if (isPlusCode(query)) {
    const olc = new OpenLocationCode();
    const parts = query.trim().split(/\s+/);
    let code = parts[0].toUpperCase();
    const locality = parts.slice(1).join(' ');
    if (!olc.isFull(code)) {
      let refLat = 10.776530, refLon = 106.700981;
      if (locality) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locality)}&limit=1`);
          const data = await res.json();
          if (data[0]) { refLat = parseFloat(data[0].lat); refLon = parseFloat(data[0].lon); }
        } catch { /* use fallback */ }
      }
      code = olc.recoverNearest(code, refLat, refLon);
    }
    const decoded = olc.decode(code);
    const lat = String(decoded.latitudeCenter);
    const lon = String(decoded.longitudeCenter);
    let displayName = query;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data.display_name) displayName = data.display_name;
    } catch { /* use fallback */ }
    return [{ display_name: displayName, lat, lon }];
  }
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=4&countrycodes=vn`);
  return res.json();
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
    const data = await res.json();
    return data.display_name ?? '';
  } catch {
    return '';
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

const PlacesV2: React.FC = () => {
  const { role } = useAuth();
  const currentRole = role as AppRole;

  const [places, setPlaces] = useState<IPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('wishlist');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');

  // Random
  const [randomPlace, setRandomPlace] = useState<IPlace | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Detail
  const [detailPlace, setDetailPlace] = useState<IPlace | null>(null);
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [locatingId, setLocatingId] = useState<string | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationResults, setLocationResults] = useState<NominatimResult[]>([]);

  // Rating modal
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingVisitId, setPendingVisitId] = useState<string | null>(null);
  const [tempRating, setTempRating] = useState(5);

  // Create / edit form
  const [showForm, setShowForm] = useState(false);
  const [editPlace, setEditPlace] = useState<IPlace | null>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formLocationQuery, setFormLocationQuery] = useState('');
  const [formLocationSearching, setFormLocationSearching] = useState(false);
  const [formLocationResults, setFormLocationResults] = useState<NominatimResult[]>([]);

  const emptyForm = {
    name: '',
    address: '',
    category: 'Cafe',
    note: '',
    image: '',
    isVisited: false,
    rating: 0,
    location: { type: 'Point', coordinates: [0, 0] },
  };
  const [form, setForm] = useState(emptyForm);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPlaces = useCallback(async () => {
    try {
      const res = await api.get('/places-v2');
      setPlaces(res.data.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchPlaces(); }, [fetchPlaces]);

  // Sync detail if open
  useEffect(() => {
    if (detailPlace) {
      setDetailPlace(prev => prev ? (places.find(p => p._id === prev._id) ?? null) : null);
    }
  }, [places]);

  const display = useMemo(() => {
    let list = places.filter(p => activeTab === 'visited' ? p.isVisited : !p.isVisited);
    if (filterRole !== 'all') list = list.filter(p => p.addedBy === filterRole);
    return list;
  }, [places, activeTab, filterRole]);

  // ── Random ────────────────────────────────────────────────────────────────

  const handleRandom = async () => {
    setIsRolling(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      const res = await api.get(`/places-v2/random?isVisited=${activeTab === 'wishlist' ? 'false' : 'true'}`);
      setRandomPlace(res.data.data);
    } catch {
      // no places
    } finally {
      setIsRolling(false);
    }
  };

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(emptyForm);
    setEditPlace(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setFormLocationQuery('');
    setFormLocationResults([]);
    setShowForm(true);
  };

  const openEdit = (p: IPlace) => {
    setForm({
      name: p.name,
      address: p.address,
      category: p.category,
      note: p.note ?? '',
      image: p.image ?? '',
      isVisited: p.isVisited,
      rating: p.rating ?? 0,
      location: p.location,
    });
    setEditPlace(p);
    setSelectedFile(null);
    setPreviewUrl('');
    setFormLocationQuery('');
    setFormLocationResults([]);
    setShowForm(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      setForm(f => ({ ...f, location: { type: 'Point', coordinates: [longitude, latitude] } }));
      const address = await reverseGeocode(latitude, longitude);
      if (address) setForm(f => ({ ...f, address }));
      setLocating(false);
    }, () => setLocating(false), { enableHighAccuracy: true });
  };

  const searchFormLocation = async () => {
    const q = formLocationQuery.trim();
    if (!q) return;
    setFormLocationSearching(true);
    setFormLocationResults([]);
    try {
      const results = await geocodeQuery(q);
      setFormLocationResults(results);
    } finally {
      setFormLocationSearching(false);
    }
  };

  const applyFormLocation = (r: NominatimResult) => {
    setForm(f => ({
      ...f,
      address: r.display_name,
      location: { type: 'Point', coordinates: [parseFloat(r.lon), parseFloat(r.lat)] },
    }));
    setFormLocationQuery('');
    setFormLocationResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = form.image;
      if (selectedFile) {
        const fd = new FormData();
        fd.append('image', selectedFile);
        const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageUrl = res.data.data.url;
      }
      const payload = { ...form, image: imageUrl, addedBy: currentRole };
      if (!payload.isVisited) delete (payload as any).rating;

      if (editPlace) {
        await api.put(`/places-v2/${editPlace._id}`, payload);
      } else {
        await api.post('/places-v2', payload);
      }

      setShowForm(false);
      setEditPlace(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      setSelectedFile(null);
      await fetchPlaces();
    } finally {
      setSaving(false);
    }
  };

  // ── Visited / Rating ──────────────────────────────────────────────────────

  const markAsVisited = (id: string) => {
    setPendingVisitId(id);
    setTempRating(5);
    setShowRatingModal(true);
  };

  const confirmVisited = async () => {
    if (!pendingVisitId) return;
    await api.put(`/places-v2/${pendingVisitId}`, { isVisited: true, rating: tempRating });
    setShowRatingModal(false);
    setPendingVisitId(null);
    await fetchPlaces();
  };

  // ── Detail location update ─────────────────────────────────────────────────

  const updateLocationGPS = (id: string) => {
    if (!navigator.geolocation) return;
    setLocatingId(id);
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      const address = await reverseGeocode(latitude, longitude);
      const payload: Record<string, any> = { location: { type: 'Point', coordinates: [longitude, latitude] } };
      if (address) payload.address = address;
      await api.put(`/places-v2/${id}`, payload);
      setLocatingId(null);
      setShowLocationPanel(false);
      await fetchPlaces();
    }, () => setLocatingId(null), { enableHighAccuracy: true });
  };

  const searchDetailLocation = async () => {
    const q = locationQuery.trim();
    if (!q) return;
    setLocationSearching(true);
    setLocationResults([]);
    try {
      setLocationResults(await geocodeQuery(q));
    } finally {
      setLocationSearching(false);
    }
  };

  const applyDetailLocation = async (id: string, r: NominatimResult) => {
    await api.put(`/places-v2/${id}`, {
      location: { type: 'Point', coordinates: [parseFloat(r.lon), parseFloat(r.lat)] },
      address: r.display_name,
    });
    setShowLocationPanel(false);
    setLocationQuery('');
    setLocationResults([]);
    await fetchPlaces();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const filterBtns: { key: FilterRole; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'girlfriend', label: ROLE_NAME.girlfriend },
    { key: 'boyfriend', label: ROLE_NAME.boyfriend },
  ];

  const catEmoji = (cat: string) => CATEGORIES.find(c => c.value === cat)?.emoji ?? '📍';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="min-w-0 flex-1">
          <p className="section-label">Địa điểm</p>
          <h1 className="page-title">Sổ tay địa điểm</h1>
          <p className="page-subtitle">Nơi đã đi, nơi muốn đến.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={handleRandom} disabled={isRolling} className="btn-secondary flex items-center gap-1.5">
            {isRolling ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            May mắn
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-1.5">
            <Plus size={16} /> Thêm
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex rounded-2xl bg-rose-50/60 p-1 gap-1">
        {(['wishlist', 'visited'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-ink shadow-sm' : 'text-soft'}`}
          >
            {tab === 'wishlist' ? 'Muốn đi' : 'Đã đi'}
          </button>
        ))}
      </div>

      {/* Person filter */}
      <div className="mb-5 flex gap-1.5">
        {filterBtns.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterRole(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
              filterRole === key ? 'bg-rose-500 text-white shadow-sm' : 'bg-rose-50 text-soft'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Random result */}
      <AnimatePresence>
        {randomPlace && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="mb-5 rounded-[1.5rem] border-2 border-amber-200 bg-amber-50 p-5 text-center"
          >
            <p className="mb-1 text-xs font-bold text-amber-500 uppercase tracking-wider">Gợi ý hôm nay</p>
            <h2 className="text-xl font-black text-ink">{randomPlace.name}</h2>
            <p className="mt-1 text-xs text-soft line-clamp-1">{randomPlace.address}</p>
            <button onClick={() => setRandomPlace(null)} className="mt-3 text-xs font-bold text-soft underline">Đóng</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : display.length === 0 ? (
        <EmptyState
          icon={<MapPin size={22} />}
          eyebrow={activeTab === 'wishlist' ? 'Muốn đi' : 'Đã đi'}
          title={activeTab === 'wishlist' ? 'Chưa có nơi nào trong danh sách' : 'Chưa đánh dấu nơi nào đã đi'}
          description={
            filterRole !== 'all'
              ? `${ROLE_NAME[filterRole as AppRole]} chưa thêm địa điểm nào vào mục này.`
              : activeTab === 'wishlist'
                ? 'Lưu lại những nơi muốn ghé để không bao giờ bỏ lỡ.'
                : 'Khi đã đi, đánh dấu và cho rating nhé.'
          }
          action={<button onClick={openCreate} className="btn-primary">Thêm địa điểm đầu tiên</button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {display.map(place => (
            <motion.button
              key={place._id}
              type="button"
              layout
              whileTap={{ scale: 0.98 }}
              onClick={() => { setDetailPlace(place); setShowLocationPanel(false); setLocationQuery(''); setLocationResults([]); }}
              className="group surface-card w-full overflow-hidden text-left transition-shadow hover:shadow-md"
            >
              {place.image && (
                <div className="-mx-4 -mt-4 mb-3 h-36 overflow-hidden">
                  <img src={place.image} alt={place.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
              )}
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                  {catEmoji(place.category)} {place.category}
                </span>
                {place.isVisited && place.rating ? (
                  <div className="flex items-center gap-0.5 text-yellow-400">
                    <Star size={11} fill="currentColor" />
                    <span className="text-[11px] font-bold">{place.rating}</span>
                  </div>
                ) : null}
              </div>
              <h3 className="mb-1 line-clamp-1 font-bold text-ink group-hover:text-primary transition-colors">{place.name}</h3>
              <p className="line-clamp-1 text-xs text-soft">{place.address}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <RolePill role={place.addedBy} variant="subtle" />
                {place.note && <span className="truncate text-[10px] italic text-soft">"{place.note}"</span>}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* ── Detail Sheet ──────────────────────────────────────────────────── */}
      <SheetDialog
        open={!!detailPlace}
        title={detailPlace?.name ?? ''}
        subtitle={detailPlace?.address}
        onClose={() => setDetailPlace(null)}
        headerSlot={detailPlace ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-600">
            {catEmoji(detailPlace.category)} {detailPlace.category}
          </span>
        ) : undefined}
        footer={detailPlace ? (
          <div className="flex flex-col gap-2">
            {detailPlace.location?.coordinates[0] !== 0 && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${detailPlace.location.coordinates[1]},${detailPlace.location.coordinates[0]}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary w-full flex items-center justify-center gap-1.5 text-blue-600"
              >
                <Navigation size={14} /> Dẫn đường Google Maps
              </a>
            )}
            {!detailPlace.isVisited && (
              <button
                onClick={() => { setDetailPlace(null); markAsVisited(detailPlace._id); }}
                className="btn-primary w-full flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={14} /> Đã đi rồi!
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setDetailPlace(null); openEdit(detailPlace); }}
                className="btn-secondary flex-1 flex items-center justify-center gap-1.5"
              >
                <Pencil size={14} /> Sửa
              </button>
              <button
                onClick={() => {
                  setShowLocationPanel(s => !s);
                  setLocationQuery('');
                  setLocationResults([]);
                }}
                className="btn-secondary flex-1 flex items-center justify-center gap-1.5"
              >
                <Crosshair size={14} /> {detailPlace.location?.coordinates[0] !== 0 ? 'Cập nhật vị trí' : 'Thêm vị trí'}
              </button>
            </div>

            {/* Location panel inside footer */}
            {showLocationPanel && detailPlace && (
              <div className="rounded-2xl bg-rose-50/60 p-4 space-y-3">
                <button
                  onClick={() => updateLocationGPS(detailPlace._id)}
                  disabled={locatingId === detailPlace._id}
                  className="btn-secondary w-full flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
                >
                  {locatingId === detailPlace._id
                    ? <><Loader2 size={13} className="animate-spin" /> Đang định vị...</>
                    : <><Navigation size={13} /> Lấy GPS hiện tại</>}
                </button>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={e => setLocationQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && void searchDetailLocation()}
                    placeholder="Nhập tên quán hoặc Plus Code..."
                    className="input-field flex-1 text-xs"
                  />
                  <button onClick={searchDetailLocation} disabled={locationSearching} className="btn-secondary shrink-0 px-3 disabled:opacity-50">
                    {locationSearching ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
                  </button>
                </div>
                {locationResults.map((r, i) => (
                  <div key={i} className="rounded-xl bg-white p-3 space-y-2 border border-rose-100">
                    <p className="text-xs text-soft leading-relaxed">📍 {r.display_name}</p>
                    <button
                      onClick={() => void applyDetailLocation(detailPlace._id, r)}
                      className="btn-primary w-full text-xs py-2"
                    >
                      Lưu vị trí này
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : undefined}
      >
        {detailPlace ? (
          <div className="space-y-3">
            {detailPlace.image && (
              <div className="-mx-0 overflow-hidden rounded-2xl">
                <img src={detailPlace.image} alt={detailPlace.name} className="h-44 w-full object-cover" />
              </div>
            )}
            {detailPlace.isVisited && detailPlace.rating ? (
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={16} className={s <= detailPlace.rating! ? 'text-yellow-400' : 'text-gray-200'} fill={s <= detailPlace.rating! ? 'currentColor' : 'none'} />
                ))}
                <span className="ml-1 text-xs font-bold text-soft">{STAR_LABEL[detailPlace.rating]}</span>
              </div>
            ) : null}
            {detailPlace.note && (
              <p className="rounded-2xl bg-rose-50/60 p-4 text-sm italic text-soft">"{detailPlace.note}"</p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-soft">Thêm bởi:</span>
              <RolePill role={detailPlace.addedBy} variant="soft" />
            </div>
          </div>
        ) : null}
      </SheetDialog>

      {/* ── Rating Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRatingModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="surface-card relative z-10 w-full max-w-sm p-8 text-center"
            >
              <div className="mb-3 text-4xl">🍽️</div>
              <h2 className="mb-1 text-xl font-bold text-ink">Quán ăn thế nào?</h2>
              <p className="mb-6 text-sm text-soft">Chấm điểm để ghi nhớ nhé!</p>
              <div className="mb-3 flex justify-center gap-3">
                {[1,2,3,4,5].map(star => (
                  <button key={star} type="button" onClick={() => setTempRating(star)}
                    className="transition-transform hover:scale-125 active:scale-95"
                  >
                    <Star size={36} className={star <= tempRating ? 'text-yellow-400' : 'text-gray-200'} fill={star <= tempRating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <p className="mb-6 text-sm font-bold text-soft">{STAR_LABEL[tempRating]}</p>
              <div className="flex gap-3">
                <button onClick={() => setShowRatingModal(false)} className="btn-secondary flex-1">Hủy</button>
                <button onClick={confirmVisited} className="btn-primary flex-1">Xác nhận</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Create / Edit Form Sheet ──────────────────────────────────────── */}
      <SheetDialog
        open={showForm}
        title={editPlace ? 'Cập nhật địa điểm' : 'Thêm địa điểm mới'}
        onClose={() => { setShowForm(false); setEditPlace(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(''); }}
        footer={
          <button
            form="place-form"
            type="submit"
            disabled={saving || !form.name.trim() || !form.address.trim()}
            className="btn-primary w-full py-4 text-base font-bold disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : editPlace ? 'Lưu thay đổi' : 'Lưu địa điểm'}
          </button>
        }
      >
        <form id="place-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Photo */}
          <label className="relative flex h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-rose-100 bg-rose-50/40">
            {(previewUrl || form.image) ? (
              <img src={previewUrl || form.image} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-soft">
                <Camera size={22} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Chọn ảnh</span>
              </div>
            )}
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileSelect} />
          </label>

          {/* Category */}
          <div>
            <p className="mb-2 text-xs font-bold text-soft">Loại</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                  className={`rounded-full border px-2.5 py-1 text-xs font-bold transition-all ${
                    form.category === cat.value ? 'border-primary bg-rose-50 text-primary' : 'border-rose-100 bg-white text-soft'
                  }`}
                >
                  {cat.emoji} {cat.value}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <p className="mb-1 text-xs font-bold text-soft">Tên địa điểm</p>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Tên quán, địa điểm..." className="input-field w-full" />
          </div>

          {/* Address with GPS */}
          <div>
            <p className="mb-1 text-xs font-bold text-soft">Địa chỉ</p>
            <div className="flex gap-2">
              <input required value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Địa chỉ..." className="input-field flex-1 text-xs" />
              <button type="button" onClick={getCurrentLocation} disabled={locating}
                className="btn-secondary shrink-0 px-3 disabled:opacity-50"
                title="Lấy GPS">
                {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
              </button>
            </div>
          </div>

          {/* Search location / Plus Code */}
          <div>
            <p className="mb-1 text-xs font-bold text-soft">Tìm tọa độ (Plus Code hoặc tên quán)</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={formLocationQuery}
                onChange={e => setFormLocationQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && void searchFormLocation()}
                placeholder="VD: QMJ6+WJ6 Hoa Hung hoặc tên quán"
                className="input-field flex-1 text-xs"
              />
              <button type="button" onClick={searchFormLocation} disabled={formLocationSearching}
                className="btn-secondary shrink-0 px-3 disabled:opacity-50">
                {formLocationSearching ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
              </button>
            </div>
            {formLocationResults.length > 0 && (
              <div className="mt-2 space-y-2 max-h-36 overflow-y-auto">
                {formLocationResults.map((r, i) => (
                  <button key={i} type="button" onClick={() => applyFormLocation(r)}
                    className="w-full rounded-xl border border-rose-100 bg-white p-2.5 text-left text-xs text-soft hover:border-primary transition-all"
                  >
                    📍 {r.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <p className="mb-1 text-xs font-bold text-soft">Ghi chú</p>
            <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Thích ở đây vì..." className="input-field w-full" />
          </div>

          {/* Already visited toggle */}
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={form.isVisited}
              onChange={e => setForm(f => ({ ...f, isVisited: e.target.checked }))}
              className="h-4 w-4 rounded text-primary" />
            <span className="text-xs font-bold text-soft">Đã đi rồi</span>
          </label>
        </form>
      </SheetDialog>
    </div>
  );
};

export default PlacesV2;
