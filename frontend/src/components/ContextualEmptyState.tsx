import React from 'react';
import { Link } from 'react-router-dom';

type EmptyStateAction = {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
};

type ContextualEmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: EmptyStateAction;
  layout?: 'centered' | 'inline';
  className?: string;
};

const ACTION_CLASSNAME: Record<NonNullable<EmptyStateAction['variant']>, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
};

const ContextualEmptyState: React.FC<ContextualEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  layout = 'centered',
  className = '',
}) => {
  const actionClassName = action ? ACTION_CLASSNAME[action.variant ?? 'primary'] : '';
  const wrapperClassName =
    layout === 'centered'
      ? 'empty-state flex flex-col items-center'
      : 'flex flex-col items-start rounded-[1.5rem] border border-white/70 bg-[#fcf7fa] p-4 text-left shadow-[0_18px_45px_rgba(232,107,168,0.09)] backdrop-blur md:p-5';

  return (
    <div className={`${wrapperClassName}${className ? ` ${className}` : ''}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-black/5">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-black text-ink">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-soft">{description}</p>

      {action ? (
        action.to ? (
          <Link to={action.to} className={`mt-5 ${actionClassName}`}>
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className={`mt-5 ${actionClassName}`}>
            {action.label}
          </button>
        )
      ) : null}
    </div>
  );
};

export default ContextualEmptyState;
