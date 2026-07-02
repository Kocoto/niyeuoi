import React from 'react';
import { ROLE_NAME, type Role } from '../../constants/roles';

interface RolePickerProps {
  value: Role;
  onChange: (role: Role) => void;
}

const ROLES: Role[] = ['boyfriend', 'girlfriend'];

/** Chọn xem calo của ai (2 vai). */
const RolePicker: React.FC<RolePickerProps> = ({ value, onChange }) => (
  <div className="flex rounded-full bg-black/5 p-1">
    {ROLES.map((r) => (
      <button
        key={r}
        type="button"
        onClick={() => onChange(r)}
        className={`flex-1 rounded-full py-2 text-sm font-bold transition ${value === r ? 'bg-white text-ink shadow-sm' : 'text-soft'}`}
      >
        {ROLE_NAME[r]}
      </button>
    ))}
  </div>
);

export default RolePicker;
