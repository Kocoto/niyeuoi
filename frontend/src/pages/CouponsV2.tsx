import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Sparkles, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';
import EmptyState from '../components/EmptyState';
import RolePill from '../components/RolePill';
import SheetDialog from '../components/SheetDialog';
import type { AppRole } from '../constants/appRoles';
import { ROLE_NAME, getOtherRole } from '../constants/appRoles';
import { useAuth } from '../context/AuthContext';

type VoucherType = 'personal' | 'grab' | 'shared';

interface ICoupon {
  _id: string;
  title: string;
  description: string;
  voucherType: VoucherType;
  createdBy: AppRole;
  recipientRole?: AppRole;
  ownedBy?: AppRole;
  isUsed: boolean;
  isAiGenerated?: boolean;
  expiresAt?: string;
  createdAt?: string;
}

type TabKey = 'waiting' | 'mine' | 'given' | 'used';

const TAB_LABELS: Record<TabKey, string> = {
  waiting: 'Chờ nhận',
  mine: 'Đã có',
  given: 'Đã tặng',
  used: 'Đã dùng',
};

const TYPE_LABEL: Record<VoucherType, string> = {
  personal: 'Đích danh',
  grab: 'Nhanh tay',
  shared: 'Dùng chung',
};

const TYPE_HINT: Record<VoucherType, string> = {
  personal: 'Tặng riêng cho một người, chỉ người đó dùng được.',
  grab: 'Ai vào trước người đó nhận được. Vui, nhẹ, nhanh.',
  shared: 'Cả hai cùng hưởng. Không thuộc riêng ai.',
};

const TYPE_COLOR: Record<VoucherType, string> = {
  personal: 'bg-rose-50 text-rose-600 border-rose-100',
  grab: 'bg-amber-50 text-amber-600 border-amber-100',
  shared: 'bg-teal-50 text-teal-600 border-teal-100',
};

function formatExpiry(expiresAt?: string) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Đã hết hạn';
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `Còn ${days} ngày`;
  const hours = Math.floor(diff / 3600000);
  return `Còn ${hours} giờ`;
}

