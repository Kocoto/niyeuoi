import Memory, { IMemory } from '../models/Memory.js';

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
            return await Memory.create(data);
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
