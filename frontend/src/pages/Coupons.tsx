import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/api';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Gift,
  Loader2,
  Plus,
  Sparkles,
  Ticket,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ContextualEmptyState from '../components/ContextualEmptyState';
import PersonBadge from '../components/PersonBadge';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { ROLE_NAME, isRole, type Role } from '../constants/roles';

type CouponType = 'personal' | 'claimable' | 'shared';
type CouponParty = Role | 'both';
type CouponCreator = Role | 'system';
type CouponBucket = 'waiting' | 'owned' | 'given' | 'used';
type ResolvedCouponType = CouponType | 'legacy';

interface ICoupon {
  _id: string;
  title: string;
  description: string;
  isUsed: boolean;
  isAiGenerated?: boolean;
  createdBy?: CouponCreator;
  couponType?: CouponType;
  receiverRole?: CouponParty;
  holderRole?: CouponParty;
  claimEndsAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

type CouponViewModel = ICoupon & {
  creator: CouponCreator | null;
  resolvedType: ResolvedCouponType;
  resolvedReceiver: CouponParty | null;
  resolvedHolder: CouponParty | null;
  bucket: CouponBucket;
  typeLabel: string;
  typeTone: string;
  directionLine: string;
  statusLabel: string;
  statusTone: string;
  metaLine: string;
  isLegacy: boolean;
  isClaimExpired: boolean;
  claimWindowLabel: string | null;
  primaryAction: 'claim' | 'redeem' | null;
  primaryActionLabel: string | null;
  inactiveLabel: string;
};

const BUCKET_ORDER: CouponBucket[] = ['waiting', 'owned', 'given', 'used'];

const BUCKET_META: Record<CouponBucket, { label: string; description: string }> = {
  waiting: {
    label: 'Chờ nhận',
    description: 'Những tấm vé chưa có người giữ rõ ràng, chủ yếu là kiểu nhanh tay hoặc lượt cũ còn đang treo.',
  },
  owned: {
    label: 'Đã có',
    description: 'Những tấm vé đang ở phía bạn, gồm cả tấm vé chung mà hai người có thể dùng cùng nhau.',
  },
  given: {
    label: 'Đã tặng',
    description: 'Những tấm vé hiện đang nằm phía bên kia hoặc được bạn mở ra cho người kia.',
  },
  used: {
    label: 'Đã dùng',
    description: 'Những tấm vé đã khép lại, để nhìn lại nhịp quan tâm đã đi qua.',
  },
};

const TYPE_META: Record<ResolvedCouponType, { label: string; tone: string; icon: React.ReactNode }> = {
  personal: {
    label: 'Đích danh',
    tone: 'bg-rose-50 text-rose-700 ring-rose-200/80',
    icon: <Gift size={13} />,
  },
  claimable: {
    label: 'Nhanh tay',
    tone: 'bg-amber-50 text-amber-700 ring-amber-200/80',
    icon: <Zap size={13} />,
  },
  shared: {
    label: 'Dùng chung',
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
    icon: <Users size={13} />,
  },
  legacy: {
    label: 'Lượt cũ',
    tone: 'bg-slate-100 text-slate-600 ring-slate-200/80',
    icon: <Clock3 size={13} />,
  },
};

const COMPOSER_TYPE_OPTIONS: Array<{ value: CouponType; label: string; description: string }> = [
  {
    value: 'personal',
    label: 'Đích danh',
    description: 'Một tấm vé dành rõ cho Ni hoặc Được.',
  },
  {
    value: 'claimable',
    label: 'Nhanh tay',
    description: 'Ai nhận trước thì giữ, hợp với tấm vé vui và ngắn hạn.',
  },
  {
    value: 'shared',
    label: 'Dùng chung',
    description: 'Một lời hẹn mà cả hai đều có thể cùng mở ra.',
  },
];

const CLAIM_WINDOW_OPTIONS: Array<{ value: number; label: string; description: string }> = [
  {
    value: 12,
    label: 'Tối nay',
    description: 'Một nhịp vui ngắn, hợp cho vé nhanh tay mở ra và dùng sớm.',
  },
  {
    value: 72,
    label: '3 ngày',
    description: 'Giữ vừa đủ lâu để cả hai kịp thấy mà không kéo thành trò tranh phần.',
  },
  {
    value: 168,
    label: '1 tuần',
    description: 'Vẫn là playful, nhưng cho một khoảng thở dài hơn trong tuần này.',
  },
];

const PILL_STYLE = {
  created: 'bg-white/85 text-slate-600 ring-slate-200/80',
  shared: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  system: 'bg-violet-50 text-violet-700 ring-violet-200/80',
};

function getOppositeRole(role: Role): Role {
  return role === 'boyfriend' ? 'girlfriend' : 'boyfriend';
}

function formatRelative(value?: string) {
  if (!value) return 'gần đây';

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days === 1) return 'hôm qua';
  if (days < 7) return `${days} ngày trước`;

  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
}

