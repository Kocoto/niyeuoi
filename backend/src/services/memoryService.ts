import Memory, { IMemory } from '../models/Memory';
import notificationService from './notificationService';

class MemoryService {
    async getAllMemories() {
        return await Memory.find().sort({ date: -1 });
    }

    async getMemoryById(id: string) {
        const memory = await Memory.findById(id);
        if (!memory) throw new Error('NOT_FOUND');
        return memory;
    }

    async createMemory(data: Partial<IMemory>) {
        try {
            const memory = await Memory.create(data);
            await notificationService.sendDiscord(
                '📸 Kỷ niệm mới vừa được ghi dấu!',
                `Tiêu đề: **${memory.title}**\nCảm xúc: **${memory.mood}**\nHãy vào xem ngay nhé! ❤️`,
                15277667 // Màu hồng
            );
            return memory;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async updateMemory(id: string, data: Partial<IMemory>) {
        const memory = await Memory.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!memory) throw new Error('NOT_FOUND');
        return memory;
    }

    async deleteMemory(id: string) {
        const memory = await Memory.findById(id);
        if (!memory) throw new Error('NOT_FOUND');
        await memory.deleteOne();
        return true;
    }
}

export default new MemoryService();
