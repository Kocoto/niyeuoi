import Event, { IEvent } from '../models/Event';
import notificationService from './notificationService';
import logger from '../utils/logger';

class EventService {
    async getAllEvents() {
        logger.info('Event', 'Lấy danh sách sự kiện');
        const events = await Event.find().sort({ date: 1 });
        logger.success('Event', `Trả về ${events.length} sự kiện`);
        return events;
    }

    async getEventById(id: string) {
        logger.info('Event', 'Lấy sự kiện theo ID', { id });
        const event = await Event.findById(id);
        if (!event) {
            logger.warn('Event', 'Không tìm thấy sự kiện', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Event', 'Tìm thấy sự kiện', { title: event.title });
        return event;
    }

    async createEvent(data: Partial<IEvent>) {
        logger.info('Event', 'Tạo sự kiện mới', { title: data.title, date: data.date });
        try {
            const event = await Event.create(data);
            logger.success('Event', 'Tạo sự kiện thành công', { id: event._id, title: event.title });

            logger.info('Event', 'Gửi thông báo Discord...');
            await notificationService.sendDiscord(
                '📅 Cột mốc quan trọng sắp tới!',
                `Sự kiện: **${event.title}**\nNgày diễn ra: ${new Date(event.date).toLocaleDateString('vi-VN')}\n<i>"${event.description || 'Chuẩn bị tinh thần thôi!'}"</i>`,
                1752220
            );
            logger.success('Event', 'Đã gửi thông báo Discord');

            return event;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                logger.error('Event', 'Lỗi validation khi tạo sự kiện', messages);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            logger.error('Event', 'Lỗi khi tạo sự kiện', error);
            throw error;
        }
    }

    async updateEvent(id: string, data: Partial<IEvent>) {
        logger.info('Event', 'Cập nhật sự kiện', { id, fields: Object.keys(data) });
        const event = await Event.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!event) {
            logger.warn('Event', 'Không tìm thấy sự kiện để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Event', 'Cập nhật sự kiện thành công', { title: event.title, date: event.date });
        return event;
    }

    async deleteEvent(id: string) {
        logger.info('Event', 'Xóa sự kiện', { id });
        const event = await Event.findById(id);
        if (!event) {
            logger.warn('Event', 'Không tìm thấy sự kiện để xóa', { id });
            throw new Error('NOT_FOUND');
        }
        await event.deleteOne();
        logger.success('Event', 'Đã xóa sự kiện', { title: event.title });
        return true;
    }
}

export default new EventService();
