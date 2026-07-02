import React from 'react';
import { Phone, Pencil, Trash2 } from 'lucide-react';
import type { IReminder } from '../../api/reminderApi';
import { describeRepeat } from './presets';
import { ROLE_NAME, type Role } from '../../constants/roles';

interface ReminderCardProps {
  reminder: IReminder;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

function ownerLabel(owner: IReminder['owner']): string {
  if (owner === 'both') return 'Cả hai';
  return ROLE_NAME[owner as Role];
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onEdit, onDelete, onToggle }) => {
  const dim = !reminder.isActive;
  return (
    <div className={`flex items-center gap-3 rounded-[1rem] bg-[#faf5f8] px-3 py-2.5 ${dim ? 'opacity-50' : ''}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg ring-1 ring-black/5">
        {reminder.emoji || '⏰'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-bold text-ink">{reminder.title}</p>
          {reminder.critical && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-600">
              <Phone size={9} /> Gọi
            </span>
          )}
        </div>
        <p className="truncate text-[11px] text-soft">
          <span className="font-bold text-ink/70">{reminder.time}</span> · {describeRepeat(reminder.daysOfWeek, reminder.date)} · {ownerLabel(reminder.owner)}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${reminder.isActive ? 'bg-green-500' : 'bg-black/15'}`}
        aria-label={reminder.isActive ? 'Tắt' : 'Bật'}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${reminder.isActive ? 'left-[1.375rem]' : 'left-0.5'}`} />
      </button>
      <button type="button" onClick={onEdit} className="flex h-8 w-8 items-center justify-center rounded-full text-soft transition hover:bg-black/5 hover:text-primary">
        <Pencil size={14} />
      </button>
      <button type="button" onClick={onDelete} className="flex h-8 w-8 items-center justify-center rounded-full text-soft transition hover:bg-rose-50 hover:text-rose-500">
        <Trash2 size={14} />
      </button>
    </div>
  );
};

export default ReminderCard;
