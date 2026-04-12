import React from 'react';

type EmptyStateProps = {
  icon: React.ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

const EmptyState: React.FC<EmptyStateProps> = ({ icon, eyebrow, title, description, action }) => (
  <div className="empty-state">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-primary">
      {icon}
    </div>
    {eyebrow ? <p className="section-label">{eyebrow}</p> : null}
    <h2 className="mt-2 text-2xl font-black text-ink">{title}</h2>
    <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-soft">{description}</p>
    {action ? <div className="mt-6">{action}</div> : null}
  </div>
);

export default EmptyState;
