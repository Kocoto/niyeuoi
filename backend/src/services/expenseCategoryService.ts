import ExpenseCategory, { IExpenseCategory } from '../models/ExpenseCategory';
import logger from '../utils/logger';

const DEFAULT_CATEGORIES = [
    { name: 'Ăn uống',    icon: 'utensils',      color: 'orange', bucket: 'needs'   },
    { name: 'Giải trí',   icon: 'gamepad-2',     color: 'purple', bucket: 'wants'   },
    { name: 'Đi hẹn hò',  icon: 'heart',         color: 'rose',   bucket: 'wants'   },
    { name: 'Mua sắm',    icon: 'shopping-bag',  color: 'pink',   bucket: 'wants'   },
    { name: 'Đi lại',     icon: 'car',           color: 'blue',   bucket: 'needs'   },
    { name: 'Y tế',       icon: 'stethoscope',   color: 'green',  bucket: 'needs'   },
    { name: 'Nhà cửa',    icon: 'home',          color: 'amber',  bucket: 'needs'   },
    { name: 'Tiết kiệm',  icon: 'piggy-bank',    color: 'teal',   bucket: 'savings' },
    { name: 'Khác',       icon: 'circle-ellipsis', color: 'slate', bucket: 'needs'  },
] as const;

class ExpenseCategoryService {
    async seedDefaults(): Promise<void> {
        const count = await ExpenseCategory.countDocuments({ isDefault: true });
        // Migration: DB đã seed trước khi có field bucket → vẫn cần chạy lại để gán bucket.
        const missingBucket = await ExpenseCategory.countDocuments({ isDefault: true, bucket: { $exists: false } });
        if (count >= DEFAULT_CATEGORIES.length && missingBucket === 0) return;

        logger.info('ExpenseCategory', 'Seeding danh mục mặc định...');
        for (const cat of DEFAULT_CATEGORIES) {
            await ExpenseCategory.findOneAndUpdate(
                { name: cat.name, isDefault: true },
                { ...cat, isDefault: true, createdBy: 'boyfriend' },
                { upsert: true, new: true },
            );
        }
        logger.success('ExpenseCategory', `Đã seed ${DEFAULT_CATEGORIES.length} danh mục mặc định`);
    }

    async getAllCategories(): Promise<IExpenseCategory[]> {
        logger.info('ExpenseCategory', 'Lấy danh sách danh mục');
        const categories = await ExpenseCategory.find().sort({ isDefault: -1, createdAt: 1 });
        logger.success('ExpenseCategory', `Trả về ${categories.length} danh mục`);
        return categories;
    }

    async createCategory(data: Partial<IExpenseCategory>): Promise<IExpenseCategory> {
        logger.info('ExpenseCategory', 'Tạo danh mục mới', { name: data.name });
        try {
            const category = await ExpenseCategory.create({ ...data, isDefault: false });
            logger.success('ExpenseCategory', 'Tạo danh mục thành công', { id: category._id });
            return category;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((v: any) => v.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async updateCategory(id: string, data: Partial<IExpenseCategory>): Promise<IExpenseCategory> {
        logger.info('ExpenseCategory', 'Cập nhật danh mục', { id });
        const category = await ExpenseCategory.findById(id);
        if (!category) throw new Error('NOT_FOUND');
        if (category.isDefault) throw new Error('CANNOT_MODIFY_DEFAULT');

        Object.assign(category, data);
        await category.save();
        logger.success('ExpenseCategory', 'Đã cập nhật danh mục', { id });
        return category;
    }

    async deleteCategory(id: string): Promise<void> {
        logger.info('ExpenseCategory', 'Xóa danh mục', { id });
        const category = await ExpenseCategory.findById(id);
        if (!category) throw new Error('NOT_FOUND');
        if (category.isDefault) throw new Error('CANNOT_DELETE_DEFAULT');
        await category.deleteOne();
        logger.success('ExpenseCategory', 'Đã xóa danh mục', { id });
    }
}

export default new ExpenseCategoryService();
