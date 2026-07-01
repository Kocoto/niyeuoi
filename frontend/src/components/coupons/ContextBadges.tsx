/* eslint-disable react-refresh/only-export-components -- file gộp InfoPill (component) + renderContextBadges (helper), không ảnh hưởng runtime */
import type { ReactNode } from 'react';
import { Sparkles, Users, Zap } from 'lucide-react';
import PersonBadge from '../PersonBadge';
import { isRole } from '../../constants/roles';
import type { CouponViewModel } from './types';
import { PILL_STYLE } from './couponLogic';

export const InfoPill = ({ label, className, icon }: { label: string; className: string; icon?: ReactNode }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 ${className}`}>
    {icon}
    <span>{label}</span>
  </span>
);

export function renderContextBadges(coupon: CouponViewModel) {
  const badges: ReactNode[] = [];

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
