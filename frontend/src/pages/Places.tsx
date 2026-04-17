import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import { OpenLocationCode } from 'open-location-code';
import {
  Camera,
  CheckCircle2,
  Crosshair,
  Loader2,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PersonBadge from '../components/PersonBadge';
import PersonScopeTabs, { type PersonScope } from '../components/PersonScopeTabs';
import { ROLE_NAME, isRole, type Role } from '../constants/roles';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

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
] as const;

type PlaceStatus = 'want_to_go' | 'next_time' | 'visited';

type LocationResult = {
  display_name: string;
  lat: string;
  lon: string;
};

interface IPlace {
  _id: string;
  name: string;
  address: string;
  rating?: number | null;
  category: string;
  note?: string;
  image?: string;
  isVisited: boolean;
  status?: PlaceStatus;
  createdBy?: Role;
  location: {
    type: string;
    coordinates: number[];
  };
}

type PlaceFormState = {
  name: string;
  address: string;
  rating: number;
  category: string;
  note: string;
  image: string;
  status: PlaceStatus;
  location: {
    type: string;
    coordinates: number[];
  };
};

const PLACE_STATUS_ORDER: PlaceStatus[] = ['want_to_go', 'next_time', 'visited'];

const STATUS_META: Record<
  PlaceStatus,
  {
    label: string;
    shortLabel: string;
    description: string;
    chipClassName: string;
    tabClassName: string;
    panelClassName: string;
    noteLabel: string;
    randomLabel: string;
    emptyTitle: string;
    emptyBody: string;
    emptyAction: string;
  }
> = {
  want_to_go: {
    label: 'Muốn đi',
    shortLabel: 'Muốn đi',
    description: 'Lưu những chỗ vừa thấy hay để không quên và chưa cần chốt ngay.',
    chipClassName: 'bg-rose-50 text-rose-700 ring-rose-200/80',
    tabClassName: 'bg-rose-500 text-white shadow-sm shadow-rose-200/70',
    panelClassName: 'border-rose-100 bg-gradient-to-br from-white via-rose-50 to-orange-50',
    noteLabel: 'Vì sao lưu lại',
    randomLabel: 'Chọn một nơi bất kỳ',
    emptyTitle: 'Danh sách muốn đi còn đang trống',
    emptyBody: 'Lưu một chỗ hai bạn vừa nhắc tới để tối khác mở ra là biết bắt đầu từ đâu.',
    emptyAction: 'Thêm vào Muốn đi',
  },
  next_time: {
    label: 'Lần tới nên thử',
    shortLabel: 'Lần tới',
    description: 'Danh sách ngắn để lần hẹn kế tiếp bớt phân vân và quyết nhanh hơn.',
    chipClassName: 'bg-amber-50 text-amber-700 ring-amber-200/80',
    tabClassName: 'bg-amber-500 text-white shadow-sm shadow-amber-200/70',
    panelClassName: 'border-amber-100 bg-gradient-to-br from-white via-amber-50 to-orange-50',
    noteLabel: 'Lý do nên thử tiếp theo',
    randomLabel: 'Quick decision',
    emptyTitle: 'Chưa có nơi nào được ghim cho lần tới',
    emptyBody: 'Khi hai bạn đã có vài lựa chọn sáng giá, hãy ghim một nơi vào đây để lần hẹn sau mở ra là chốt nhanh được ngay.',
    emptyAction: 'Ghim một nơi cho lần tới',
  },
  visited: {
    label: 'Đã đi',
    shortLabel: 'Đã đi',
    description: 'Những nơi đã thành kỷ niệm, có thể chấm điểm và giữ lại cảm giác sau buổi hẹn.',
    chipClassName: 'bg-sky-50 text-sky-700 ring-sky-200/80',
    tabClassName: 'bg-sky-500 text-white shadow-sm shadow-sky-200/70',
    panelClassName: 'border-sky-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50',
    noteLabel: 'Điều còn nhớ lại',
    randomLabel: 'Nhớ lại một nơi',
    emptyTitle: 'Chưa có địa điểm nào được đánh dấu đã đi',
    emptyBody: 'Khi một buổi hẹn kết thúc, chuyển địa điểm sang đây để giữ rating và note thay vì để mọi thứ trôi mất.',
    emptyAction: 'Thêm trực tiếp vào Đã đi',
  },
};

