import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/api';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Circle, ExternalLink, Gift, Loader2, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
import PersonBadge from '../components/PersonBadge';
import { ROLE_NAME, isRole, type Role } from '../constants/roles';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

type WishStatus = 'Đang đợi' | 'Đã mua' | 'Đã đi';

interface IWish {
  _id: string;
  itemName: string;
  link: string;
  price: number;
  isSecretlyPrepared: boolean;
  status: WishStatus;
  note: string;
  createdBy?: Role;
  owner?: Role;
}

type WishFormState = {
  itemName: string;
  link: string;
  price: number;
  owner: Role;
  isSecretlyPrepared: boolean;
  status: WishStatus;
  note: string;
};

const STATUS_META: Record<WishStatus, { label: string; tone: string }> = {
  'Đang đợi': {
    label: 'Đang đợi',
    tone: 'bg-slate-100 text-slate-600 ring-slate-200',
  },
  'Đã mua': {
    label: 'Đã mua',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  'Đã đi': {
    label: 'Đã đi',
    tone: 'bg-sky-50 text-sky-700 ring-sky-200',
  },
};

const SECTION_META: Record<
  'girlfriend' | 'boyfriend' | 'preparing',
  {
    title: string;
    description: string;
    emptyTitle: string;
    emptyBody: string;
    accent: string;
  }
> = {
  girlfriend: {
    title: 'Ni muốn',
    description: 'Những điều Ni đang muốn, từ món quà nhỏ đến trải nghiệm muốn thử cùng nhau.',
    emptyTitle: 'Chưa có điều nào được giữ cho Ni',
    emptyBody: 'Khi Ni nhắc đến một món, một nơi, hay một trải nghiệm muốn thử, lưu vào đây để không trôi mất.',
    accent: 'bg-pink-50 text-pink-700 ring-pink-200',
  },
  boyfriend: {
    title: 'Được muốn',
    description: 'Những điều Được đang nhắc tới hoặc thật sự muốn làm, muốn có, muốn đi.',
    emptyTitle: 'Chưa có điều nào được giữ cho Được',
    emptyBody: 'Khi Được nhắc đến một mong muốn mới, lưu vào đây để lần sau nhìn là nhớ ngay.',
    accent: 'bg-sky-50 text-sky-700 ring-sky-200',
  },
  preparing: {
    title: 'Đang chuẩn bị',
    description: 'Những món bạn đang âm thầm chuẩn bị cho người kia, tách riêng để nhịp quan tâm không bị lẫn.',
    emptyTitle: 'Chưa có món nào bạn đang chuẩn bị bí mật',
    emptyBody: 'Khi thấy một điều của người kia đáng làm ngay, đánh dấu chuẩn bị để giữ nhịp này cho riêng bạn.',
    accent: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
};

const createInitialForm = (role: Role, owner: Role = role): WishFormState => ({
  itemName: '',
  link: '',
  price: 0,
  owner,
  isSecretlyPrepared: false,
  status: 'Đang đợi',
  note: '',
});

const resolveWishOwner = (wish: IWish): Role | null => {
  if (isRole(wish.owner)) {
    return wish.owner;
  }

  if (isRole(wish.createdBy)) {
    return wish.createdBy;
  }

  return null;
};

const Wishlist: React.FC = () => {
  const [wishes, setWishes] = useState<IWish[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const { toast, confirm } = useUI();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<WishFormState>(createInitialForm(role));
  const [priceDisplay, setPriceDisplay] = useState('');

  const oppositeRole: Role = role === 'boyfriend' ? 'girlfriend' : 'boyfriend';

  const sections = {
    girlfriend: wishes.filter((wish) => resolveWishOwner(wish) === 'girlfriend'),
    boyfriend: wishes.filter((wish) => resolveWishOwner(wish) === 'boyfriend'),
    preparing: wishes.filter((wish) => wish.isSecretlyPrepared),
  };

  const formatPrice = (num: number) => (num > 0 ? num.toLocaleString('vi-VN') : '');

  const handlePriceChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const num = parseInt(digits, 10) || 0;
    setFormData((current) => ({ ...current, price: num }));
    setPriceDisplay(formatPrice(num));
  };

  const resetForm = useCallback((owner: Role = role) => {
    setFormData(createInitialForm(role, owner));
    setPriceDisplay('');
    setIsEditing(false);
    setEditingId(null);
  }, [role]);

  const openCreateModal = (owner: Role = role, secretlyPrepared = false) => {
    resetForm(owner);
    setFormData((current) => ({
      ...current,
      owner,
      isSecretlyPrepared: secretlyPrepared && owner !== role,
    }));
    setShowModal(true);
  };

  const fetchWishes = useCallback(async () => {
    try {
      const res = await api.get('/wishlist');
      setWishes(res.data.data ?? []);
    } catch {
      console.error('Lỗi khi tải wishlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishes();
    resetForm(role);
  }, [fetchWishes, resetForm, role]);

  const handleEdit = (wish: IWish) => {
    const owner = resolveWishOwner(wish) ?? role;
    setFormData({
      itemName: wish.itemName,
      link: wish.link || '',
      price: wish.price || 0,
      owner,
      isSecretlyPrepared: Boolean(wish.isSecretlyPrepared) && owner !== role,
      status: wish.status || 'Đang đợi',
      note: wish.note || '',
    });
    setPriceDisplay(formatPrice(wish.price || 0));
    setEditingId(wish._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      isSecretlyPrepared: formData.owner === role ? false : formData.isSecretlyPrepared,
    };

    try {
      if (isEditing && editingId) {
        await api.put(`/wishlist/${editingId}`, payload);
      } else {
        await api.post('/wishlist', payload);
      }
      setShowModal(false);
      resetForm(role);
      await fetchWishes();
    } catch {
      toast('Lỗi khi lưu mong muốn!', 'error');
    }
  };

  const deleteWish = async (id: string) => {
    if (!await confirm('Xóa mục này nhé?')) return;
    try {
      await api.delete(`/wishlist/${id}`);
      await fetchWishes();
    } catch {
      toast('Không xóa được rồi!', 'error');
    }
  };

  const toggleStatus = async (wish: IWish) => {
    try {
      const newStatus: WishStatus = wish.status === 'Đang đợi' ? 'Đã mua' : 'Đang đợi';
      await api.put(`/wishlist/${wish._id}`, { status: newStatus });
      await fetchWishes();
    } catch {
      toast('Không cập nhật trạng thái được!', 'error');
    }
  };

  const togglePreparing = async (wish: IWish) => {
    const owner = resolveWishOwner(wish);
    if (!owner || owner === role) {
      toast('Chỉ có thể chuẩn bị bí mật cho mong muốn của người kia.', 'warning');
      return;
    }

    try {
      await api.put(`/wishlist/${wish._id}`, {
        owner,
        isSecretlyPrepared: !wish.isSecretlyPrepared,
      });
      await fetchWishes();
    } catch {
      toast('Không đổi được trạng thái chuẩn bị!', 'error');
    }
  };

  const changeOwner = (owner: Role) => {
    setFormData((current) => ({
      ...current,
      owner,
      isSecretlyPrepared: owner === role ? false : current.isSecretlyPrepared,
    }));
  };

  const renderWishCard = (wish: IWish) => {
    const owner = resolveWishOwner(wish);
    const isPreparedForCurrentViewer = wish.isSecretlyPrepared;
    const ownerBadge = owner ? <PersonBadge role={owner} prefix="Mong muốn của" /> : null;
    const createdByBadge = isRole(wish.createdBy) ? <PersonBadge role={wish.createdBy} prefix="Ghi lại bởi" /> : null;

    return (
      <motion.article
        key={wish._id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg md:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => toggleStatus(wish)}
            className={`rounded-[1.25rem] p-3 transition-all ${
              wish.status === 'Đang đợi'
                ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
          >
            {wish.status === 'Đang đợi' ? <Circle size={22} /> : <CheckCircle2 size={22} />}
          </button>

          <div className="flex gap-2">
            <button type="button" onClick={() => handleEdit(wish)} className="rounded-xl bg-slate-100 p-2 text-slate-500 transition-all hover:text-primary">
              <Pencil size={15} />
            </button>
            <button type="button" onClick={() => deleteWish(wish._id)} className="rounded-xl bg-slate-100 p-2 text-slate-500 transition-all hover:text-red-500">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ownerBadge}
          {createdByBadge && wish.createdBy !== owner ? createdByBadge : null}
          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${STATUS_META[wish.status].tone}`}>
            {STATUS_META[wish.status].label}
          </span>
          {isPreparedForCurrentViewer && (
            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
              Bạn đang chuẩn bị
            </span>
          )}
        </div>

        <h3 className="mt-4 text-2xl font-black text-slate-900">{wish.itemName}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {wish.note || 'Chưa có ghi chú thêm, nhưng item này đã được giữ lại để không bị quên.'}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Giá dự kiến</p>
            <p className="mt-1 text-lg font-black text-primary">{wish.price > 0 ? `${wish.price.toLocaleString('vi-VN')}đ` : 'Chưa đặt giá'}</p>
          </div>

          <div className="flex items-center gap-2">
            {wish.link && (
              <a
                href={wish.link}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-slate-100 p-2 text-slate-500 transition-all hover:text-primary"
              >
                <ExternalLink size={18} />
              </a>
            )}
            {owner && owner !== role && (
              <button
                type="button"
                onClick={() => togglePreparing(wish)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  wish.isSecretlyPrepared
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                {wish.isSecretlyPrepared ? 'Đang chuẩn bị' : 'Chuẩn bị bí mật'}
              </button>
            )}
          </div>
        </div>
      </motion.article>
    );
  };

  const renderEmptyState = (section: 'girlfriend' | 'boyfriend' | 'preparing') => {
    const meta = SECTION_META[section];
    const ctaAction = section === 'preparing'
      ? () => openCreateModal(oppositeRole, true)
      : () => openCreateModal(section === 'girlfriend' ? 'girlfriend' : 'boyfriend');

    const ctaLabel = section === 'preparing'
      ? `Thêm món cho ${ROLE_NAME[oppositeRole]}`
      : `Thêm cho ${meta.title}`;

    return (
      <div className="rounded-[1.8rem] border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {section === 'preparing' ? <Sparkles size={22} /> : <Gift size={22} />}
        </div>
        <h3 className="mt-4 text-xl font-black text-slate-900">{meta.emptyTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{meta.emptyBody}</p>
        <button
          type="button"
          onClick={ctaAction}
          className="mt-5 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-pink-200/70 transition-all hover:-translate-y-0.5"
        >
          {ctaLabel}
        </button>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 pb-24 md:px-4 md:py-8 md:pb-8">
      <section className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-rose-50 to-amber-50 p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#b292a6]">Wishlist</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">Ai muốn gì, và mình đang chuẩn bị gì cho nhau?</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-[15px]">
              Wishlist bây giờ tách rõ mong muốn của Ni, mong muốn của Được, và phần bạn đang âm thầm chuẩn bị để mọi thứ không còn lẫn thành một list chung.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <PersonBadge role={role} prefix="Đang xem với vai" />
              <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${SECTION_META.girlfriend.accent}`}>
                Ni muốn: {sections.girlfriend.length}
              </span>
              <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${SECTION_META.boyfriend.accent}`}>
                Được muốn: {sections.boyfriend.length}
              </span>
              <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${SECTION_META.preparing.accent}`}>
                Đang chuẩn bị: {sections.preparing.length}
              </span>
            </div>
          </div>

          <div className="flex w-full gap-2 md:w-auto">
            <button
              type="button"
              onClick={() => openCreateModal(role)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-pink-200/70 transition-all hover:-translate-y-0.5 md:flex-none"
            >
              <Plus size={18} />
              Thêm mong muốn
            </button>
            <button
              type="button"
              onClick={() => openCreateModal(oppositeRole, true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 md:flex-none"
            >
              <Sparkles size={18} />
              Chuẩn bị bí mật
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {([
            ['girlfriend', sections.girlfriend],
            ['boyfriend', sections.boyfriend],
            ['preparing', sections.preparing],
          ] as const).map(([sectionKey, items]) => {
            const meta = SECTION_META[sectionKey];

            return (
              <section key={sectionKey} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${meta.accent}`}>
                        {meta.title}
                      </span>
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                        {items.length} mục
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{meta.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreateModal(sectionKey === 'preparing' ? oppositeRole : sectionKey, sectionKey === 'preparing')}
                    className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200"
                  >
                    {sectionKey === 'preparing' ? `Thêm món cho ${ROLE_NAME[oppositeRole]}` : `Thêm vào ${meta.title}`}
                  </button>
                </div>

                <div className="mt-5">
                  {items.length === 0 ? (
                    renderEmptyState(sectionKey)
                  ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {items.map(renderWishCard)}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowModal(false);
                resetForm(role);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
              className="relative w-full max-w-lg rounded-[2.2rem] bg-white p-6 shadow-2xl md:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b292a6]">Wishlist</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">
                    {isEditing ? 'Cập nhật mong muốn' : 'Thêm mong muốn mới'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Chọn rõ item này thuộc về ai. `createdBy` vẫn là người ghi lại, còn `owner` là người thật sự muốn món đó.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm(role);
                  }}
                  className="rounded-full p-2 text-slate-400 transition-all hover:text-slate-700"
                >
                  <X />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <PersonBadge role={role} prefix={isEditing ? 'Bạn đang chỉnh với vai' : 'Bạn đang ghi với vai'} />
                  <p className="text-xs leading-5 text-slate-400">
                    Nếu bạn đang ghi lại mong muốn giúp người kia, hãy chọn owner đúng ở phần bên dưới thay vì để app tự đoán.
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Mong muốn này thuộc về ai</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['girlfriend', 'boyfriend'] as const).map((ownerOption) => (
                      <button
                        key={ownerOption}
                        type="button"
                        onClick={() => changeOwner(ownerOption)}
                        className={`rounded-[1.4rem] border p-4 text-left transition-all ${
                          formData.owner === ownerOption
                            ? ownerOption === 'girlfriend'
                              ? 'border-transparent bg-pink-50 text-pink-700 ring-1 ring-pink-200'
                              : 'border-transparent bg-sky-50 text-sky-700 ring-1 ring-sky-200'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                      >
                        <span className="block text-sm font-black">{ROLE_NAME[ownerOption]}</span>
                        <span className="mt-1 block text-xs leading-5 opacity-80">
                          {ownerOption === role ? 'Đây là điều bạn thật sự muốn.' : `Đây là điều ${ROLE_NAME[ownerOption]} đang muốn.`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  required
                  value={formData.itemName}
                  onChange={(event) => setFormData((current) => ({ ...current, itemName: event.target.value }))}
                  className="w-full rounded-2xl border-2 border-transparent bg-slate-50 px-4 py-4 text-sm outline-none transition-all focus:border-primary"
                  placeholder="Món quà, trải nghiệm, chỗ muốn đi, điều muốn làm..."
                />

                <textarea
                  rows={3}
                  value={formData.note}
                  onChange={(event) => setFormData((current) => ({ ...current, note: event.target.value }))}
                  className="w-full rounded-2xl border-2 border-transparent bg-slate-50 px-4 py-4 text-sm outline-none transition-all focus:border-primary"
                  placeholder="Ghi ngắn điều gì khiến item này đáng nhớ hoặc đáng làm trước."
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    value={formData.link}
                    onChange={(event) => setFormData((current) => ({ ...current, link: event.target.value }))}
                    className="w-full rounded-2xl border-2 border-transparent bg-slate-50 px-4 py-4 text-sm outline-none transition-all focus:border-primary"
                    placeholder="Link tham khảo nếu có"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={priceDisplay}
                    onChange={(event) => handlePriceChange(event.target.value)}
                    onFocus={() => {
                      if (formData.price === 0) setPriceDisplay('');
                    }}
                    className="w-full rounded-2xl border-2 border-transparent bg-slate-50 px-4 py-4 text-sm outline-none transition-all focus:border-primary"
                    placeholder="Giá dự kiến"
                  />
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Trạng thái</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(STATUS_META) as WishStatus[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData((current) => ({ ...current, status }))}
                        className={`rounded-2xl px-3 py-3 text-xs font-bold transition-all ${
                          formData.status === status
                            ? `${STATUS_META[status].tone} ring-1`
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.owner !== role && (
                  <label className="flex items-start gap-3 rounded-[1.4rem] bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded"
                      checked={formData.isSecretlyPrepared}
                      onChange={(event) => setFormData((current) => ({ ...current, isSecretlyPrepared: event.target.checked }))}
                    />
                    <span>
                      <span className="block font-bold">Đang chuẩn bị bí mật cho {ROLE_NAME[formData.owner]}</span>
                      <span className="mt-1 block text-xs leading-5">
                        Nếu bật mục này, người kia vẫn thấy item trong wishlist của họ nhưng sẽ không thấy trạng thái bạn đang chuẩn bị.
                      </span>
                    </span>
                  </label>
                )}

                <button type="submit" className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-pink-200/70">
                  {isEditing ? 'Cập nhật wishlist' : 'Lưu vào wishlist'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wishlist;