function formatClaimWindow(value?: string) {
  if (!value) return null;

  const diffMs = new Date(value).getTime() - Date.now();
  if (diffMs <= 0) return 'Hết hạn nhận';

  const minutes = Math.ceil(diffMs / 60000);
  const hours = Math.ceil(diffMs / 3600000);
  const days = Math.ceil(diffMs / 86400000);

  if (minutes < 60) return `Còn ${minutes} phút để nhận`;
  if (hours < 24) return `Còn ${hours} giờ để nhận`;
  return `Còn ${days} ngày để nhận`;
}

function isClaimExpired(value?: string) {
  if (!value) return false;
  return new Date(value).getTime() <= Date.now();
}

function readApiError(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { error?: unknown } } }).response?.data?.error === 'string'
  ) {
    return (error as { response?: { data?: { error?: string } } }).response?.data?.error ?? fallback;
  }

  return fallback;
}

function resolveCreator(value?: CouponCreator) {
  if (value === 'system' || isRole(value)) {
    return value;
  }

  return null;
}

function resolveCouponType(coupon: ICoupon): ResolvedCouponType {
  if (coupon.couponType === 'personal' || coupon.couponType === 'claimable' || coupon.couponType === 'shared') {
    return coupon.couponType;
  }

  if (coupon.receiverRole === 'both' || coupon.holderRole === 'both') {
    return 'shared';
  }

  if (isRole(coupon.receiverRole) || isRole(coupon.holderRole)) {
    return 'personal';
  }

  return 'legacy';
}

function resolveReceiver(coupon: ICoupon, resolvedType: ResolvedCouponType, creator: CouponCreator | null): CouponParty | null {
  if (coupon.receiverRole === 'both' || isRole(coupon.receiverRole)) {
    return coupon.receiverRole;
  }

  if (resolvedType === 'shared') {
    return 'both';
  }

  if (resolvedType === 'personal' && isRole(coupon.holderRole)) {
    return coupon.holderRole;
  }

  if (resolvedType === 'legacy' && isRole(creator)) {
    return getOppositeRole(creator);
  }

  return null;
}

function resolveHolder(coupon: ICoupon, resolvedType: ResolvedCouponType, receiver: CouponParty | null, creator: CouponCreator | null): CouponParty | null {
  if (coupon.holderRole === 'both' || isRole(coupon.holderRole)) {
    return coupon.holderRole;
  }

  if (resolvedType === 'shared') {
    return 'both';
  }

  if (resolvedType === 'personal' && receiver) {
    return receiver;
  }

  if (resolvedType === 'legacy' && isRole(creator)) {
    return getOppositeRole(creator);
  }

  return null;
}

function getBucket(coupon: ICoupon, role: Role, creator: CouponCreator | null, resolvedType: ResolvedCouponType, receiver: CouponParty | null, holder: CouponParty | null): CouponBucket {
  if (coupon.isUsed) {
    return 'used';
  }

  if (resolvedType === 'claimable' && !holder) {
    return 'waiting';
  }

  if (resolvedType === 'shared') {
    return 'owned';
  }

  if (holder === role) {
    return 'owned';
  }

  if (resolvedType === 'personal' && receiver === role) {
    return 'owned';
  }

  if (resolvedType === 'legacy') {
    return creator === role ? 'given' : 'owned';
  }

  return 'given';
}

function getDirectionLine(coupon: ICoupon, creator: CouponCreator | null, resolvedType: ResolvedCouponType, receiver: CouponParty | null, holder: CouponParty | null) {
  if (resolvedType === 'shared') {
    if (creator === 'system') {
      return 'Hệ thống vừa mở ra một tấm vé cho cả hai.';
    }

    if (isRole(creator)) {
      return `${ROLE_NAME[creator]} mở một tấm vé chung để cả hai cùng dùng.`;
    }

    return 'Tấm vé chung này đang giữ chỗ cho cả hai.';
  }

  if (resolvedType === 'claimable') {
    if (isRole(holder)) {
      return `${ROLE_NAME[holder]} đã nhận tấm vé này và đang giữ nó.`;
    }

    const claimWindow = formatClaimWindow(coupon.claimEndsAt);
    return claimWindow
      ? `Ai nhận trước sẽ giữ tấm vé này. ${claimWindow}.`
      : 'Ai nhận trước sẽ giữ tấm vé này.';
  }

  if (resolvedType === 'personal') {
    if (isRole(creator) && isRole(receiver)) {
      return `${ROLE_NAME[creator]} tặng riêng tấm vé này cho ${ROLE_NAME[receiver].toLowerCase()}.`;
    }

    if (isRole(receiver)) {
      return `Tấm vé này đang dành riêng cho ${ROLE_NAME[receiver].toLowerCase()}.`;
    }

    return 'Tấm vé riêng này chưa ghi đủ người nhận.';
  }

  if (isRole(creator)) {
    return `Lượt cũ từ ${ROLE_NAME[creator]} chưa ghi rõ loại hay người giữ.`;
  }

  if (creator === 'system') {
    return 'Một voucher cũ từ hệ thống chưa ghi đủ loại hay người giữ.';
  }

  return 'Voucher cũ này vẫn được giữ lại.';
}

