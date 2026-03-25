import Event, { IEvent } from '../models/Event.js';

class EventService {
    async getAllEvents() {
        return await Event.find().sort({ date: 1 });
    }

    async getEventById(id: string) {
        const event = await Event.findById(id);
        if (!event) throw new Error('NOT_FOUND');
        return event;
    }

    async createEvent(data: Partial<IEvent>) {
        try {
            return await Event.create(data);
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async updateEvent(id: string, data: Partial<IEvent>) {
        const event = await Event.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!event) throw new Error('NOT_FOUND');
        return event;
    }

    async deleteEvent(id: string) {
        const event = await Event.findById(id);
        if (!event) throw new Error('NOT_FOUND');
        await event.deleteOne();
        return true;
    }
}

export default new EventService();
