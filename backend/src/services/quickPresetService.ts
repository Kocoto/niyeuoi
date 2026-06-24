import QuickPreset, { IQuickPreset } from '../models/QuickPreset';
import logger from '../utils/logger';

class QuickPresetService {
    async getAll(): Promise<IQuickPreset[]> {
        logger.info('QuickPreset', 'Lấy danh sách mẫu ghi nhanh');
        const presets = await QuickPreset.find()
            .populate('walletId', 'name color')
            .populate('categoryId', 'name icon color')
            .sort({ createdAt: -1 });
        return presets;
    }

    async create(data: Partial<IQuickPreset>): Promise<IQuickPreset> {
        logger.info('QuickPreset', 'Tạo mẫu ghi nhanh', { label: data.label });
        try {
            const preset = await QuickPreset.create(data);
            logger.success('QuickPreset', 'Đã tạo mẫu', { id: preset._id });
            return preset;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((v: any) => v.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        logger.info('QuickPreset', 'Xoá mẫu ghi nhanh', { id });
        const preset = await QuickPreset.findById(id);
        if (!preset) throw new Error('NOT_FOUND');
        await preset.deleteOne();
        logger.success('QuickPreset', 'Đã xoá mẫu', { id });
    }
}

export default new QuickPresetService();
