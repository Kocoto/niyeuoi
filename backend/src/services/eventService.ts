import Event, { IEvent } from '../models/Event';
import notificationService from './notificationService';

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
            const event = await Event.create(data);
            await notificationService.sendDiscord(
                '📅 Cột mốc quan trọng sắp tới!',
                `Sự kiện: **${event.name}**\nNgày diễn ra: ${new Date(event.date).toLocaleDateString('vi-VN')}\n<i>"${event.description || 'Chuẩn bị tinh thần thôi!'}"</i>`,
                1752220 // Xanh đậm
            );
            return event;
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
