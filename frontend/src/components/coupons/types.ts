import type { Role } from '../../constants/roles';

export type CouponType = 'personal' | 'claimable' | 'shared';
export type CouponParty = Role | 'both';
export type CouponCreator = Role | 'system';
export type CouponBucket = 'waiting' | 'owned' | 'given' | 'used';
export type ResolvedCouponType = CouponType | 'legacy';

export interface ICoupon {
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

export type CouponViewModel = ICoupon & {
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
