import Memory, { IMemory } from '../models/Memory';
import notificationService from './notificationService';
import logger from '../utils/logger';

class MemoryService {
    async getAllMemories() {
        logger.info('Memory', 'Lấy danh sách kỷ niệm');
        const memories = await Memory.find().sort({ date: -1 });
        logger.success('Memory', `Trả về ${memories.length} kỷ niệm`);
        return memories;
    }

    async getMemoryById(id: string) {
        logger.info('Memory', 'Lấy kỷ niệm theo ID', { id });
        const memory = await Memory.findById(id);
        if (!memory) {
            logger.warn('Memory', 'Không tìm thấy kỷ niệm', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Memory', 'Tìm thấy kỷ niệm', { title: memory.title });
        return memory;
    }

    async createMemory(data: Partial<IMemory>) {
        logger.info('Memory', 'Tạo kỷ niệm mới', { title: data.title, mood: data.mood, date: data.date });
        try {
            const memory = await Memory.create(data);
            logger.success('Memory', 'Tạo kỷ niệm thành công', { id: memory._id, title: memory.title });

            logger.info('Memory', 'Gửi thông báo Discord...');
            await notificationService.sendDiscord(
                '📸 Kỷ niệm mới vừa được ghi dấu!',
                `Tiêu đề: **${memory.title}**\nCảm xúc: **${memory.mood}**\nHãy vào xem ngay nhé! ❤️`,
                15277667
            );
            logger.success('Memory', 'Đã gửi thông báo Discord');

            return memory;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                logger.error('Memory', 'Lỗi validation khi tạo kỷ niệm', messages);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            logger.error('Memory', 'Lỗi khi tạo kỷ niệm', error);
            throw error;
        }
    }

    async updateMemory(id: string, data: Partial<IMemory>) {
        logger.info('Memory', 'Cập nhật kỷ niệm', { id, fields: Object.keys(data) });
        const memory = await Memory.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!memory) {
            logger.warn('Memory', 'Không tìm thấy kỷ niệm để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Memory', 'Cập nhật kỷ niệm thành công', { title: memory.title });
        return memory;
    }

    async deleteMemory(id: string) {
        logger.info('Memory', 'Xóa kỷ niệm', { id });
        const memory = await Memory.findById(id);
        if (!memory) {
            logger.warn('Memory', 'Không tìm thấy kỷ niệm để xóa', { id });
            throw new Error('NOT_FOUND');
        }
        await memory.deleteOne();
        logger.success('Memory', 'Đã xóa kỷ niệm', { title: memory.title });
        return true;
    }
}

export default new MemoryService();
