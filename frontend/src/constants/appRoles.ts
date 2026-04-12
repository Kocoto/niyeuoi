export type AppRole = 'boyfriend' | 'girlfriend';
export type RoleTarget = AppRole | 'both';

export const ROLE_NAME: Record<AppRole, string> = {
  boyfriend: 'Được',
  girlfriend: 'Ni',
};

export const ROLE_FULLNAME: Record<AppRole, string> = {
  boyfriend: 'Ngọc Được',
  girlfriend: 'Trúc Linh (Ni)',
};

export const ROLE_CORNER_LABEL: Record<AppRole, string> = {
  boyfriend: 'Góc của Được',
  girlfriend: 'Góc của Ni',
};

export const ROLE_TONE: Record<AppRole, { soft: string; solid: string; subtle: string; ring: string }> = {
  boyfriend: {
    soft: 'bg-sky-50 text-sky-600',
    solid: 'bg-sky-500 text-white',
    subtle: 'bg-sky-50/80 text-sky-700',
    ring: 'ring-sky-100',
  },
  girlfriend: {
    soft: 'bg-pink-50 text-pink-600',
    solid: 'bg-primary text-white',
    subtle: 'bg-pink-50/80 text-pink-700',
    ring: 'ring-pink-100',
  },
};

export function getOtherRole(role: AppRole): AppRole {
  return role === 'boyfriend' ? 'girlfriend' : 'boyfriend';
}