const resolvePlaceStatus = (place: Pick<IPlace, 'status' | 'isVisited'>): PlaceStatus => {
  if (place.status === 'want_to_go' || place.status === 'next_time' || place.status === 'visited') {
    return place.status;
  }

  return place.isVisited ? 'visited' : 'want_to_go';
};

const resolvePlaceOwner = (createdBy?: Role): Role | null => (isRole(createdBy) ? createdBy : null);

const matchesPlaceScope = (place: IPlace, scope: PersonScope) => {
  if (scope === 'all') return true;
  return resolvePlaceOwner(place.createdBy) === scope;
};

const getPersonScopeLabel = (scope: PersonScope) => (scope === 'all' ? 'Tất cả' : ROLE_NAME[scope]);

const createInitialForm = (status: PlaceStatus = 'want_to_go'): PlaceFormState => ({
  name: '',
  address: '',
  rating: 5,
  category: 'Cafe',
  note: '',
  image: '',
  status,
  location: {
    type: 'Point',
    coordinates: [0, 0],
  },
});

const Places: React.FC = () => {
  const [places, setPlaces] = useState<IPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PlaceStatus>('want_to_go');
  const [personScope, setPersonScope] = useState<PersonScope>('all');
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
  const [previewUrl, setPreviewUrl] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [pendingVisitId, setPendingVisitId] = useState<string | null>(null);
  const [tempRating, setTempRating] = useState(5);
  const [locatingId, setLocatingId] = useState<string | null>(null);
  const [detailPlace, setDetailPlace] = useState<IPlace | null>(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [formLocationQuery, setFormLocationQuery] = useState('');
  const [formLocationSearching, setFormLocationSearching] = useState(false);
  const [formLocationResults, setFormLocationResults] = useState<LocationResult[]>([]);
  const [formData, setFormData] = useState<PlaceFormState>(createInitialForm());

  const groupedPlaces = useMemo<Record<PlaceStatus, IPlace[]>>(() => {
    const groups: Record<PlaceStatus, IPlace[]> = {
      want_to_go: [],
      next_time: [],
      visited: [],
    };

    places.forEach((place) => {
      groups[resolvePlaceStatus(place)].push(place);
    });

    return groups;
  }, [places]);

  const filteredPlacesByStatus = useMemo<Record<PlaceStatus, IPlace[]>>(() => ({
    want_to_go: groupedPlaces.want_to_go.filter((place) => matchesPlaceScope(place, personScope)),
    next_time: groupedPlaces.next_time.filter((place) => matchesPlaceScope(place, personScope)),
    visited: groupedPlaces.visited.filter((place) => matchesPlaceScope(place, personScope)),
  }), [groupedPlaces, personScope]);

  const scopeCounts = useMemo<Record<PersonScope, number>>(() => ({
    all: places.length,
    girlfriend: places.filter((place) => matchesPlaceScope(place, 'girlfriend')).length,
    boyfriend: places.filter((place) => matchesPlaceScope(place, 'boyfriend')).length,
  }), [places]);

  const visiblePlaces = filteredPlacesByStatus[activeTab];
  const activeStatusMeta = STATUS_META[activeTab];
  const activeScopeLabel = getPersonScopeLabel(personScope);
  const filteredEmptyTitle = personScope === 'all'
    ? activeStatusMeta.emptyTitle
    : `Chưa có địa điểm nào trong nhóm "${activeStatusMeta.label}" từ phía ${activeScopeLabel}`;
  const filteredEmptyBody = personScope === 'all'
    ? activeStatusMeta.emptyBody
    : `${ROLE_NAME[personScope]} chưa có địa điểm nào khớp nhóm này. Các record cũ chưa rõ người lưu vẫn ở mục Tất cả để không bị mất dấu.`;

  const cleanupPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setSelectedFile(null);
  };

  const resetForm = (status: PlaceStatus = activeTab) => {
    setFormData(createInitialForm(status));
    setIsEditing(false);
    setEditingId(null);
    setFormLocationQuery('');
    setFormLocationResults([]);
  };

  const closeFormModal = (nextStatus: PlaceStatus = activeTab) => {
    setShowModal(false);
    cleanupPreview();
    resetForm(nextStatus);
  };

  const openCreateModal = (status: PlaceStatus = activeTab) => {
    cleanupPreview();
    resetForm(status);
    setShowModal(true);
  };

  const fetchPlaces = useCallback(async () => {
    try {
      const res = await api.get('/places');
      const data: IPlace[] = res.data.data ?? [];
      setPlaces(data);
      setDetailPlace((prev) => (prev ? data.find((place) => place._id === prev._id) ?? null : null));
    } catch {
      console.error('Lỗi khi tải địa điểm');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  useEffect(() => {
    setRandomPlace((current) => {
      if (!current) return null;
      return visiblePlaces.find((place) => place._id === current._id) ?? null;
    });
  }, [visiblePlaces]);

  const handleEdit = (place: IPlace) => {
    cleanupPreview();
    setFormData({
      name: place.name,
      address: place.address,
      rating: place.rating ?? 5,
      category: place.category,
      note: place.note || '',
      image: place.image || '',
      status: resolvePlaceStatus(place),
      location: place.location || { type: 'Point', coordinates: [0, 0] },
    });
    setEditingId(place._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const deletePlace = async (id: string) => {
    if (!await confirm('Xóa địa điểm này nhé?')) return;
    try {
      await api.delete(`/places/${id}`);
      setDetailPlace((prev) => (prev?._id === id ? null : prev));
      await fetchPlaces();
    } catch {
      toast('Không xóa được địa điểm này!', 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    cleanupPreview();
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
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
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = res.data.data.url;
      }

      const payload = {
        ...formData,
        image: imageUrl,
        status: formData.status,
        isVisited: formData.status === 'visited',
        rating: formData.status === 'visited' ? formData.rating : null,
      };

      if (isEditing && editingId) {
        await api.put(`/places/${editingId}`, payload);
      } else {
        await api.post('/places', payload);
      }

      const nextTab = formData.status;
      closeFormModal(nextTab);
      setActiveTab(nextTab);
      await fetchPlaces();
    } catch {
      toast('Lỗi khi lưu địa điểm!', 'error');
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
      await api.put(`/places/${pendingVisitId}`, {
        status: 'visited',
        isVisited: true,
        rating: tempRating,
      });
      setShowRatingModal(false);
      setPendingVisitId(null);
      setDetailPlace(null);
      setActiveTab('visited');
      await fetchPlaces();
    } catch {
      toast('Lỗi cập nhật trạng thái!', 'error');
    }
  };

  const movePlaceToStatus = async (place: IPlace, status: PlaceStatus) => {
    try {
      await api.put(`/places/${place._id}`, {
        status,
        isVisited: status === 'visited',
        rating: status === 'visited' ? place.rating ?? 5 : null,
      });
      setActiveTab(status);
      await fetchPlaces();
      toast(`Đã chuyển sang ${STATUS_META[status].label.toLowerCase()}.`, 'success');
    } catch {
      toast('Không chuyển trạng thái được!', 'error');
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
      setFormData((prev) => ({
        ...prev,
        location: { type: 'Point', coordinates: [longitude, latitude] },
      }));

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
        const data = await res.json();
        if (data.display_name) {
          setFormData((prev) => ({ ...prev, address: data.display_name }));
        }
      } catch (err) {
        console.error('[Location] Lỗi reverse geocode:', err);
      } finally {
        setLocating(false);
      }
    }, () => {
      toast('Không thể lấy vị trí!', 'warning');
      setLocating(false);
    }, { enableHighAccuracy: true });
  };

  const isPlusCode = (input: string) =>
    /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]*/i.test(input.trim().split(' ')[0]);

  const searchAndDecodePlusCode = async (query: string): Promise<LocationResult[]> => {
    if (isPlusCode(query)) {
      const olc = new OpenLocationCode();
      const parts = query.trim().split(/\s+/);
      let code = parts[0].toUpperCase();
      const locality = parts.slice(1).join(' ');

      if (!olc.isFull(code)) {
        let refLat = 10.77653;
        let refLon = 106.700981;
        if (locality) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locality)}&limit=1`);
            const data = await res.json();
            if (data[0]) {
              refLat = parseFloat(data[0].lat);
              refLon = parseFloat(data[0].lon);
            }
          } catch (err) {
            console.error('[Location] Lỗi geocode locality:', err);
          }
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
      } catch (err) {
        console.error('[Location] Lỗi reverse geocode:', err);
      }

      return [{ display_name: displayName, lat, lon }];
    }

    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=4&countrycodes=vn`);
    return res.json();
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

  const applyFormLocation = (result: LocationResult) => {
    setFormData((prev) => ({
      ...prev,
      address: result.display_name,
      location: { type: 'Point', coordinates: [parseFloat(result.lon), parseFloat(result.lat)] },
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
    try {
      await api.put(`/places/${id}`, {
        location: { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] },
        address: displayName,
      });
      toast('Đã cập nhật vị trí!', 'success');
      setShowLocationInput(false);
      setLocationQuery('');
      setLocationResults([]);
      await fetchPlaces();
    } catch {
      toast('Lỗi cập nhật vị trí!', 'error');
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
        } catch (err) {
          console.error('[Location] Lỗi reverse geocode:', err);
        }

        const updateData: Record<string, unknown> = {
          location: { type: 'Point', coordinates: [longitude, latitude] },
        };

        if (address) {
          updateData.address = address;
        }

        await api.put(`/places/${id}`, updateData);
        toast('Đã cập nhật vị trí!', 'success');
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
    const candidates = filteredPlacesByStatus[activeTab];
    if (candidates.length === 0) {
      toast(filteredEmptyTitle, 'warning');
      return;
    }

    setIsRolling(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    const randomIndex = Math.floor(Math.random() * candidates.length);
    setRandomPlace(candidates[randomIndex]);
    setIsRolling(false);
  };

  const openDetail = (place: IPlace) => {
    setDetailPlace(place);
    setShowLocationInput(false);
    setLocationQuery('');
    setLocationResults([]);
  };

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 pb-24 md:px-4 md:py-8 md:pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-rose-100 bg-gradient-to-br from-white via-rose-50 to-sky-50 p-5 shadow-sm md:p-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_60%)] md:block" />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-[#b292a6]">Places</p>
              <h1 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">Đi đâu tiếp theo, và nơi nào đáng nhớ lại?</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 md:text-[15px]">
                Màn này không chỉ để cất địa chỉ. Nó giúp hai bạn giữ những nơi muốn đi, chốt nhanh chỗ cho lần tới, và nhớ lại nơi đã thành kỷ niệm.
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <PersonBadge role={role} prefix="Đang xem với vai" />
                  {PLACE_STATUS_ORDER.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setActiveTab(status)}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-all ${
                        activeTab === status
                          ? STATUS_META[status].chipClassName
                          : 'bg-white/80 text-slate-500 ring-slate-200 hover:text-slate-700'
                      }`}
                    >
                      <span>{STATUS_META[status].shortLabel}</span>
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px]">{filteredPlacesByStatus[status].length}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Xem theo người lưu</p>
                  <PersonScopeTabs
                    value={personScope}
                    onChange={setPersonScope}
                    counts={scopeCounts}
                    ariaLabel="Lọc Places theo người lưu"
                  />
                  {personScope !== 'all' ? (
                    <p className="text-xs leading-5 text-slate-500">
                      Chế độ này chỉ hiện các địa điểm đã gắn rõ với {ROLE_NAME[personScope]}. Record cũ chưa rõ người lưu vẫn nằm ở mục Tất cả.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex w-full gap-2 md:w-auto">
              <button
                type="button"
                onClick={handleRandom}
                disabled={isRolling}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 md:flex-none"
              >
                {isRolling ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                {activeStatusMeta.randomLabel}
              </button>
              <button
                type="button"
                onClick={() => openCreateModal(activeTab)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-pink-200/70 transition-all hover:-translate-y-0.5 md:flex-none"
              >
                <Plus size={18} />
                Thêm địa điểm
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={`mt-5 rounded-[1.8rem] border p-5 shadow-sm ${activeStatusMeta.panelClassName}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b292a6]">
              {activeTab === 'next_time' ? 'Quick Decision Mode' : 'Context'}
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">{activeStatusMeta.label}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{activeStatusMeta.description}</p>
            {personScope !== 'all' ? (
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Đang nhìn riêng phần của {activeScopeLabel.toLowerCase()} trong nhóm này.
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/80 p-1.5 ring-1 ring-white/80">
            {PLACE_STATUS_ORDER.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setActiveTab(status)}
                className={`rounded-2xl px-3 py-3 text-center text-xs font-black transition-all ${
                  activeTab === status
                    ? STATUS_META[status].tabClassName
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
                >
                  <span className="block">{STATUS_META[status].shortLabel}</span>
                  <span className="mt-1 block text-[11px] font-semibold opacity-80">{filteredPlacesByStatus[status].length} nơi</span>
                </button>
              ))}
            </div>
        </div>

        <AnimatePresence>
          {randomPlace && resolvePlaceStatus(randomPlace) === activeTab && (
            <motion.div
              key={randomPlace._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-5 rounded-[1.6rem] bg-white/90 p-4 shadow-sm ring-1 ring-white md:p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${STATUS_META[activeTab].chipClassName}`}>
                      {STATUS_META[activeTab].label}
                    </span>
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                      {CATEGORIES.find((item) => item.value === randomPlace.category)?.emoji} {randomPlace.category}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-black text-slate-900">{randomPlace.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    <MapPin size={14} className="mr-1 inline text-primary" />
                    {randomPlace.address}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {randomPlace.note || 'Chưa có note riêng, nhưng có thể là lựa chọn tốt để hai bạn quyết nhanh khi cần.'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 md:w-52">
                  <button
                    type="button"
                    onClick={() => openDetail(randomPlace)}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    type="button"
                    onClick={() => setRandomPlace(null)}
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-500 ring-1 ring-slate-200 transition-all hover:text-slate-700"
                  >
                    Đóng gợi ý
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : visiblePlaces.length === 0 ? (
        <section className="mt-5 rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <MapPin size={24} />
          </div>
          <h2 className="mt-5 text-2xl font-black text-slate-900">{filteredEmptyTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">{filteredEmptyBody}</p>
          <button
            type="button"
            onClick={() => openCreateModal(activeTab)}
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-pink-200/70 transition-all hover:-translate-y-0.5"
          >
            {activeStatusMeta.emptyAction}
          </button>
        </section>
      ) : (
        <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visiblePlaces.map((place) => {
            const status = resolvePlaceStatus(place);
            const owner = resolvePlaceOwner(place.createdBy);
            const hasCoordinates = (place.location?.coordinates?.[0] ?? 0) !== 0 || (place.location?.coordinates?.[1] ?? 0) !== 0;

            return (
              <motion.article
                key={place._id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openDetail(place)}
                className="group cursor-pointer overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                {place.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img src={place.image} alt={place.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-transparent to-transparent" />
                  </div>
                )}

                <div className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${STATUS_META[status].chipClassName}`}>
                        {STATUS_META[status].label}
                      </span>
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                        {CATEGORIES.find((item) => item.value === place.category)?.emoji} {place.category}
                      </span>
                      {hasCoordinates && (
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/80">
                          Có vị trí
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {status === 'visited' && place.rating ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-bold text-yellow-700 ring-1 ring-yellow-200">
                          <Star size={13} className="fill-current" />
                          {place.rating}
                        </div>
                      ) : null}
                      {role === 'boyfriend' && (
                        <div className="flex gap-1.5 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEdit(place);
                            }}
                            className="rounded-full bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-200 transition-all hover:text-primary"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              deletePlace(place._id);
                            }}
                            className="rounded-full bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-200 transition-all hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="mt-4 text-2xl font-black text-slate-900 transition-colors group-hover:text-primary">{place.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    <MapPin size={14} className="mr-1 inline text-primary" />
                    {place.address}
                  </p>

                  <div className="mt-4 rounded-[1.4rem] bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                      {STATUS_META[status].noteLabel}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {place.note || 'Chưa có note riêng cho địa điểm này, nhưng bạn vẫn có thể mở ra và thêm lại để bối cảnh rõ hơn.'}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {owner ? (
                      <PersonBadge role={owner} prefix="Lưu bởi" />
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-600 ring-1 ring-stone-200">
                        Dữ liệu cũ chưa rõ ai lưu
                      </span>
                    )}
                    {!place.note && (
                      <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                        Cần thêm bối cảnh
                      </span>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </section>
      )}
      <AnimatePresence>
        {detailPlace && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 md:items-center md:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setDetailPlace(null);
                setShowLocationInput(false);
                setLocationResults([]);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2.2rem] bg-white shadow-2xl"
            >
              {detailPlace.image ? (
                <div className="relative h-56 overflow-hidden">
                  <img src={detailPlace.image} alt={detailPlace.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
                  <button
                    type="button"
                    onClick={() => setDetailPlace(null)}
                    className="absolute right-4 top-4 rounded-full bg-white/85 p-2 text-slate-700 backdrop-blur-sm"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex justify-end p-4">
                  <button type="button" onClick={() => setDetailPlace(null)} className="rounded-full p-2 text-slate-400 transition-all hover:text-slate-700">
                    <X size={18} />
                  </button>
                </div>
              )}

              <div className="space-y-5 p-6">
                {(() => {
                  const status = resolvePlaceStatus(detailPlace);
                  const owner = resolvePlaceOwner(detailPlace.createdBy);
                  const hasCoordinates = (detailPlace.location?.coordinates?.[0] ?? 0) !== 0 || (detailPlace.location?.coordinates?.[1] ?? 0) !== 0;

                  return (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${STATUS_META[status].chipClassName}`}>
                              {STATUS_META[status].label}
                            </span>
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                              {CATEGORIES.find((item) => item.value === detailPlace.category)?.emoji} {detailPlace.category}
                            </span>
                          </div>
                          <h2 className="mt-3 text-3xl font-black text-slate-900">{detailPlace.name}</h2>
                        </div>

                        {status === 'visited' && detailPlace.rating ? (
                          <div className="inline-flex items-center gap-1 rounded-2xl bg-yellow-50 px-4 py-3 text-yellow-700 ring-1 ring-yellow-200">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={star <= detailPlace.rating! ? 'text-yellow-400' : 'text-gray-200'}
                                fill={star <= detailPlace.rating! ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {owner ? (
                          <PersonBadge role={owner} prefix="Lưu bởi" />
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-600 ring-1 ring-stone-200">
                            Dữ liệu cũ chưa rõ ai lưu
                          </span>
                        )}
                        {hasCoordinates && (
                          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200/80">
                            Có thể mở đường đi
                          </span>
                        )}
                      </div>

                      <div className="rounded-[1.4rem] bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                        <div className="font-black uppercase tracking-[0.22em] text-slate-400">Địa chỉ</div>
                        <div className="mt-2 flex items-start gap-2">
                          <MapPin size={15} className="mt-1 shrink-0 text-primary" />
                          <span>{detailPlace.address}</span>
                        </div>
                      </div>

                      <div className="rounded-[1.4rem] bg-slate-50 p-4">
                        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                          {STATUS_META[status].noteLabel}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {detailPlace.note || 'Chưa có note riêng cho địa điểm này.'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {hasCoordinates ? (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${detailPlace.location.coordinates[1]},${detailPlace.location.coordinates[0]}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 py-3 text-sm font-bold text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
                          >
                            <Navigation size={16} />
                            Dẫn đường Google Maps
                          </a>
                        ) : null}

                        {!showLocationInput ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setShowLocationInput(true);
                              setLocationResults([]);
                              setLocationQuery('');
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-50 py-3 text-sm font-bold text-violet-600 transition-all hover:bg-violet-600 hover:text-white"
                          >
                            <Crosshair size={15} />
                            {hasCoordinates ? 'Cập nhật lại vị trí' : 'Cập nhật vị trí'}
                          </button>
                        ) : (
                          <div className="rounded-[1.4rem] bg-violet-50 p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-[0.24em] text-violet-500">Chọn cách cập nhật</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowLocationInput(false);
                                  setLocationResults([]);
                                }}
                                className="text-slate-400 transition-all hover:text-slate-700"
                              >
                                <X size={15} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                updatePlaceLocation(detailPlace._id);
                              }}
                              disabled={locatingId === detailPlace._id}
                              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-violet-200 bg-white py-2.5 text-sm font-bold text-violet-600 transition-all hover:border-violet-500 disabled:opacity-60"
                            >
                              {locatingId === detailPlace._id ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  Đang định vị...
                                </>
                              ) : (
                                <>
                                  <Navigation size={14} />
                                  Lấy vị trí hiện tại
                                </>
                              )}
                            </button>

                            <p className="mt-3 px-1 text-[10px] font-black uppercase tracking-[0.24em] text-violet-400">
                              Hoặc nhập thủ công / Plus Code
                            </p>
                            <div className="mt-2 flex gap-2">
                              <input
                                type="text"
                                value={locationQuery}
                                onChange={(event) => setLocationQuery(event.target.value)}
                                onKeyDown={(event) => event.key === 'Enter' && searchLocationByAddress()}
                                placeholder="Dán Plus Code hoặc tên địa điểm"
                                className="flex-1 rounded-xl border-2 border-violet-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-violet-500"
                                onClick={(event) => event.stopPropagation()}
                              />
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  searchLocationByAddress();
                                }}
                                disabled={locationSearching}
                                className="rounded-xl bg-violet-500 px-3 py-2 text-white transition-all hover:bg-violet-600 disabled:opacity-60"
                              >
                                {locationSearching ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
                              </button>
                            </div>

                            {locationResults.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {locationResults.map((result, index) => (
                                  <div key={`${result.lat}-${result.lon}-${index}`} className="rounded-xl border border-violet-100 bg-white p-3">
                                    <p className="text-xs leading-relaxed text-slate-600">📍 {result.display_name}</p>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        applyManualLocation(detailPlace._id, result.lat, result.lon, result.display_name);
                                      }}
                                      className="mt-2 w-full rounded-lg bg-violet-500 py-2 text-xs font-bold text-white transition-all hover:bg-violet-600"
                                    >
                                      Lưu vị trí này
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {status === 'want_to_go' && (
                          <button
                            type="button"
                            onClick={() => movePlaceToStatus(detailPlace, 'next_time')}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-50 py-3 text-sm font-bold text-amber-700 transition-all hover:bg-amber-500 hover:text-white"
                          >
                            Ghim cho lần tới
                          </button>
                        )}

                        {status === 'next_time' && (
                          <button
                            type="button"
                            onClick={() => movePlaceToStatus(detailPlace, 'want_to_go')}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 py-3 text-sm font-bold text-rose-700 transition-all hover:bg-rose-500 hover:text-white"
                          >
                            Đưa về Muốn đi
                          </button>
                        )}

                        {status !== 'visited' && (
                          <button
                            type="button"
                            onClick={() => {
                              setDetailPlace(null);
                              markAsVisited(detailPlace._id);
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-50 py-3 text-sm font-bold text-sky-700 transition-all hover:bg-sky-500 hover:text-white"
                          >
                            <CheckCircle2 size={15} />
                            Đã đi rồi nè
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRatingModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm rounded-[2.2rem] bg-white p-8 text-center shadow-2xl"
            >
              <div className="text-4xl">📍</div>
              <h2 className="mt-3 text-xl font-black text-slate-900">Buổi hẹn ở chỗ này thế nào?</h2>
              <p className="mt-2 text-sm text-slate-400">Chấm nhanh để lần sau nhìn lại là nhớ cảm giác ngay.</p>
              <div className="mt-6 flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setTempRating(star)}
                    className="transition-transform hover:scale-125 active:scale-95"
                  >
                    <Star size={36} className={star <= tempRating ? 'text-yellow-400' : 'text-gray-200'} fill={star <= tempRating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setShowRatingModal(false)} className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-500">
                  Hủy
                </button>
                <button type="button" onClick={confirmVisited} className="flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-pink-200/70">
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => closeFormModal()}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="relative max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-[2.2rem] bg-white shadow-2xl"
            >
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b292a6]">Places</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-900">
                      {isEditing ? 'Cập nhật địa điểm' : 'Thêm địa điểm mới'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Chọn rõ địa điểm này đang ở `Muốn đi`, `Lần tới nên thử`, hay `Đã đi` để Places không bị thành một list phẳng.
                    </p>
                  </div>
                  <button type="button" onClick={() => closeFormModal()} className="rounded-full p-2 text-slate-400 transition-all hover:text-slate-700">
                    <X />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="space-y-2">
                    <PersonBadge role={role} prefix={isEditing ? 'Bạn đang chỉnh với vai' : 'Địa điểm mới sẽ gắn với'} />
                    <p className="text-xs leading-5 text-slate-400">
                      Record cũ chưa có metadata vẫn được giữ nguyên; record mới sẽ rõ là Ni hay Được đã lưu.
                    </p>
                  </div>

                  <div className="relative aspect-[16/10] overflow-hidden rounded-[1.8rem] border-2 border-dashed border-slate-200 bg-slate-50">
                    {(previewUrl || formData.image) ? (
                      <img src={previewUrl || formData.image} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-slate-400">
                        <Camera className="mb-3" />
                        <span className="text-[11px] font-black uppercase tracking-[0.26em]">Chọn ảnh cho địa điểm</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={handleFileSelect} />
                  </div>

                  <div className="grid gap-3">
                    <input
                      required
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                      className="w-full rounded-2xl border-2 border-transparent bg-slate-50 px-4 py-4 text-sm outline-none transition-all focus:border-primary"
                      placeholder="Tên quán, góc nhỏ, địa điểm..."
                    />

                    <div className="relative">
                      <input
                        required
                        value={formData.address}
                        onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                        className="w-full rounded-2xl border-2 border-transparent bg-slate-50 px-4 py-4 pr-24 text-sm outline-none transition-all focus:border-primary"
                        placeholder="Địa chỉ hoặc mô tả nơi chốn"
                      />
                      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 gap-1">
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          disabled={locating}
                          title="Lấy vị trí GPS"
                          className="rounded-xl bg-white p-2 text-primary shadow-sm transition-all hover:bg-primary hover:text-white disabled:opacity-50"
                        >
                          {locating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormLocationResults([]);
                            setFormLocationQuery('');
                          }}
                          title="Tìm địa chỉ / Plus Code"
                          className="rounded-xl bg-white p-2 text-violet-500 shadow-sm transition-all hover:bg-violet-500 hover:text-white"
                        >
                          <MapPin size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formLocationQuery}
                        onChange={(event) => {
                          setFormLocationQuery(event.target.value);
                          setFormLocationResults([]);
                        }}
                        onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), searchFormLocation())}
                        placeholder="Dán Plus Code hoặc tìm tên địa điểm..."
                        className="flex-1 rounded-2xl border-2 border-violet-100 bg-violet-50 px-4 py-3 text-sm outline-none transition-all focus:border-violet-400"
                      />
                      <button
                        type="button"
                        onClick={searchFormLocation}
                        disabled={formLocationSearching || !formLocationQuery.trim()}
                        className="rounded-2xl bg-violet-500 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-violet-600 disabled:opacity-40"
                      >
                        {formLocationSearching ? <Loader2 size={14} className="animate-spin" /> : 'Tìm'}
                      </button>
                    </div>

                    {formLocationResults.length > 0 && (
                      <div className="space-y-2">
                        {formLocationResults.map((result, index) => (
                          <button
                            key={`${result.lat}-${result.lon}-${index}`}
                            type="button"
                            onClick={() => applyFormLocation(result)}
                            className="w-full rounded-2xl bg-violet-50 px-4 py-3 text-left text-sm leading-6 text-slate-700 transition-all hover:bg-violet-500 hover:text-white"
                          >
                            📍 {result.display_name}
                          </button>
                        ))}
                      </div>
                    )}

                    {formData.location.coordinates[0] !== 0 && (
                      <p className="px-1 text-[11px] font-bold text-emerald-600">
                        Có tọa độ: {formData.location.coordinates[1].toFixed(5)}, {formData.location.coordinates[0].toFixed(5)}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Trạng thái hiện tại</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {PLACE_STATUS_ORDER.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setFormData({ ...formData, status })}
                          className={`rounded-[1.4rem] border p-4 text-left transition-all ${
                            formData.status === status
                              ? `${STATUS_META[status].chipClassName} border-transparent`
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                          }`}
                        >
                          <span className="block text-sm font-black">{STATUS_META[status].label}</span>
                          <span className="mt-1 block text-xs leading-5 opacity-80">{STATUS_META[status].description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <select
                      className="w-full rounded-2xl border-2 border-transparent bg-slate-50 px-4 py-4 text-sm outline-none transition-all focus:border-primary"
                      value={formData.category}
                      onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.emoji} {category.value}
                        </option>
                      ))}
                    </select>

                    {formData.status === 'visited' ? (
                      <div className="flex items-center justify-center gap-1 rounded-2xl bg-slate-50 py-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormData({ ...formData, rating: star })}
                            className="transition-transform hover:scale-125 active:scale-95"
                          >
                            <Star size={26} className={star <= formData.rating ? 'text-yellow-400' : 'text-gray-200'} fill={star <= formData.rating ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-400">
                        Rating sẽ mở khi địa điểm chuyển sang `Đã đi`.
                      </div>
                    )}
                  </div>

                  <textarea
                    rows={3}
                    value={formData.note}
                    onChange={(event) => setFormData({ ...formData, note: event.target.value })}
                    className="w-full rounded-2xl border-2 border-transparent bg-slate-50 px-4 py-4 text-sm outline-none transition-all focus:border-primary"
                    placeholder={
                      formData.status === 'visited'
                        ? 'Điều còn nhớ lại sau buổi hẹn, món ngon, cảm giác, hoặc một chi tiết nhỏ...'
                        : formData.status === 'next_time'
                          ? 'Vì sao nơi này đáng thử ở lần tới?'
                          : 'Điểm gì khiến hai bạn muốn lưu địa điểm này lại?'
                    }
                  />

                  <button
                    type="submit"
                    disabled={uploading || locating}
                    className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-pink-200/70 disabled:opacity-50"
                  >
                    {uploading ? 'Đang lưu...' : isEditing ? 'Cập nhật địa điểm' : 'Lưu địa điểm'}
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
