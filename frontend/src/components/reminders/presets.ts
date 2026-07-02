export interface ReminderPreset {
  emoji: string;
  title: string;
  time: string;
  daysOfWeek: number[];
  critical?: boolean;
}

// 0=CN … 6=T7
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

export const REMINDER_PRESETS: ReminderPreset[] = [
  { emoji: '🎒', title: 'Đi học', time: '06:30', daysOfWeek: [1, 2, 3, 4, 5], critical: true },
  { emoji: '🍳', title: 'Ăn sáng', time: '07:00', daysOfWeek: [] },
  { emoji: '🍚', title: 'Ăn trưa', time: '11:30', daysOfWeek: [] },
  { emoji: '🍽️', title: 'Ăn tối', time: '18:30', daysOfWeek: [] },
  { emoji: '💧', title: 'Uống nước', time: '10:00', daysOfWeek: [] },
  { emoji: '💊', title: 'Uống thuốc', time: '20:00', daysOfWeek: [] },
  { emoji: '🏃', title: 'Tập thể dục', time: '17:30', daysOfWeek: WEEKDAYS },
  { emoji: '😴', title: 'Đi ngủ', time: '22:30', daysOfWeek: [] },
];

export const WEEKDAY_LABELS: Record<number, string> = {
  0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7',
};
export const WEEKDAY_ORDER = WEEKDAYS;

export function describeRepeat(daysOfWeek: number[], date?: string): string {
  if (date) return `Ngày ${date.split('-').reverse().join('/')}`;
  if (!daysOfWeek || daysOfWeek.length === 0) return 'Hằng ngày';
  if (daysOfWeek.length === 7) return 'Hằng ngày';
  return WEEKDAY_ORDER.filter((d) => daysOfWeek.includes(d)).map((d) => WEEKDAY_LABELS[d]).join(' ');
}
