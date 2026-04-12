import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Gift, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';
import EmptyState from '../components/EmptyState';
import RolePill from '../components/RolePill';
import SheetDialog from '../components/SheetDialog';
import type { AppRole } from '../constants/appRoles';
import { ROLE_NAME, getOtherRole } from '../constants/appRoles';
import { useAuth } from '../context/AuthContext';

type WishCategory = 'item' | 'place' | 'food' | 'experience';

interface IWish {
  _id: string;
  itemName: string;
  link?: string;
  price: number;
  category: WishCategory;
  owner: AppRole;
  isSecretlyPrepared: boolean;
  status: 'waiting' | 'done';
  note?: string;
  createdAt?: string;
}

type FilterRole = 'all' | AppRole;

const CATEGORY_LABEL: Record<WishCategory, string> = {
  item: 'Đồ vật',
  place: 'Địa điểm',
  food: 'Món ăn',
  experience: 'Trải nghiệm',
};

const CATEGORY_EMOJI: Record<WishCategory, string> = {
  item: '🎁',
  place: '📍',
  food: '🍜',
  experience: '✨',
};

const WishlistV2: React.FC = () => {
  const { role } = useAuth();
  const currentRole = role as AppRole;
  const otherRole = getOtherRole(currentRole);

  const [wishes, setWishes] = useState<IWish[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<FilterRole>('all');
  const [showDone, setShowDone] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editWish, setEditWish] = useState<IWish | null>(null);
  const [detailWish, setDetailWish] = useState<IWish | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    itemName: '',
    link: '',
    price: 0,
    priceDisplay: '',
    category: 'item' as WishCategory,
    owner: currentRole as AppRole,
    isSecretlyPrepared: false,
    note: '',
  };
  const [form, setForm] = useState(emptyForm);

  const fetchWishes = useCallback(async () => {
    try {
      const res = await api.get('/wishlist-v2');
      // Girlfriend không thấy mục "lén chuẩn bị" của boyfriend
      const raw: IWish[] = res.data.data ?? [];
      setWishes(currentRole === 'girlfriend' ? raw.filter(w => !w.isSecretlyPrepared) : raw);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [currentRole]);

  useEffect(() => { void fetchWishes(); }, [fetchWishes]);

  const display = useMemo(() => {
    let list = wishes;
    if (filterRole !== 'all') list = list.filter(w => w.owner === filterRole);
    if (!showDone) list = list.filter(w => w.status !== 'done');
    return list;
  }, [wishes, filterRole, showDone]);

  const doneCount = useMemo(() => wishes.filter(w => w.status === 'done').length, [wishes]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditWish(null);
    setShowCreate(true);
  };

  const openEdit = (w: IWish) => {
    setForm({
      itemName: w.itemName,
      link: w.link ?? '',
      price: w.price,
      priceDisplay: w.price > 0 ? w.price.toLocaleString('vi-VN') : '',
      category: w.category,
      owner: w.owner,
      isSecretlyPrepared: w.isSecretlyPrepared,
      note: w.note ?? '',
    });
    setEditWish(w);
    setShowCreate(true);
  };

  const handlePriceChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const num = parseInt(digits) || 0;
    setForm(f => ({ ...f, price: num, priceDisplay: num > 0 ? num.toLocaleString('vi-VN') : '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      itemName: form.itemName,
      link: form.link,
      price: form.price,
      category: form.category,
      owner: form.owner,
      isSecretlyPrepared: currentRole === 'boyfriend' ? form.isSecretlyPrepared : false,
      note: form.note,
    };
    try {
      if (editWish) {
        await api.put(`/wishlist-v2/${editWish._id}`, payload);
      } else {
        await api.post('/wishlist-v2', payload);
      }
      setShowCreate(false);
      setEditWish(null);
      await fetchWishes();
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (w: IWish) => {
    await api.put(`/wishlist-v2/${w._id}`, { status: w.status === 'done' ? 'waiting' : 'done' });
    await fetchWishes();
  };

  const handleDelete = async (w: IWish) => {
    await api.delete(`/wishlist-v2/${w._id}`);
    setDetailWish(null);
    await fetchWishes();
  };

  const filterBtns: { key: FilterRole; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'girlfriend', label: ROLE_NAME.girlfriend },
    { key: 'boyfriend', label: ROLE_NAME.boyfriend },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="min-w-0 flex-1">
          <p className="section-label">Mong muốn</p>
          <h1 className="page-title">Danh sách ước</h1>
          <p className="page-subtitle">Những điều Ni và Được muốn — nhỏ hay lớn đều được ghi lại.</p>
        </div>
        <button onClick={openCreate} className="btn-primary shrink-0 flex items-center gap-1.5">
          <Plus size={16} /> Thêm
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {filterBtns.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterRole(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                filterRole === key
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-rose-50 text-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {doneCount > 0 && (
          <button
            onClick={() => setShowDone(s => !s)}
            className={`text-xs font-bold transition-all ${showDone ? 'text-primary' : 'text-soft'}`}
          >
            {showDone ? `Ẩn đã xong (${doneCount})` : `Xem đã xong (${doneCount})`}
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : display.length === 0 ? (
        <EmptyState
          icon={<Gift size={22} />}
          eyebrow={filterRole === 'all' ? 'Tất cả' : ROLE_NAME[filterRole as AppRole]}
          title="Chưa có gì ở đây"
          description={
            filterRole === 'all'
              ? 'Thêm một điều bạn muốn — món đồ, địa điểm, trải nghiệm, hay bất cứ điều gì.'
              : `${ROLE_NAME[filterRole as AppRole]} chưa có mong muốn nào được ghi lại.`
          }
          action={
            <button onClick={openCreate} className="btn-primary">
              Thêm mong muốn đầu tiên
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {display.map(wish => (
            <motion.button
              key={wish._id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setDetailWish(wish)}
              className={`surface-card w-full text-left transition-shadow hover:shadow-md ${wish.status === 'done' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); void toggleDone(wish); }}
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                    wish.status === 'done'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-rose-50 text-primary hover:scale-110 active:scale-95'
                  }`}
                >
                  {wish.status === 'done'
                    ? <CheckCircle2 size={18} />
                    : <span className="text-lg">{CATEGORY_EMOJI[wish.category ?? 'item']}</span>}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`truncate font-bold text-ink ${wish.status === 'done' ? 'line-through' : ''}`}>
                      {wish.itemName}
                    </h3>
                    {wish.link && (
                      <a
                        href={wish.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="shrink-0 text-soft transition hover:text-primary"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  {wish.note ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-soft">{wish.note}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <RolePill role={wish.owner} variant="subtle" />
                    <span className="text-[10px] text-soft">{CATEGORY_LABEL[wish.category ?? 'item']}</span>
                    {wish.price > 0 && (
                      <span className="text-[10px] font-bold text-primary">{wish.price.toLocaleString('vi-VN')}đ</span>
                    )}
                    {wish.isSecretlyPrepared && (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-500">Lén chuẩn bị</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <SheetDialog
        open={!!detailWish}
        title={detailWish?.itemName ?? ''}
        subtitle={detailWish?.note || undefined}
        onClose={() => setDetailWish(null)}
        headerSlot={detailWish ? <RolePill role={detailWish.owner} variant="soft" /> : undefined}
        footer={
          <div className="flex gap-2">
            <button
              onClick={() => { if (detailWish) { setDetailWish(null); openEdit(detailWish); } }}
              className="btn-secondary flex-1 flex items-center justify-center gap-1.5"
            >
              <Pencil size={14} /> Sửa
            </button>
            <button
              onClick={() => { if (detailWish) void toggleDone(detailWish); setDetailWish(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 ${detailWish?.status === 'done' ? 'btn-secondary' : 'btn-primary'}`}
            >
              <CheckCircle2 size={14} />
              {detailWish?.status === 'done' ? 'Đánh dấu chưa xong' : 'Đánh dấu xong'}
            </button>
            <button
              onClick={() => { if (detailWish) void handleDelete(detailWish); }}
              className="flex items-center justify-center rounded-xl p-2.5 text-soft transition hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        }
      >
        {detailWish ? (
          <div className="space-y-3 text-sm text-soft">
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span>Chủ sở hữu:</span>
                <RolePill role={detailWish.owner} variant="soft" />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-500">
                {CATEGORY_EMOJI[detailWish.category ?? 'item']} {CATEGORY_LABEL[detailWish.category ?? 'item']}
              </span>
            </div>
            {detailWish.price > 0 && (
              <p className="font-bold text-primary text-base">{detailWish.price.toLocaleString('vi-VN')}đ</p>
            )}
            {detailWish.link && (
              <a href={detailWish.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary underline">
                <ExternalLink size={12} /> Xem link tham khảo
              </a>
            )}
          </div>
        ) : null}
      </SheetDialog>

      {/* Create / Edit Sheet */}
      <SheetDialog
        open={showCreate}
        title={editWish ? 'Cập nhật mong muốn' : 'Thêm mong muốn mới'}
        onClose={() => { setShowCreate(false); setEditWish(null); }}
        footer={
          <button
            form="wish-form"
            type="submit"
            disabled={saving || !form.itemName.trim()}
            className="btn-primary w-full py-4 text-base font-bold disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : editWish ? 'Lưu thay đổi' : 'Thêm vào danh sách'}
          </button>
        }
      >
        <form id="wish-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Owner */}
          <div>
            <p className="mb-2 text-xs font-bold text-soft">Mong muốn của ai</p>
            <div className="flex gap-2">
              {(['girlfriend', 'boyfriend'] as AppRole[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, owner: r }))}
                  className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition-all ${
                    form.owner === r ? 'border-primary bg-rose-50 text-primary' : 'border-rose-100 bg-white text-soft'
                  }`}
                >
                  {ROLE_NAME[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="mb-2 text-xs font-bold text-soft">Loại</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(CATEGORY_LABEL) as WishCategory[]).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat }))}
                  className={`rounded-xl border py-2 text-center text-xs font-bold transition-all ${
                    form.category === cat ? 'border-primary bg-rose-50 text-primary' : 'border-rose-100 bg-white text-soft'
                  }`}
                >
                  <div className="text-base">{CATEGORY_EMOJI[cat]}</div>
                  <div>{CATEGORY_LABEL[cat]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <p className="mb-1 text-xs font-bold text-soft">Tên</p>
            <input
              required
              value={form.itemName}
              onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))}
              placeholder="Ghi rõ muốn gì..."
              className="input-field w-full"
            />
          </div>

          {/* Note */}
          <div>
            <p className="mb-1 text-xs font-bold text-soft">Ghi chú</p>
            <textarea
              rows={2}
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Thêm chi tiết nếu muốn..."
              className="input-field w-full resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Price */}
            <div>
              <p className="mb-1 text-xs font-bold text-soft">Giá dự kiến</p>
              <input
                type="text"
                inputMode="numeric"
                value={form.priceDisplay}
                onChange={e => handlePriceChange(e.target.value)}
                placeholder="0đ"
                className="input-field w-full"
              />
            </div>

            {/* Link */}
            <div>
              <p className="mb-1 text-xs font-bold text-soft">Link tham khảo</p>
              <input
                type="url"
                value={form.link}
                onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                placeholder="https://..."
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Secret (boyfriend only) */}
          {currentRole === 'boyfriend' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isSecretlyPrepared}
                onChange={e => setForm(f => ({ ...f, isSecretlyPrepared: e.target.checked }))}
                className="h-4 w-4 rounded text-primary"
              />
              <span className="text-xs font-bold text-soft">Đang lén chuẩn bị cho {ROLE_NAME[otherRole]}</span>
            </label>
          )}
        </form>
      </SheetDialog>
    </div>
  );
};

export default WishlistV2;
