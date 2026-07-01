import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/api';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Sparkles,
  Ticket,
  Trash2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ContextualEmptyState from '../components/ContextualEmptyState';
import PersonBadge from '../components/PersonBadge';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { ROLE_NAME, isRole, type Role } from '../constants/roles';
import type { ICoupon, CouponViewModel, CouponType, CouponBucket } from '../components/coupons/types';
import {
  BUCKET_ORDER,
  BUCKET_META,
  TYPE_META,
  COMPOSER_TYPE_OPTIONS,
  CLAIM_WINDOW_OPTIONS,
  buildCouponView,
  readApiError,
  getOppositeRole,
} from '../components/coupons/couponLogic';
import { InfoPill, renderContextBadges } from '../components/coupons/ContextBadges';

const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detailCoupon, setDetailCoupon] = useState<CouponViewModel | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeBucket, setActiveBucket] = useState<CouponBucket>('owned');
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    couponType: CouponType;
    receiverRole: Role;
    claimWindowHours: number;
  }>({
    title: '',
    description: '',
    couponType: 'personal',
    receiverRole: 'girlfriend',
    claimWindowHours: 72,
  });

  const { role } = useAuth();
  const { toast, confirm } = useUI();
  const oppositeRole = getOppositeRole(role);

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data.data);
    } catch {
      console.error('Lỗi khi tải voucher');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      receiverRole: current.receiverRole === role ? oppositeRole : current.receiverRole,
    }));
  }, [role, oppositeRole]);

  const couponViews = coupons.map((coupon) => buildCouponView(coupon, role));
  const groupedCoupons: Record<CouponBucket, CouponViewModel[]> = {
    waiting: couponViews.filter((coupon) => coupon.bucket === 'waiting'),
    owned: couponViews.filter((coupon) => coupon.bucket === 'owned'),
    given: couponViews.filter((coupon) => coupon.bucket === 'given'),
    used: couponViews.filter((coupon) => coupon.bucket === 'used'),
  };
  const activeCoupons = groupedCoupons[activeBucket];

  const resetComposer = () => {
    setFormData({
      title: '',
      description: '',
      couponType: 'personal',
      receiverRole: oppositeRole,
      claimWindowHours: 72,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Record<string, unknown> = {
      title: formData.title,
      description: formData.description,
      couponType: formData.couponType,
    };

    if (formData.couponType === 'personal') {
      payload.receiverRole = formData.receiverRole;
      payload.holderRole = formData.receiverRole;
    }

    if (formData.couponType === 'shared') {
      payload.receiverRole = 'both';
      payload.holderRole = 'both';
    }

    if (formData.couponType === 'claimable') {
      payload.claimEndsAt = new Date(Date.now() + formData.claimWindowHours * 60 * 60 * 1000).toISOString();
    }

    try {
      await api.post('/coupons', payload);
      setShowModal(false);
      resetComposer();
      setActiveBucket(
        formData.couponType === 'claimable'
          ? 'waiting'
          : formData.couponType === 'shared'
            ? 'owned'
            : formData.receiverRole === role
              ? 'owned'
              : 'given',
      );
      await fetchCoupons();
      toast('Tấm vé mới đã vào đúng nhóm của nó rồi.', 'success');
    } catch (error) {
      toast(readApiError(error, 'Lúc này chưa tạo được voucher, thử lại sau nhé.'), 'error');
    }
  };

  const claimCoupon = async (coupon: CouponViewModel) => {
    const confirmed = await confirm('Nhận tấm vé này về phía bạn nhé?');
    if (!confirmed) return;

    try {
      await api.put(`/coupons/${coupon._id}`, { holderRole: role, receiverRole: role });
      setDetailCoupon(null);
      setActiveBucket('owned');
      await fetchCoupons();
      toast('Tấm vé này giờ đang nằm phía bạn.', 'success');
    } catch (error) {
      toast(readApiError(error, 'Chưa nhận được tấm vé này lúc này.'), 'error');
    }
  };

  const redeemCoupon = async (coupon: CouponViewModel) => {
    const confirmed = await confirm('Bạn muốn đánh dấu tấm vé này là đã dùng chứ?');
    if (!confirmed) return;

    const payload: Record<string, unknown> = { isUsed: true };

    if (coupon.resolvedType === 'shared') {
      payload.holderRole = 'both';
    } else if (coupon.resolvedType === 'claimable') {
      payload.holderRole = role;
      payload.receiverRole = role;
    } else if (coupon.resolvedType === 'personal' && isRole(coupon.resolvedReceiver)) {
      payload.holderRole = coupon.resolvedReceiver;
      payload.receiverRole = coupon.resolvedReceiver;
    }

    try {
      await api.put(`/coupons/${coupon._id}`, payload);
      setDetailCoupon(null);
      setActiveBucket('used');
      await fetchCoupons();
      toast('Tấm vé này đã được khép lại rồi.', 'success');
    } catch (error) {
      toast(readApiError(error, 'Chưa thể cập nhật trạng thái voucher lúc này.'), 'error');
    }
  };

  const handlePrimaryAction = async (coupon: CouponViewModel) => {
    if (coupon.primaryAction === 'claim') {
      await claimCoupon(coupon);
      return;
    }

    if (coupon.primaryAction === 'redeem') {
      await redeemCoupon(coupon);
    }
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      await api.post('/coupons/generate');
      setActiveBucket('owned');
      await fetchCoupons();
      toast('AI vừa mở một tấm vé chung mới.', 'success');
    } catch {
      toast('AI đang bận, thử lại sau nhé.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const deleteCoupon = async (id: string) => {
    const confirmed = await confirm('Thu hồi tấm vé này nhé?');
    if (!confirmed) return;

    try {
      await api.delete(`/coupons/${id}`);
      setDetailCoupon(null);
      await fetchCoupons();
    } catch {
      toast('Chưa xóa được tấm vé này.', 'error');
    }
  };

  const emptyState = (() => {
    if (activeBucket === 'waiting') {
      return groupedCoupons.owned.length > 0
        ? {
            title: 'Chưa có tấm vé nào đang chờ nhận',
            description: 'Những vé nhanh tay hoặc lượt cũ còn treo sẽ hiện ở đây để cả hai nhìn ra ngay đâu là điều còn dang dở.',
            action: {
              label: `Xem những tấm vé đang ở phía ${ROLE_NAME[role]}`,
              onClick: () => setActiveBucket('owned'),
              variant: 'secondary' as const,
            },
          }
        : {
            title: 'Chỗ này đang chờ một lời rủ vui',
            description: 'Mở một vé nhanh tay để ai chạm trước thì giữ, hoặc mở vé chung cho cả hai.',
            action: {
              label: 'Tạo một tấm vé mới',
              onClick: () => setShowModal(true),
            },
          };
    }

    if (activeBucket === 'owned') {
      return {
        title: `Phía ${ROLE_NAME[role]} chưa giữ tấm vé nào`,
        description: 'Khi có một vé đích danh dành cho bạn, một vé chung, hoặc một vé nhanh tay bạn đã nhận, chúng sẽ nằm gọn ở đây.',
        action: groupedCoupons.waiting.length > 0
          ? {
              label: 'Xem chỗ đang chờ nhận',
              onClick: () => setActiveBucket('waiting'),
              variant: 'secondary' as const,
            }
          : {
              label: 'Mở một vé chung mới',
              onClick: () => setShowModal(true),
            },
      };
    }

    if (activeBucket === 'given') {
      return {
        title: `Chưa có tấm vé nào đang ở phía ${ROLE_NAME[oppositeRole]}`,
        description: `Những tấm vé bạn mở cho ${ROLE_NAME[oppositeRole]}, hoặc các tấm vé hiện đang nằm bên kia, sẽ được gom lại ở đây để không lẫn vào phần của bạn.`,
        action: {
          label: `Tạo vé cho ${ROLE_NAME[oppositeRole]}`,
          onClick: () => {
            setFormData((current) => ({ ...current, couponType: 'personal', receiverRole: oppositeRole }));
            setShowModal(true);
          },
        },
      };
    }

    return {
      title: 'Chưa có tấm vé nào được khép lại',
      description: 'Khi một tấm vé đã dùng xong, nó sẽ ở đây để hai người nhìn lại nhịp quan tâm đã trôi qua mà không mất dấu.',
      action: groupedCoupons.owned.length > 0
        ? {
            label: 'Quay lại phần đang có',
            onClick: () => setActiveBucket('owned'),
            variant: 'secondary' as const,
          }
        : undefined,
    };
  })();

  const selectedClaimWindow = CLAIM_WINDOW_OPTIONS.find((option) => option.value === formData.claimWindowHours) ?? CLAIM_WINDOW_OPTIONS[1];
  const composerHint =
    formData.couponType === 'personal'
      ? `Tấm vé này sẽ đi thẳng sang phía ${ROLE_NAME[formData.receiverRole]} ngay khi tạo.`
      : formData.couponType === 'claimable'
        ? `Tấm vé này sẽ nằm ở nhóm Chờ nhận trong ${selectedClaimWindow.label.toLowerCase()} để ai chạm trước thì giữ.`
        : 'Tấm vé này sẽ hiện như một lời hẹn chung mà cả hai đều có thể dùng.';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 md:pb-8">
      <div className="page-header items-start">
        <div className="min-w-0 flex-1">
          <p className="section-label">Vé yêu thương</p>
          <h1 className="page-title mt-2">Ví voucher rõ ai mở, ai giữ, ai cùng dùng</h1>
          <p className="page-subtitle">
            Phần này tách rõ vé đích danh, vé nhanh tay và vé dùng chung để Ni và Được không phải đoán tấm vé nào đang ở phía ai.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleAiGenerate}
            disabled={aiLoading}
            className="btn-secondary shrink-0"
          >
            {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            AI mở vé chung
          </button>
          <button type="button" onClick={() => setShowModal(true)} className="btn-primary shrink-0 px-4">
            <Plus size={16} />
            Tạo vé
          </button>
        </div>
      </div>

      <section className="surface-card p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Nhóm chính</p>
            <h2 className="mt-2 text-2xl font-black text-ink">{BUCKET_META[activeBucket].label}</h2>
            <p className="mt-2 text-sm leading-6 text-soft">{BUCKET_META[activeBucket].description}</p>
          </div>
          <PersonBadge role={role} prefix="Đang là" variant="soft" className="shrink-0" />
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {BUCKET_ORDER.map((bucket) => (
            <button
              key={bucket}
              type="button"
              onClick={() => setActiveBucket(bucket)}
              className={`rounded-[1.2rem] border px-4 py-3 text-left transition-all ${
                activeBucket === bucket
                  ? 'border-rose-200 bg-rose-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black text-ink">{BUCKET_META[bucket].label}</span>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-soft ring-1 ring-black/5">
                  {groupedCoupons[bucket].length}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-soft">
                {bucket === 'waiting'
                  ? 'Chưa có người giữ'
                  : bucket === 'owned'
                    ? 'Đang nằm phía bạn'
                    : bucket === 'given'
                      ? 'Đang ở phía bên kia'
                      : 'Đã khép lại'}
              </p>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : activeCoupons.length === 0 ? (
          <ContextualEmptyState
            icon={<Ticket size={18} />}
            title={emptyState.title}
            description={emptyState.description}
            action={emptyState.action}
          />
        ) : (
          <div className="space-y-4">
            {activeCoupons.map((coupon) => (
              <motion.article
                key={coupon._id}
                whileTap={{ scale: 0.99 }}
                onClick={() => setDetailCoupon(coupon)}
                className={`surface-card overflow-hidden p-4 transition-all md:p-5 ${
                  coupon.isUsed ? 'opacity-75' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] ${
                    coupon.isUsed ? 'bg-slate-100 text-slate-500' : 'bg-rose-50 text-primary'
                  }`}>
                    <Ticket size={26} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <InfoPill
                            label={coupon.typeLabel}
                            className={coupon.typeTone}
                            icon={TYPE_META[coupon.resolvedType].icon}
                          />
                          <InfoPill label={coupon.statusLabel} className={coupon.statusTone} />
                          {coupon.isAiGenerated ? (
                            <InfoPill label="AI" className="bg-violet-50 text-violet-700 ring-violet-200/80" icon={<Sparkles size={12} />} />
                          ) : null}
                        </div>

                        <h3 className="mt-3 text-lg font-black text-ink">{coupon.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-soft">{coupon.directionLine}</p>
                      </div>

                      {role === 'boyfriend' ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteCoupon(coupon._id);
                          }}
                          className="rounded-full p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                          aria-label="Thu hồi voucher"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {coupon.description || 'Tấm vé này chưa có mô tả thêm.'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {renderContextBadges(coupon)}
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                          {coupon.metaLine}
                        </p>
                        {coupon.claimWindowLabel && !coupon.isUsed ? (
                          <p className={`mt-2 text-xs font-semibold ${coupon.isClaimExpired ? 'text-slate-400' : 'text-amber-700'}`}>
                            {coupon.claimWindowLabel}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {coupon.primaryAction ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handlePrimaryAction(coupon);
                            }}
                            className="btn-primary px-4 py-2 text-xs"
                          >
                            {coupon.primaryActionLabel}
                            <ArrowRight size={14} />
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">
                            {coupon.inactiveLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {detailCoupon ? (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 md:items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDetailCoupon(null)}
            />

            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            >
              <div className="border-b border-slate-100 px-6 py-5 md:px-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <InfoPill
                        label={detailCoupon.typeLabel}
                        className={detailCoupon.typeTone}
                        icon={TYPE_META[detailCoupon.resolvedType].icon}
                      />
                      <InfoPill label={detailCoupon.statusLabel} className={detailCoupon.statusTone} />
                    </div>
                    <h2 className="mt-3 text-2xl font-black text-ink">{detailCoupon.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-soft">{detailCoupon.directionLine}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetailCoupon(null)}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Đóng chi tiết voucher"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-5 overflow-y-auto px-6 py-5 md:px-7">
                <div className="rounded-[1.5rem] bg-[#fcf7fa] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Mô tả</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {detailCoupon.description || 'Tấm vé này chưa có mô tả thêm.'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Ngữ nghĩa đã chốt</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {renderContextBadges(detailCoupon)}
                  </div>
                  {detailCoupon.isLegacy ? (
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Voucher này đi lên từ dữ liệu cũ nên app chỉ suy ra phần nhìn cần thiết, không ép ghi đè thông tin cũ.
                    </p>
                  ) : null}
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Nhịp thời gian</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{detailCoupon.metaLine}</p>
                  {detailCoupon.claimWindowLabel && !detailCoupon.isUsed ? (
                    <p className={`mt-2 text-sm font-semibold ${detailCoupon.isClaimExpired ? 'text-slate-400' : 'text-amber-700'}`}>
                      {detailCoupon.claimWindowLabel}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-slate-100 px-6 py-4 md:px-7">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {role === 'boyfriend' ? (
                    <button
                      type="button"
                      onClick={() => deleteCoupon(detailCoupon._id)}
                      className="btn-secondary"
                    >
                      <Trash2 size={16} />
                      Thu hồi
                    </button>
                  ) : null}

                  {detailCoupon.primaryAction ? (
                    <button
                      type="button"
                      onClick={() => void handlePrimaryAction(detailCoupon)}
                      className="btn-primary"
                    >
                      {detailCoupon.primaryActionLabel}
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">
                      {detailCoupon.isUsed ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
                      {detailCoupon.inactiveLabel}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showModal ? (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 md:items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />

            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="relative w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl md:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="section-label">Tạo voucher</p>
                  <h2 className="mt-2 text-2xl font-black text-ink">Chốt loại vé trước khi viết nội dung</h2>
                  <p className="mt-2 text-sm leading-6 text-soft">
                    Lượt này chỉ cần rõ loại, người nhận và người giữ để voucher mới không rơi về luồng cũ mơ hồ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Đóng form tạo voucher"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Loại voucher</p>
                  <div className="mt-3 grid gap-3">
                    {COMPOSER_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData((current) => ({ ...current, couponType: option.value }))}
                        className={`rounded-[1.4rem] border p-4 text-left transition-all ${
                          formData.couponType === option.value
                            ? 'border-rose-200 bg-rose-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <InfoPill
                            label={TYPE_META[option.value].label}
                            className={TYPE_META[option.value].tone}
                            icon={TYPE_META[option.value].icon}
                          />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.couponType === 'personal' ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Dành cho ai</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {(['girlfriend', 'boyfriend'] as Role[]).map((candidateRole) => (
                        <button
                          key={candidateRole}
                          type="button"
                          onClick={() => setFormData((current) => ({ ...current, receiverRole: candidateRole }))}
                          className={`rounded-[1.2rem] border px-4 py-3 text-left transition-all ${
                            formData.receiverRole === candidateRole
                              ? 'border-rose-200 bg-rose-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <PersonBadge role={candidateRole} prefix="Tặng" variant="soft" className="!px-3 !py-1.5 !text-[11px]" />
                          <p className="mt-3 text-xs leading-5 text-soft">
                            {candidateRole === role
                              ? 'Tấm vé sẽ đi thẳng về phía bạn.'
                              : `Tấm vé sẽ nằm phía ${ROLE_NAME[candidateRole]}.`}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : formData.couponType === 'claimable' ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Giữ mở tới đâu</p>
                    <div className="mt-3 grid gap-3">
                      {CLAIM_WINDOW_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData((current) => ({ ...current, claimWindowHours: option.value }))}
                          className={`rounded-[1.2rem] border p-4 text-left transition-all ${
                            formData.claimWindowHours === option.value
                              ? 'border-amber-200 bg-amber-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <InfoPill label={option.label} className="bg-amber-50 text-amber-700 ring-amber-200/80" icon={<Clock3 size={12} />} />
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-600">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.4rem] bg-[#fcf7fa] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Hiểu nhanh</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{composerHint}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="coupon-title" className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Tiêu đề
                  </label>
                  <input
                    id="coupon-title"
                    required
                    value={formData.title}
                    onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Ví dụ: Chọn phim tối nay"
                    className="mt-3 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 outline-none transition focus:border-rose-200 focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="coupon-description" className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Mô tả
                  </label>
                  <textarea
                    id="coupon-description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Viết ngắn gọn tấm vé này dùng khi nào, để làm gì."
                    className="mt-3 w-full rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 outline-none transition focus:border-rose-200 focus:bg-white"
                  />
                </div>

                <div className="rounded-[1.4rem] bg-slate-50 p-4">
                  <p className="text-sm leading-6 text-slate-600">{composerHint}</p>
                </div>

                <button type="submit" className="btn-primary w-full justify-center py-3">
                  <Plus size={16} />
                  Tạo tấm vé này
                </button>
              </form>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default Coupons;