const CouponsV2: React.FC = () => {
  const { role } = useAuth();
  const currentRole = role as AppRole;
  const otherRole = getOtherRole(currentRole);

  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('waiting');

  const [detailCoupon, setDetailCoupon] = useState<ICoupon | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<VoucherType>('personal');
  const [createRecipient, setCreateRecipient] = useState<AppRole>(otherRole);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await api.get('/coupons-v2');
      setCoupons(res.data.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchCoupons(); }, [fetchCoupons]);

  const tabs = useMemo<Record<TabKey, ICoupon[]>>(() => {
    const waiting = coupons.filter(c => {
      if (c.isUsed) return false;
      if (c.voucherType === 'grab' && !c.ownedBy) return true;
      return false;
    });
    const mine = coupons.filter(c => {
      if (c.isUsed) return false;
      if (c.ownedBy === currentRole) return true;
      if (c.voucherType === 'shared' && !c.isUsed) return true;
      return false;
    });
    const given = coupons.filter(c => !c.isUsed && c.createdBy === currentRole && c.voucherType === 'personal');
    const used = coupons.filter(c => c.isUsed);
    return { waiting, mine, given, used };
  }, [coupons, currentRole]);

  const badgeCount: Partial<Record<TabKey, number>> = {
    waiting: tabs.waiting.length,
    mine: tabs.mine.length,
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/coupons-v2', {
        title: formTitle,
        description: formDesc,
        voucherType: createType,
        createdBy: currentRole,
        recipientRole: createType === 'personal' ? createRecipient : undefined,
      });
      setShowCreate(false);
      setFormTitle('');
      setFormDesc('');
      setCreateType('personal');
      setCreateRecipient(otherRole);
      await fetchCoupons();
    } finally {
      setSaving(false);
    }
  };

  const handleClaim = async (id: string) => {
    try {
      await api.post(`/coupons-v2/${id}/claim`, { claimerRole: currentRole });
      await fetchCoupons();
      setDetailCoupon(null);
    } catch {
      // silent
    }
  };

  const handleUse = async (id: string) => {
    try {
      await api.post(`/coupons-v2/${id}/use`);
      await fetchCoupons();
      setDetailCoupon(null);
    } catch {
      // silent
    }
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      await api.post('/coupons-v2/generate');
      await fetchCoupons();
    } finally {
      setAiLoading(false);
    }
  };

  const displayList = tabs[activeTab];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="min-w-0 flex-1">
          <p className="section-label">Đặc quyền</p>
          <h1 className="page-title">Vé yêu thương</h1>
          <p className="page-subtitle">Ba loại vé, mỗi loại một cách chơi.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleAiGenerate}
            disabled={aiLoading}
            className="btn-secondary"
          >
            {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI sinh
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-1.5">
            <Plus size={16} /> Tạo vé
          </button>
        </div>
      </div>

      {/* Legend types */}
      <div className="mb-5 flex flex-wrap gap-2">
        {(Object.keys(TYPE_LABEL) as VoucherType[]).map(t => (
          <span key={t} className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${TYPE_COLOR[t]}`}>
            {TYPE_LABEL[t]}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex rounded-2xl bg-rose-50/60 p-1 gap-1">
        {(Object.keys(TAB_LABELS) as TabKey[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              activeTab === tab ? 'bg-white text-ink shadow-sm' : 'text-soft'
            }`}
          >
            {TAB_LABELS[tab]}
            {badgeCount[tab] ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-white">
                {badgeCount[tab]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : displayList.length === 0 ? (
        <EmptyState
          icon={<Ticket size={22} />}
          eyebrow={TAB_LABELS[activeTab]}
          title={
            activeTab === 'waiting' ? 'Chưa có vé nhanh tay nào' :
            activeTab === 'mine' ? 'Chưa có vé nào thuộc về bạn' :
            activeTab === 'given' ? 'Bạn chưa tặng vé nào' :
            'Chưa có vé nào được dùng'
          }
          description={
            activeTab === 'waiting' ? 'Khi AI sinh hoặc ai đó tạo vé nhanh tay, chúng sẽ xuất hiện ở đây.' :
            activeTab === 'mine' ? 'Nhận vé nhanh tay hoặc chờ người kia tặng bạn một vé đích danh.' :
            activeTab === 'given' ? 'Tạo một vé đích danh để tặng người kia.' :
            'Vé đã dùng sẽ lưu lại ở đây.'
          }
          action={
            activeTab === 'given' ? (
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                Tạo vé tặng {ROLE_NAME[otherRole]}
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {displayList.map(coupon => (
            <motion.button
              key={coupon._id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setDetailCoupon(coupon)}
              className={`surface-card w-full overflow-hidden text-left transition-shadow hover:shadow-md ${coupon.isUsed ? 'opacity-60 grayscale' : ''}`}
            >
              {/* Ticket stub top */}
              <div className={`flex items-center justify-between border-b border-dashed border-rose-100 px-4 py-2.5 ${coupon.isUsed ? 'bg-gray-50' : 'bg-rose-50/50'}`}>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${TYPE_COLOR[coupon.voucherType ?? 'personal']}`}>
                  {TYPE_LABEL[coupon.voucherType ?? 'personal']}
                </span>
                <div className="flex items-center gap-1.5">
                  {coupon.isAiGenerated && (
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-500">AI</span>
                  )}
                  {coupon.expiresAt && (
                    <span className="text-[10px] font-medium text-soft">{formatExpiry(coupon.expiresAt)}</span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="flex items-start gap-3 p-4">
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${coupon.isUsed ? 'bg-gray-100 text-gray-400' : 'bg-rose-50 text-primary'}`}>
                  <Ticket size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-ink">{coupon.title}</h3>
                  {coupon.description ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-soft">{coupon.description}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {coupon.createdBy && (
                      <span className="text-[10px] text-soft">
                        <RolePill role={coupon.createdBy} variant="subtle" /> tạo
                      </span>
                    )}
                    {coupon.voucherType === 'personal' && coupon.recipientRole && (
                      <span className="text-[10px] text-soft">
                        → <RolePill role={coupon.recipientRole} variant="subtle" />
                      </span>
                    )}
                    {coupon.voucherType === 'grab' && coupon.ownedBy && (
                      <span className="text-[10px] text-soft">
                        · <RolePill role={coupon.ownedBy} variant="subtle" /> đã nhận
                      </span>
                    )}
                    {coupon.voucherType === 'grab' && !coupon.ownedBy && !coupon.isUsed && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">Chưa có chủ</span>
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
        open={!!detailCoupon}
        title={detailCoupon?.title ?? ''}
        subtitle={detailCoupon?.description || undefined}
        onClose={() => setDetailCoupon(null)}
        headerSlot={detailCoupon ? (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${TYPE_COLOR[detailCoupon.voucherType ?? 'personal']}`}>
            {TYPE_LABEL[detailCoupon.voucherType ?? 'personal']}
          </span>
        ) : undefined}
        footer={detailCoupon && !detailCoupon.isUsed ? (
          <div className="flex flex-col gap-3">
            {/* Grab: claim if no owner yet */}
            {detailCoupon.voucherType === 'grab' && !detailCoupon.ownedBy && (
              <button
                onClick={() => handleClaim(detailCoupon._id)}
                className="btn-primary w-full py-4 text-base font-bold"
              >
                Nhận ngay
              </button>
            )}
            {/* Use: if mine or shared */}
            {((detailCoupon.ownedBy === currentRole) || detailCoupon.voucherType === 'shared') && (
              <button
                onClick={() => handleUse(detailCoupon._id)}
                className="btn-primary w-full py-4 text-base font-bold"
              >
                Dùng voucher
              </button>
            )}
          </div>
        ) : detailCoupon?.isUsed ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-green-50 py-3 text-sm font-bold text-green-600">
            Đã sử dụng
          </div>
        ) : undefined}
      >
        {detailCoupon ? (
          <div className="space-y-4 text-sm text-soft">
            <div className="flex flex-wrap gap-2">
              {detailCoupon.createdBy && (
                <div className="flex items-center gap-1.5">
                  <span>Người tạo:</span>
                  <RolePill role={detailCoupon.createdBy} variant="soft" />
                </div>
              )}
              {detailCoupon.voucherType === 'personal' && detailCoupon.recipientRole && (
                <div className="flex items-center gap-1.5">
                  <span>Tặng cho:</span>
                  <RolePill role={detailCoupon.recipientRole} variant="soft" />
                </div>
              )}
              {detailCoupon.voucherType === 'grab' && detailCoupon.ownedBy && (
                <div className="flex items-center gap-1.5">
                  <span>Đang giữ:</span>
                  <RolePill role={detailCoupon.ownedBy} variant="soft" />
                </div>
              )}
            </div>
            <p className="leading-relaxed text-soft">{TYPE_HINT[detailCoupon.voucherType ?? 'personal']}</p>
            {detailCoupon.expiresAt && (
              <p className="text-xs font-medium">
                Hạn: {formatExpiry(detailCoupon.expiresAt)}
              </p>
            )}
          </div>
        ) : null}
      </SheetDialog>

      {/* Create Sheet */}
      <SheetDialog
        open={showCreate}
        title="Tạo vé mới"
        subtitle="Chọn loại trước, rồi điền nội dung."
        onClose={() => setShowCreate(false)}
        footer={
          <button
            form="create-coupon-form"
            type="submit"
            disabled={saving || !formTitle.trim()}
            className="btn-primary w-full py-4 text-base font-bold disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Tạo vé'}
          </button>
        }
      >
        <form id="create-coupon-form" onSubmit={handleCreate} className="space-y-5">
          {/* Type selector */}
          <div>
            <p className="mb-2 text-xs font-bold text-soft">Loại vé</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TYPE_LABEL) as VoucherType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCreateType(t)}
                  className={`rounded-xl border p-3 text-center text-xs font-bold transition-all ${
                    createType === t
                      ? `${TYPE_COLOR[t]} shadow-sm`
                      : 'border-rose-100 bg-white text-soft'
                  }`}
                >
                  <div>{TYPE_LABEL[t]}</div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-soft">{TYPE_HINT[createType]}</p>
          </div>

          {/* Recipient (personal only) */}
          {createType === 'personal' && (
            <div>
              <p className="mb-2 text-xs font-bold text-soft">Tặng cho</p>
              <div className="flex gap-2">
                {(['boyfriend', 'girlfriend'] as AppRole[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCreateRecipient(r)}
                    className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition-all ${
                      createRecipient === r
                        ? 'border-primary bg-rose-50 text-primary'
                        : 'border-rose-100 bg-white text-soft'
                    }`}
                  >
                    {ROLE_NAME[r]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <p className="mb-2 text-xs font-bold text-soft">Tên vé</p>
            <input
              required
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="Ví dụ: Được chọn phim tối nay"
              className="input-field w-full"
            />
          </div>

          {/* Description */}
          <div>
            <p className="mb-2 text-xs font-bold text-soft">Mô tả ngắn (không bắt buộc)</p>
            <textarea
              rows={3}
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              placeholder="Chi tiết hơn về quyền lợi của tấm vé này..."
              className="input-field w-full resize-none"
            />
          </div>
        </form>
      </SheetDialog>
    </div>
  );
};

export default CouponsV2;