function getStatusLabel(coupon: ICoupon, resolvedType: ResolvedCouponType, receiver: CouponParty | null, holder: CouponParty | null) {
  if (coupon.isUsed) {
    return 'Đã dùng';
  }

  if (resolvedType === 'claimable' && !holder) {
    return formatClaimWindow(coupon.claimEndsAt) ?? 'Đang chờ nhận';
  }

  if (resolvedType === 'shared') {
    return 'Cả hai đều dùng được';
  }

  if (holder === 'both') {
    return 'Cả hai đang giữ';
  }

  if (isRole(holder)) {
    return `${ROLE_NAME[holder]} đang giữ`;
  }

  if (isRole(receiver)) {
    return `Dành cho ${ROLE_NAME[receiver]}`;
  }

  return 'Lượt cũ';
}

function getStatusTone(coupon: ICoupon, resolvedType: ResolvedCouponType, holder: CouponParty | null) {
  if (coupon.isUsed) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200/80';
  }

  if (resolvedType === 'claimable' && !holder) {
    return isClaimExpired(coupon.claimEndsAt)
      ? 'bg-slate-100 text-slate-600 ring-slate-200/80'
      : 'bg-amber-50 text-amber-700 ring-amber-200/80';
  }

  if (resolvedType === 'shared') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200/80';
  }

  if (holder === 'both') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200/80';
  }

  if (isRole(holder)) {
    return holder === 'girlfriend'
      ? 'bg-pink-50 text-pink-700 ring-pink-200/80'
      : 'bg-sky-50 text-sky-700 ring-sky-200/80';
  }

  return 'bg-slate-100 text-slate-600 ring-slate-200/80';
}

function getInactiveLabel(
  coupon: ICoupon,
  role: Role,
  creator: CouponCreator | null,
  resolvedType: ResolvedCouponType,
  receiver: CouponParty | null,
  holder: CouponParty | null,
) {
  if (coupon.isUsed) {
    return 'Đã khép lại';
  }

  if (resolvedType === 'claimable') {
    if (!holder) {
      return isClaimExpired(coupon.claimEndsAt) ? 'Đã hết hạn nhận' : 'Đang chờ ai nhận trước';
    }

    if (holder === role) {
      return `Đang ở phía ${ROLE_NAME[role]}`;
    }

    if (isRole(holder)) {
      return `Đang ở phía ${ROLE_NAME[holder]}`;
    }
  }

  if (resolvedType === 'shared') {
    return 'Cả hai đều có thể dùng';
  }

  if (holder === role || receiver === role) {
    return 'Đang nằm phía bạn';
  }

  if (isRole(holder)) {
    return `Đang ở phía ${ROLE_NAME[holder]}`;
  }

  if (isRole(receiver)) {
    return `Đang ở phía ${ROLE_NAME[receiver]}`;
  }

  if (creator === role) {
    return `${ROLE_NAME[role]} mở tấm vé này`;
  }

  return 'Giữ lại từ lượt cũ';
}

