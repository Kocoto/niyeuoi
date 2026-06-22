export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatVNDCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
  return `${amount}đ`;
}

export function parseVND(raw: string): number {
  return parseInt(raw.replace(/\D/g, ''), 10) || 0;
}

export function formatVNDInput(amount: number): string {
  if (!amount) return '';
  return amount.toLocaleString('vi-VN');
}
