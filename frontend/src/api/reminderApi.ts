import api from './api';
import type { Role } from '../constants/roles';

export type ReminderOwner = 'boyfriend' | 'girlfriend' | 'both';

export interface IReminder {
  _id: string;
  owner: ReminderOwner;
  title: string;
  emoji?: string;
  time: string;            // 'HH:mm'
  daysOfWeek: number[];    // 0=CN … 6=T7; rỗng = hằng ngày
  date?: string;           // 'YYYY-MM-DD' — ca một lần
  critical: boolean;
  isActive: boolean;
  note?: string;
  createdBy: Role;
  createdAt: string;
}

export interface ChannelStatus {
  webPush: { configured: boolean; boyfriendSubs: number; girlfriendSubs: number };
  telegram: { configured: boolean; boyfriend: boolean; girlfriend: boolean };
  discord: boolean;
}

export interface ScheduleReminderDraft {
  title: string;
  emoji?: string;
  time: string;
  daysOfWeek?: number[];
  date?: string;
  critical?: boolean;
}

const reminderApi = {
  getReminders: (owner?: ReminderOwner) =>
    api.get<{ success: boolean; data: IReminder[] }>('/reminders', { params: owner ? { owner } : {} }),
  createReminder: (data: Partial<IReminder>) => api.post('/reminders', data),
  updateReminder: (id: string, data: Partial<IReminder>) => api.put(`/reminders/${id}`, data),
  deleteReminder: (id: string) => api.delete(`/reminders/${id}`),
  bulkCreate: (reminders: ScheduleReminderDraft[]) => api.post('/reminders/bulk', { reminders }),

  importFromImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post<{ success: boolean; data: ScheduleReminderDraft[] }>('/reminders/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  subscribe: (subscription: PushSubscriptionJSON, owner: Role) =>
    api.post('/reminders/subscribe', { subscription, owner }),
  unsubscribe: (endpoint: string) => api.post('/reminders/unsubscribe', { endpoint }),

  getChannelStatus: () => api.get<{ success: boolean; data: ChannelStatus }>('/reminders/channels/status'),
};

export default reminderApi;
