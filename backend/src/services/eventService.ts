import Event, {
    EVENT_TARGET_VALUES,
    EVENT_TYPE_VALUES,
    IEvent,
    type EventTarget,
    type EventType
} from '../models/Event';
import notificationService from './notificationService';
import logger from '../utils/logger';

const EVENT_TYPE_LABEL: Record<EventType, string> = {
    birthday: 'Sinh nhật',
    anniversary: 'Ngày quen nhau',
    date_plan: 'Hẹn đi chơi',
    special_plan: 'Việc đặc biệt'
};

const EVENT_TARGET_LABEL: Record<EventTarget, string> = {
    girlfriend: 'Ni',
    boyfriend: 'Được',
    both: 'cả hai'
};

const isEventType = (value: unknown): value is EventType =>
    typeof value === 'string' && EVENT_TYPE_VALUES.includes(value as EventType);

const isEventTarget = (value: unknown): value is EventTarget =>
    typeof value === 'string' && EVENT_TARGET_VALUES.includes(value as EventTarget);

const normalizeEventPayload = (data: Partial<IEvent>) => {
    const payload: Partial<IEvent> = { ...data };

    if (!isEventType(payload.eventType)) {
        delete payload.eventType;
    }

    if (!isEventTarget(payload.forWhom)) {
        delete payload.forWhom;
    }

    if (typeof payload.description === 'string') {
        payload.description = payload.description.trim();
    }

    return payload;
};

const buildEventNotificationMessage = (event: IEvent) => {
    const eventType = isEventType(event.eventType) ? EVENT_TYPE_LABEL[event.eventType] : 'Ngày quan trọng';
    const target = isEventTarget(event.forWhom) ? EVENT_TARGET_LABEL[event.forWhom] : 'chưa rõ dành cho ai';
    const note = event.description || 'Giữ lại ngày này để lần tới nhìn vào là biết vì sao nó quan trọng.';

    return `Sự kiện: **${event.title}**\nLoại: ${eventType}\nDành cho: ${target}\nNgày diễn ra: ${new Date(event.date).toLocaleDateString('vi-VN')}\n<i>"${note}"</i>`;
};

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
        const payload = normalizeEventPayload(data);
        logger.info('Event', 'Tạo sự kiện mới', {
            title: payload.title,
            date: payload.date,
            eventType: payload.eventType,
            forWhom: payload.forWhom,
            createdBy: payload.createdBy
        });
        try {
            const event = await Event.create(payload);
            logger.success('Event', 'Tạo sự kiện thành công', { id: event._id, title: event.title });

            logger.info('Event', 'Gửi thông báo Discord...');
            await notificationService.sendDiscord(
                '📅 Một ngày cần nhớ vừa được lưu lại',
                buildEventNotificationMessage(event),
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
        const payload = normalizeEventPayload(data);
        const event = await Event.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true
        });
        if (!event) {
            logger.warn('Event', 'Không tìm thấy sự kiện để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Event', 'Cập nhật sự kiện thành công', {
            title: event.title,
            date: event.date,
            eventType: event.eventType,
            forWhom: event.forWhom
        });
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
