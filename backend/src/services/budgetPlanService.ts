import mongoose from 'mongoose';
import BudgetPlan, { IBudgetPlan, PlanOwner } from '../models/BudgetPlan';
import Debt from '../models/Debt';
import Transaction from '../models/Transaction';
import expenseWalletService from './expenseWalletService';
import logger from '../utils/logger';
import type { CategoryBucket } from '../models/ExpenseCategory';

type BucketKey = CategoryBucket; // 'needs' | 'wants' | 'savings'

interface BucketAllocation {
    target: number;
    spent: number;
    remaining: number;
    percentage: number; // spent / target
    pct: number;        // tỉ lệ cấu hình (50/30/20)
}

export interface AllocationResult {
    owner: PlanOwner;
    month: number;
    year: number;
    income: number;
    debtTotal: number;      // tổng phải trả nợ / tháng — trừ TRƯỚC khi chia
    disposable: number;     // income - debtTotal
    buckets: Record<BucketKey, BucketAllocation>;
    daysLeft: number;       // số ngày còn lại trong tháng (0 nếu tháng đã qua)
    dailyAllowance: number; // nhóm "wants": remaining / daysLeft
    hasPlan: boolean;       // đã thiết lập lương chưa
}

const DEFAULT_PCT: Record<BucketKey, number> = { needs: 50, wants: 30, savings: 20 };

class BudgetPlanService {
    async getPlan(owner: PlanOwner): Promise<IBudgetPlan | null> {
        return BudgetPlan.findOne({ owner });
    }

    async upsertPlan(data: Partial<IBudgetPlan>): Promise<IBudgetPlan> {
        logger.info('BudgetPlan', 'Upsert hồ sơ thu nhập', { owner: data.owner });
        if (!data.owner) throw new Error('VALIDATION_ERROR: Thiếu owner');
        if (data.monthlyIncome == null || data.monthlyIncome < 0) {
            throw new Error('VALIDATION_ERROR: Thu nhập không hợp lệ');
        }
        const plan = await BudgetPlan.findOneAndUpdate(
            { owner: data.owner },
            { ...data },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
        );
        logger.success('BudgetPlan', 'Đã upsert hồ sơ', { id: plan._id });
        return plan;
    }

    /** Khung 50/30/20: lấy lương − tổng trả nợ, phần còn lại chia theo tỉ lệ; đối chiếu với chi thực tế theo bucket. */
    async getAllocation(owner: PlanOwner, month: number, year: number): Promise<AllocationResult> {
        logger.info('BudgetPlan', 'Tính phân bổ 50/30/20', { owner, month, year });

        const plan = await this.getPlan(owner);
        const income = plan?.monthlyIncome ?? 0;
        const pct: Record<BucketKey, number> = {
            needs: plan?.needsPct ?? DEFAULT_PCT.needs,
            wants: plan?.wantsPct ?? DEFAULT_PCT.wants,
            savings: plan?.savingsPct ?? DEFAULT_PCT.savings,
        };

        // Tổng phải trả nợ hàng tháng (nợ đang hoạt động cùng owner) — trừ trước.
        const debtAgg = await Debt.aggregate([
            { $match: { owner, isActive: true } },
            { $group: { _id: null, total: { $sum: '$monthlyPayment' } } },
        ]);
        const debtTotal = debtAgg[0]?.total ?? 0;
        const disposable = Math.max(0, income - debtTotal);

        // Chi thực tế trong tháng, gom theo bucket của danh mục.
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        const match: Record<string, any> = { type: 'expense', date: { $gte: start, $lt: end } };
        const ids = await expenseWalletService.resolveWalletIds(owner);
        if (ids) match.walletId = { $in: ids.map((i) => new mongoose.Types.ObjectId(i)) };

        const spendAgg = await Transaction.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'expensecategories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    // danh mục thiếu/không có bucket → tính vào 'needs' (mặc định thiết yếu)
                    _id: { $ifNull: ['$category.bucket', 'needs'] },
                    total: { $sum: '$amount' },
                },
            },
        ]);
        const spentMap = new Map<string, number>(spendAgg.map((s: any) => [String(s._id), s.total]));

        const buckets = {} as Record<BucketKey, BucketAllocation>;
        (['needs', 'wants', 'savings'] as BucketKey[]).forEach((key) => {
            const target = Math.round((disposable * pct[key]) / 100);
            const spent = spentMap.get(key) ?? 0;
            const remaining = target - spent;
            const percentage = target > 0 ? Math.round((spent / target) * 100) : 0;
            buckets[key] = { target, spent, remaining, percentage, pct: pct[key] };
        });

        const daysLeft = this.daysLeftInMonth(month, year);
        const wantsRemaining = buckets.wants.remaining;
        const dailyAllowance = daysLeft > 0 && wantsRemaining > 0 ? Math.floor(wantsRemaining / daysLeft) : 0;

        return {
            owner, month, year,
            income, debtTotal, disposable,
            buckets, daysLeft, dailyAllowance,
            hasPlan: !!plan,
        };
    }

    private daysLeftInMonth(month: number, year: number): number {
        const now = new Date();
        const daysInMonth = new Date(year, month, 0).getDate();
        const curY = now.getFullYear();
        const curM = now.getMonth() + 1;
        if (year < curY || (year === curY && month < curM)) return 0;          // tháng đã qua
        if (year > curY || (year === curY && month > curM)) return daysInMonth; // tháng tương lai
        return daysInMonth - now.getDate() + 1;                                 // tháng hiện tại (gồm hôm nay)
    }
}

export default new BudgetPlanService();
