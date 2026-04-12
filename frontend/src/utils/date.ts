export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'gần đây';

  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days === 1) return 'hôm qua';

  return `${days} ngày trước`;
}

export function formatFullDate(dateStr?: string): string {
  if (!dateStr) return 'Chưa có ngày';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatCompactDate(dateStr?: string): string {
  if (!dateStr) return 'Chưa có ngày';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function getGreetingLine(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) {
    return 'Buổi sáng nhẹ nhàng';
  }

  if (hour < 18) {
    return 'Buổi chiều vừa đủ chậm';
  }

  return 'Buổi tối để nhìn lại';
}

export type TimelineBucket = 'today' | 'week' | 'month' | 'earlier';

export function getTimelineBucket(dateStr?: string): TimelineBucket {
  if (!dateStr) return 'earlier';

  const date = new Date(dateStr);
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (date >= startOfToday) return 'today';
  if (date >= startOfWeek) return 'week';
  if (date >= startOfMonth) return 'month';
  return 'earlier';
}

export function getTimelineBucketLabel(bucket: TimelineBucket): string {
  switch (bucket) {
    case 'today':
      return 'Hôm nay';
    case 'week':
      return 'Tuần này';
    case 'month':
      return 'Tháng này';
    default:
      return 'Trước đó';
  }
}
