import React from 'react';

import { getRoleMeta, ROLE_NAME, type Role } from '../constants/roles';

export type PersonScope = 'all' | Role;

type PersonScopeTabsProps = {
  value: PersonScope;
  onChange: (scope: PersonScope) => void;
  counts?: Partial<Record<PersonScope, number>>;
  ariaLabel?: string;
  className?: string;
};

const PERSON_SCOPE_OPTIONS: PersonScope[] = ['all', 'girlfriend', 'boyfriend'];

const getPersonScopeLabel = (scope: PersonScope) => {
  return scope === 'all' ? 'Tất cả' : ROLE_NAME[scope];
};

const PersonScopeTabs: React.FC<PersonScopeTabsProps> = ({
  value,
  onChange,
  counts,
  ariaLabel = 'Lọc theo người',
  className = '',
}) => (
  <div
    className={`inline-flex flex-wrap gap-2 rounded-[1.4rem] bg-white/82 p-1.5 ring-1 ring-slate-200/80${className ? ` ${className}` : ''}`}
    role="tablist"
    aria-label={ariaLabel}
  >
    {PERSON_SCOPE_OPTIONS.map((scope) => {
      const active = value === scope;

      const buttonClassName = (() => {
        if (scope === 'all') {
          return active
            ? 'bg-slate-900 text-white ring-slate-900 shadow-sm'
            : 'bg-white text-slate-600 ring-slate-200 hover:text-slate-900';
        }

        const meta = getRoleMeta(scope);
        return active
          ? `${meta.badgeTone.solidWrapper} shadow-sm`
          : scope === 'girlfriend'
            ? 'bg-pink-50/85 text-pink-700 ring-pink-200/80 hover:bg-pink-50'
            : 'bg-sky-50/85 text-sky-700 ring-sky-200/80 hover:bg-sky-50';
      })();

      const countClassName = active
        ? 'bg-white/20 text-current'
        : 'bg-white/85 text-slate-500 ring-1 ring-black/5';

      return (
        <button
          key={scope}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(scope)}
          className={`inline-flex items-center gap-2 rounded-[1rem] px-3.5 py-2.5 text-xs font-black transition-all ring-1 ${buttonClassName}`}
        >
          <span>{getPersonScopeLabel(scope)}</span>
          {typeof counts?.[scope] === 'number' ? (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${countClassName}`}>
              {counts[scope]}
            </span>
          ) : null}
        </button>
      );
    })}
  </div>
);

export default PersonScopeTabs;