function buildCouponView(coupon: ICoupon, role: Role): CouponViewModel {
  const creator = resolveCreator(coupon.createdBy);
  const resolvedType = resolveCouponType(coupon);
  const resolvedReceiver = resolveReceiver(coupon, resolvedType, creator);
  const resolvedHolder = resolveHolder(coupon, resolvedType, resolvedReceiver, creator);
  const bucket = getBucket(coupon, role, creator, resolvedType, resolvedReceiver, resolvedHolder);
  const claimWindowLabel = formatClaimWindow(coupon.claimEndsAt);
  const claimExpired = resolvedType === 'claimable' && !resolvedHolder && isClaimExpired(coupon.claimEndsAt);
  const primaryAction =
    !coupon.isUsed && resolvedType === 'claimable' && !resolvedHolder && !claimExpired
      ? 'claim'
      : !coupon.isUsed &&
          (resolvedType === 'shared' ||
            resolvedHolder === role ||
            (resolvedType === 'personal' && resolvedReceiver === role) ||
            (resolvedType === 'legacy' && creator !== role))
        ? 'redeem'
        : null;

  const metaParts = [
    `#${coupon._id.slice(-4).toUpperCase()}`,
    creator === 'system' ? 'Hệ thống mở' : isRole(creator) ? `${ROLE_NAME[creator]} tạo` : 'Lượt cũ',
    formatRelative(coupon.updatedAt ?? coupon.createdAt),
  ];

  return {
    ...coupon,
    creator,
    resolvedType,
    resolvedReceiver,
    resolvedHolder,
    bucket,
    typeLabel: TYPE_META[resolvedType].label,
    typeTone: TYPE_META[resolvedType].tone,
    directionLine: getDirectionLine(coupon, creator, resolvedType, resolvedReceiver, resolvedHolder),
    statusLabel: getStatusLabel(coupon, resolvedType, resolvedReceiver, resolvedHolder),
    statusTone: getStatusTone(coupon, resolvedType, resolvedHolder),
    metaLine: metaParts.join(' · '),
    isLegacy: resolvedType === 'legacy',
    isClaimExpired: claimExpired,
    claimWindowLabel,
    primaryAction,
    primaryActionLabel:
      primaryAction === 'claim'
        ? 'Nhận tấm vé này'
        : primaryAction === 'redeem'
          ? resolvedType === 'shared'
            ? 'Đánh dấu cả hai đã dùng'
            : 'Đánh dấu đã dùng'
          : null,
    inactiveLabel: getInactiveLabel(coupon, role, creator, resolvedType, resolvedReceiver, resolvedHolder),
  };
}

const InfoPill: React.FC<{ label: string; className: string; icon?: React.ReactNode }> = ({ label, className, icon }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 ${className}`}>
    {icon}
    <span>{label}</span>
  </span>
);

function renderContextBadges(coupon: CouponViewModel) {
  const badges: React.ReactNode[] = [];

  if (isRole(coupon.creator)) {
    badges.push(
      <PersonBadge
        key={`creator-${coupon._id}`}
        role={coupon.creator}
        prefix="Mở bởi"
        variant="soft"
        className="!px-3 !py-1.5 !text-[11px]"
      />,
    );
  } else if (coupon.creator === 'system') {
    badges.push(
      <InfoPill
        key={`creator-system-${coupon._id}`}
        label="Hệ thống mở"
        className={PILL_STYLE.system}
        icon={<Sparkles size={12} />}
      />,
    );
  }

  if (coupon.resolvedType === 'shared') {
    badges.push(
      <InfoPill
        key={`shared-${coupon._id}`}
        label="Cả hai cùng giữ"
        className={PILL_STYLE.shared}
        icon={<Users size={12} />}
      />,
    );
    return badges;
  }

  if (coupon.resolvedType === 'claimable' && !coupon.resolvedHolder) {
    badges.push(
      <InfoPill
        key={`waiting-${coupon._id}`}
        label="Chưa có người giữ"
        className="bg-amber-50 text-amber-700 ring-amber-200/80"
        icon={<Zap size={12} />}
      />,
    );
    return badges;
  }

  if (coupon.resolvedType === 'claimable' && isRole(coupon.resolvedHolder)) {
    badges.push(
      <PersonBadge
        key={`claim-holder-${coupon._id}`}
        role={coupon.resolvedHolder}
        prefix="Đang giữ"
        variant="soft"
        className="!px-3 !py-1.5 !text-[11px]"
      />,
    );

    return badges;
  }

  if (isRole(coupon.resolvedReceiver)) {
    badges.push(
      <PersonBadge
        key={`receiver-${coupon._id}`}
        role={coupon.resolvedReceiver}
        prefix="Dành cho"
        variant="soft"
        className="!px-3 !py-1.5 !text-[11px]"
      />,
    );
  }

  if (isRole(coupon.resolvedHolder) && coupon.resolvedHolder !== coupon.resolvedReceiver) {
    badges.push(
      <PersonBadge
        key={`holder-${coupon._id}`}
        role={coupon.resolvedHolder}
        prefix="Đang giữ"
        variant="soft"
        className="!px-3 !py-1.5 !text-[11px]"
      />,
    );
  }

  return badges;
}

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
                      Voucher này đi lên từ dữ liệu cũ nên app chỉ suy ra phần nhìn cần thiết, không ép ghi đè metadata cũ.
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
