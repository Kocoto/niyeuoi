export type Role = 'boyfriend' | 'girlfriend';

type RoleMeta = {
  name: string;
  fullName: string;
  cornerLabel: string;
  authLabel: 'BF' | 'GF';
  pillClassName: string;
  authGradientClassName: string;
  authBorderClassName: string;
  authButtonClassName: string;
  badgeTone: {
    softWrapper: string;
    softIcon: string;
    solidWrapper: string;
    solidIcon: string;
  };
};

export const ROLE_META: Record<Role, RoleMeta> = {
  girlfriend: {
    name: 'Ni',
    fullName: 'Trúc Linh (Ni)',
    cornerLabel: 'Góc của Ni',
    authLabel: 'GF',
    pillClassName: 'pill-ni',
    authGradientClassName: 'from-pink-200 via-rose-100 to-white',
    authBorderClassName: 'border-pink-200',
    authButtonClassName: 'bg-pink-500 hover:bg-pink-600',
    badgeTone: {
      softWrapper: 'bg-pink-50 text-pink-700 ring-pink-200/80',
      softIcon: 'bg-white text-pink-500',
      solidWrapper: 'bg-pink-500 text-white ring-pink-200/80',
      solidIcon: 'bg-white/20 text-white',
    },
  },
  boyfriend: {
    name: 'Được',
    fullName: 'Ngọc Được',
    cornerLabel: 'Góc của Được',
    authLabel: 'BF',
    pillClassName: 'pill-duoc',
    authGradientClassName: 'from-sky-200 via-cyan-100 to-white',
    authBorderClassName: 'border-sky-200',
    authButtonClassName: 'bg-sky-500 hover:bg-sky-600',
    badgeTone: {
      softWrapper: 'bg-sky-50 text-sky-700 ring-sky-200/80',
      softIcon: 'bg-white text-sky-500',
      solidWrapper: 'bg-sky-500 text-white ring-sky-200/80',
      solidIcon: 'bg-white/20 text-white',
    },
  },
};

export const ROLE_NAME: Record<Role, string> = {
  boyfriend: ROLE_META.boyfriend.name,
  girlfriend: ROLE_META.girlfriend.name,
};

export const ROLE_FULLNAME: Record<Role, string> = {
  boyfriend: ROLE_META.boyfriend.fullName,
  girlfriend: ROLE_META.girlfriend.fullName,
};

export const ROLE_CORNER_LABEL: Record<Role, string> = {
  boyfriend: ROLE_META.boyfriend.cornerLabel,
  girlfriend: ROLE_META.girlfriend.cornerLabel,
};

export const ROLE_AUTH_LABEL: Record<Role, string> = {
  boyfriend: ROLE_META.boyfriend.authLabel,
  girlfriend: ROLE_META.girlfriend.authLabel,
};

export const ROLE_PILL_CLASS: Record<Role, string> = {
  boyfriend: ROLE_META.boyfriend.pillClassName,
  girlfriend: ROLE_META.girlfriend.pillClassName,
};

export function getRoleMeta(role: Role): RoleMeta {
  return ROLE_META[role];
}

export function isRole(value: unknown): value is Role {
  return value === 'boyfriend' || value === 'girlfriend';
}
