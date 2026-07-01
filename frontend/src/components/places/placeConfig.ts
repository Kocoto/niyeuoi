import { ROLE_NAME, isRole, type Role } from '../../constants/roles';
import type { PersonScope } from '../PersonScopeTabs';

export const CATEGORIES = [
  { value: 'Cafe', emoji: '☕' },
  { value: 'Trà sữa', emoji: '🧋' },
  { value: 'Nhà hàng', emoji: '🍽️' },
  { value: 'Ăn vặt', emoji: '🍢' },
  { value: 'Lẩu & Nướng', emoji: '🔥' },
  { value: 'Hải sản', emoji: '🦞' },
  { value: 'Phở & Bún', emoji: '🍜' },
  { value: 'Bánh & Kem', emoji: '🍰' },
  { value: 'Quán nhậu', emoji: '🍺' },
  { value: 'Khác', emoji: '📍' },
] as const;

export type PlaceStatus = 'want_to_go' | 'next_time' | 'visited';

export type LocationResult = {
  display_name: string;
  lat: string;
  lon: string;
};

export interface IPlace {
  _id: string;
  name: string;
  address: string;
  rating?: number | null;
  category: string;
  note?: string;
  image?: string;
  isVisited: boolean;
  status?: PlaceStatus;
  createdBy?: Role;
  location: {
    type: string;
    coordinates: number[];
  };
}

export type PlaceFormState = {
  name: string;
  address: string;
  rating: number;
  category: string;
  note: string;
  image: string;
  status: PlaceStatus;
  location: {
    type: string;
    coordinates: number[];
  };
};

export const PLACE_STATUS_ORDER: PlaceStatus[] = ['want_to_go', 'next_time', 'visited'];

export const STATUS_META: Record<
  PlaceStatus,
  {
    label: string;
    shortLabel: string;
    description: string;
    chipClassName: string;
    tabClassName: string;
    panelClassName: string;
    noteLabel: string;
    randomLabel: string;
    emptyTitle: string;
    emptyBody: string;
    emptyAction: string;
  }
> = {
  want_to_go: {
    label: 'Muốn đi',
    shortLabel: 'Muốn đi',
    description: 'Lưu những chỗ vừa thấy hay để không quên và chưa cần chốt ngay.',
    chipClassName: 'bg-rose-50 text-rose-700 ring-rose-200/80',
    tabClassName: 'bg-rose-500 text-white shadow-sm shadow-rose-200/70',
    panelClassName: 'border-rose-100 bg-gradient-to-br from-white via-rose-50 to-orange-50',
    noteLabel: 'Vì sao lưu lại',
    randomLabel: 'Chọn một nơi bất kỳ',
    emptyTitle: 'Danh sách muốn đi còn đang trống',
    emptyBody: 'Lưu một chỗ hai bạn vừa nhắc tới để tối khác mở ra là biết bắt đầu từ đâu.',
    emptyAction: 'Thêm vào Muốn đi',
  },
  next_time: {
    label: 'Lần tới nên thử',
    shortLabel: 'Lần tới',
    description: 'Danh sách ngắn để lần hẹn kế tiếp bớt phân vân và quyết nhanh hơn.',
    chipClassName: 'bg-amber-50 text-amber-700 ring-amber-200/80',
    tabClassName: 'bg-amber-500 text-white shadow-sm shadow-amber-200/70',
    panelClassName: 'border-amber-100 bg-gradient-to-br from-white via-amber-50 to-orange-50',
    noteLabel: 'Lý do nên thử tiếp theo',
    randomLabel: 'Quick decision',
    emptyTitle: 'Chưa có nơi nào được ghim cho lần tới',
    emptyBody: 'Khi hai bạn đã có vài lựa chọn sáng giá, hãy ghim một nơi vào đây để lần hẹn sau mở ra là chốt nhanh được ngay.',
    emptyAction: 'Ghim một nơi cho lần tới',
  },
  visited: {
    label: 'Đã đi',
    shortLabel: 'Đã đi',
    description: 'Những nơi đã thành kỷ niệm, có thể chấm điểm và giữ lại cảm giác sau buổi hẹn.',
    chipClassName: 'bg-sky-50 text-sky-700 ring-sky-200/80',
    tabClassName: 'bg-sky-500 text-white shadow-sm shadow-sky-200/70',
    panelClassName: 'border-sky-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50',
    noteLabel: 'Điều còn nhớ lại',
    randomLabel: 'Nhớ lại một nơi',
    emptyTitle: 'Chưa có địa điểm nào được đánh dấu đã đi',
    emptyBody: 'Khi một buổi hẹn kết thúc, chuyển địa điểm sang đây để giữ rating và note thay vì để mọi thứ trôi mất.',
    emptyAction: 'Thêm trực tiếp vào Đã đi',
  },
};

export const resolvePlaceStatus = (place: Pick<IPlace, 'status' | 'isVisited'>): PlaceStatus => {
  if (place.status === 'want_to_go' || place.status === 'next_time' || place.status === 'visited') {
    return place.status;
  }

  return place.isVisited ? 'visited' : 'want_to_go';
};

export const resolvePlaceOwner = (createdBy?: Role): Role | null => (isRole(createdBy) ? createdBy : null);

export const matchesPlaceScope = (place: IPlace, scope: PersonScope) => {
  if (scope === 'all') return true;
  return resolvePlaceOwner(place.createdBy) === scope;
};

export const getPersonScopeLabel = (scope: PersonScope) => (scope === 'all' ? 'Tất cả' : ROLE_NAME[scope]);

export const createInitialForm = (status: PlaceStatus = 'want_to_go'): PlaceFormState => ({
  name: '',
  address: '',
  rating: 5,
  category: 'Cafe',
  note: '',
  image: '',
  status,
  location: {
    type: 'Point',
    coordinates: [0, 0],
  },
});
