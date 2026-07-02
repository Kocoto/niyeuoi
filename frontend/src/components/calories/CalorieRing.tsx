import React from 'react';
import { motion } from 'framer-motion';

interface CalorieRingProps {
  consumed: number;
  target: number;
  percentage: number;
}

/** Vòng tiến độ calo trong ngày (SVG). */
const CalorieRing: React.FC<CalorieRingProps> = ({ consumed, target, percentage }) => {
  const size = 176;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(percentage, 100);
  const over = target > 0 && consumed > target;
  const remaining = target - consumed;

  const color = over ? '#f43f5e' : percentage >= 80 ? '#f59e0b' : '#10b981';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#00000010" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * clamped) / 100 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-ink">{consumed.toLocaleString('vi-VN')}</span>
        <span className="text-[11px] font-semibold text-soft">/ {target > 0 ? target.toLocaleString('vi-VN') : '—'} kcal</span>
        {target > 0 && (
          <span className={`mt-1 text-xs font-bold ${over ? 'text-rose-500' : 'text-green-600'}`}>
            {over ? `Vượt ${Math.abs(remaining).toLocaleString('vi-VN')}` : `Còn ${remaining.toLocaleString('vi-VN')}`}
          </span>
        )}
      </div>
    </div>
  );
};

export default CalorieRing;
