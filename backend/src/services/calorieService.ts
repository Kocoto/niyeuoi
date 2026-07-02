import CalorieEntry, { ICalorieEntry, MealType } from '../models/CalorieEntry';
import CalorieGoal, { ICalorieGoal } from '../models/CalorieGoal';
import logger from '../utils/logger';
import type { AuthRole } from '../utils/authToken';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export interface DailySummary {
    owner: AuthRole;
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

export interface TrendPoint {
    date: string;
    label: string;   // dd/MM
    total: number;
}

function todayStr(): string {
    return new Date().toISOString().slice(0, 10);
}

function shiftDate(dateStr: string, deltaDays: number): string {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + deltaDays);
    return d.toISOString().slice(0, 10);
}

class CalorieService {
    async getEntries(owner: AuthRole, date: string): Promise<ICalorieEntry[]> {
        logger.info('Calorie', 'Lấy bữa ăn', { owner, date });
        const entries = await CalorieEntry.find({ owner, date }).sort({ createdAt: 1 });
        return entries;
    }

    async createEntry(data: Partial<ICalorieEntry>): Promise<ICalorieEntry> {
        logger.info('Calorie', 'Thêm bữa ăn', { name: data.name, owner: data.owner });
        try {
            if (!data.date) data.date = todayStr();
            const entry = await CalorieEntry.create(data);
            logger.success('Calorie', 'Đã thêm bữa ăn', { id: entry._id });
            return entry;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((v: any) => v.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async updateEntry(id: string, data: Partial<ICalorieEntry>): Promise<ICalorieEntry> {
        logger.info('Calorie', 'Sửa bữa ăn', { id });
        const entry = await CalorieEntry.findById(id);
        if (!entry) throw new Error('NOT_FOUND');
        const { owner: _o, createdBy: _c, ...safe } = data as any;
        Object.assign(entry, safe);
        await entry.save();
        return entry;
    }

    async deleteEntry(id: string): Promise<void> {
        logger.info('Calorie', 'Xóa bữa ăn', { id });
        const entry = await CalorieEntry.findById(id);
        if (!entry) throw new Error('NOT_FOUND');
        await entry.deleteOne();
    }

    async getGoal(owner: AuthRole): Promise<ICalorieGoal | null> {
        return CalorieGoal.findOne({ owner });
    }

    async upsertGoal(owner: AuthRole, dailyTarget: number, createdBy: AuthRole): Promise<ICalorieGoal> {
        logger.info('Calorie', 'Đặt mục tiêu calo', { owner, dailyTarget });
        if (!dailyTarget || dailyTarget <= 0) throw new Error('VALIDATION_ERROR: Mục tiêu phải lớn hơn 0');
        const goal = await CalorieGoal.findOneAndUpdate(
            { owner },
            { owner, dailyTarget, createdBy },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        return goal;
    }

    async getDailySummary(owner: AuthRole, date: string): Promise<DailySummary> {
        const [entries, goal] = await Promise.all([
            CalorieEntry.find({ owner, date }),
            this.getGoal(owner),
        ]);

        const byMeal = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 } as Record<MealType, number>;
        let consumed = 0, protein = 0, carbs = 0, fat = 0;
        for (const e of entries) {
            consumed += e.calories || 0;
            protein += e.protein || 0;
            carbs += e.carbs || 0;
            fat += e.fat || 0;
            if (MEAL_TYPES.includes(e.mealType)) byMeal[e.mealType] += e.calories || 0;
        }

        const target = goal?.dailyTarget ?? 0;
        return {
            owner,
            date,
            target,
            consumed,
            remaining: target - consumed,
            percentage: target > 0 ? Math.round((consumed / target) * 100) : 0,
            protein: Math.round(protein),
            carbs: Math.round(carbs),
            fat: Math.round(fat),
            byMeal,
            hasGoal: !!goal,
        };
    }

    async getWeekTrend(owner: AuthRole, endDate?: string): Promise<TrendPoint[]> {
        const end = endDate || todayStr();
        const dates: string[] = [];
        for (let i = 6; i >= 0; i--) dates.push(shiftDate(end, -i));

        const entries = await CalorieEntry.find({ owner, date: { $in: dates } });
        const totals: Record<string, number> = {};
        for (const e of entries) totals[e.date] = (totals[e.date] || 0) + (e.calories || 0);

        return dates.map((d) => {
            const [, m, day] = d.split('-');
            return { date: d, label: `${day}/${m}`, total: totals[d] || 0 };
        });
    }
}

export default new CalorieService();
