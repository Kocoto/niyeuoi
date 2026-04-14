import React from 'react';
import { Heart } from 'lucide-react';

import { ROLE_NAME, getRoleMeta, type Role } from '../constants/roles';

type PersonBadgeProps = {
  role: Role;
  label?: string;
  prefix?: string;
  variant?: 'soft' | 'solid';
  className?: string;
  showIcon?: boolean;
};

const PersonBadge: React.FC<PersonBadgeProps> = ({
  role,
  label,
  prefix,
  variant = 'soft',
  className = '',
  showIcon = true,
}) => {
  const meta = getRoleMeta(role);
  const text = prefix ? `${prefix} ${label ?? ROLE_NAME[role]}` : label ?? ROLE_NAME[role];
  const wrapperClassName = variant === 'solid' ? meta.badgeTone.solidWrapper : meta.badgeTone.softWrapper;
  const iconClassName = variant === 'solid' ? meta.badgeTone.solidIcon : meta.badgeTone.softIcon;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${wrapperClassName}${className ? ` ${className}` : ''}`}
    >
      {showIcon && (
        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${iconClassName}`}>
          <Heart size={11} className="fill-current" />
        </span>
      )}
      <span>{text}</span>
    </span>
  );
};

export default PersonBadge;
