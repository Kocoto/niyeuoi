import Mood, { IMood } from '../models/Mood.js';

class MoodService {
    async getAllMoods() {
        return await Mood.find().sort({ date: -1 });
    }

    async getMoodById(id: string) {
        const mood = await Mood.findById(id);
        if (!mood) throw new Error('NOT_FOUND');
        return mood;
    }

    async createMood(data: Partial<IMood>) {
        try {
            return await Mood.create(data);
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async updateMood(id: string, data: Partial<IMood>) {
        const mood = await Mood.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!mood) throw new Error('NOT_FOUND');
        return mood;
    }

    async deleteMood(id: string) {
        const mood = await Mood.findById(id);
        if (!mood) throw new Error('NOT_FOUND');
        await mood.deleteOne();
        return true;
    }
}

export default new MoodService();
