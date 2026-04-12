import React from 'react';
import type { AppRole } from '../constants/appRoles';
import { ROLE_NAME, ROLE_TONE } from '../constants/appRoles';

type RolePillProps = {
  role: AppRole;
  text?: string;
  className?: string;
  variant?: 'soft' | 'solid' | 'subtle';
};

const RolePill: React.FC<RolePillProps> = ({ role, text, className = '', variant = 'soft' }) => {
  const tone = ROLE_TONE[role][variant];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${tone} ${className}`.trim()}>
      {text ?? ROLE_NAME[role]}
    </span>
  );
};

export default RolePill;
