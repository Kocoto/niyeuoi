import api from './api';
import type { Role } from '../constants/roles';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface ICalorieEntry {
  _id: string;
  owner: Role;
  date: string;
  mealType: MealType;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  imageUrl?: string;
  note?: string;
  createdBy: Role;
  createdAt: string;
}

export interface ICalorieGoal {
  _id: string;
  owner: Role;
  dailyTarget: number;
}

export interface CalorieDailySummary {
  owner: Role;
  date: string;
  target: number;
  consumed: number;
  remaining: number;
  percentage: number;
  protein: number;
  carbs: number;
  fat: number;
  byMeal: Record<MealType, number>;
  hasGoal: boolean;
}

export interface CalorieTrendPoint {
  date: string;
  label: string;
  total: number;
}

export interface CalorieEstimate {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
}

const calorieApi = {
  getEntries: (owner: Role, date: string) =>
    api.get<{ success: boolean; data: ICalorieEntry[] }>('/calories', { params: { owner, date } }),
  createEntry: (data: Partial<ICalorieEntry>) => api.post('/calories', data),
  updateEntry: (id: string, data: Partial<ICalorieEntry>) => api.put(`/calories/${id}`, data),
  deleteEntry: (id: string) => api.delete(`/calories/${id}`),

  getSummary: (owner: Role, date: string) =>
    api.get<{ success: boolean; data: CalorieDailySummary }>('/calories/summary', { params: { owner, date } }),
  getTrend: (owner: Role, date?: string) =>
    api.get<{ success: boolean; data: CalorieTrendPoint[] }>('/calories/trend', { params: { owner, date } }),

  getGoal: (owner: Role) =>
    api.get<{ success: boolean; data: ICalorieGoal | null }>('/calories/goal', { params: { owner } }),
  upsertGoal: (owner: Role, dailyTarget: number) =>
    api.post<{ success: boolean; data: ICalorieGoal }>('/calories/goal', { owner, dailyTarget }),

  estimateFromText: (description: string) =>
    api.post<{ success: boolean; data: CalorieEstimate }>('/calories/estimate', { description }),
  estimateFromImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post<{ success: boolean; data: CalorieEstimate }>('/calories/estimate', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default calorieApi;
