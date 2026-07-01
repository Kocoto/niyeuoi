import type { ReactNode } from 'react';
import { Clock3, Gift, Users, Zap } from 'lucide-react';
import { ROLE_NAME, isRole, type Role } from '../../constants/roles';
import type {
  CouponBucket,
  CouponCreator,
  CouponParty,
  CouponType,
  CouponViewModel,
  ICoupon,
  ResolvedCouponType,
} from './types';

export const BUCKET_ORDER: CouponBucket[] = ['waiting', 'owned', 'given', 'used'];

export const BUCKET_META: Record<CouponBucket, { label: string; description: string }> = {
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

export const TYPE_META: Record<ResolvedCouponType, { label: string; tone: string; icon: ReactNode }> = {
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

export const COMPOSER_TYPE_OPTIONS: Array<{ value: CouponType; label: string; description: string }> = [
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

export const CLAIM_WINDOW_OPTIONS: Array<{ value: number; label: string; description: string }> = [
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

export const PILL_STYLE = {
  created: 'bg-white/85 text-slate-600 ring-slate-200/80',
  shared: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  system: 'bg-violet-50 text-violet-700 ring-violet-200/80',
};

export function getOppositeRole(role: Role): Role {
  return role === 'boyfriend' ? 'girlfriend' : 'boyfriend';
}

export function formatRelative(value?: string) {
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

export function formatClaimWindow(value?: string) {
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

export function isClaimExpired(value?: string) {
  if (!value) return false;
  return new Date(value).getTime() <= Date.now();
}

export function readApiError(error: unknown, fallback: string) {
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

export function resolveCreator(value?: CouponCreator) {
  if (value === 'system' || isRole(value)) {
    return value;
  }

  return null;
}

export function resolveCouponType(coupon: ICoupon): ResolvedCouponType {
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

export function resolveReceiver(coupon: ICoupon, resolvedType: ResolvedCouponType, creator: CouponCreator | null): CouponParty | null {
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

export function resolveHolder(coupon: ICoupon, resolvedType: ResolvedCouponType, receiver: CouponParty | null, creator: CouponCreator | null): CouponParty | null {
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

export function getBucket(coupon: ICoupon, role: Role, creator: CouponCreator | null, resolvedType: ResolvedCouponType, receiver: CouponParty | null, holder: CouponParty | null): CouponBucket {
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

export function getDirectionLine(coupon: ICoupon, creator: CouponCreator | null, resolvedType: ResolvedCouponType, receiver: CouponParty | null, holder: CouponParty | null) {
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

export function getStatusLabel(coupon: ICoupon, resolvedType: ResolvedCouponType, receiver: CouponParty | null, holder: CouponParty | null) {
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

export function getStatusTone(coupon: ICoupon, resolvedType: ResolvedCouponType, holder: CouponParty | null) {
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

export function getInactiveLabel(
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

export function buildCouponView(coupon: ICoupon, role: Role): CouponViewModel {
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
