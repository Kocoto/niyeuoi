import React, { useState } from 'react';
import { parseVND, formatVNDInput } from '../../utils/currency';

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
}

const AmountInput: React.FC<AmountInputProps> = ({ value, onChange, className = '', placeholder = '0' }) => {
  const [focused, setFocused] = useState(false);

  const displayValue = focused
    ? (value === 0 ? '' : String(value))
    : formatVNDInput(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseVND(e.target.value);
    onChange(parsed);
  };

  return (
    <div className={`relative flex items-center gap-1 ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full bg-transparent text-center text-3xl font-bold text-ink outline-none placeholder:text-soft/40 md:text-4xl"
      />
      <span className="shrink-0 text-xl font-bold text-soft/60">₫</span>
    </div>
  );
};

export default AmountInput;
