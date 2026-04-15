import Place, { IPlace, PLACE_STATUS_VALUES, type PlaceStatus } from '../models/Place';
import notificationService from './notificationService';
import logger from '../utils/logger';

const isPlaceStatus = (value: unknown): value is PlaceStatus =>
    typeof value === 'string' && PLACE_STATUS_VALUES.includes(value as PlaceStatus);

const normalizePlacePayload = (data: Partial<IPlace>) => {
    const payload: Partial<IPlace> = { ...data };
    const hasStatus = isPlaceStatus(payload.status);
    const hasVisitedFlag = typeof payload.isVisited === 'boolean';

    if (hasStatus) {
        payload.isVisited = payload.status === 'visited';
    } else if (hasVisitedFlag) {
        payload.status = payload.isVisited ? 'visited' : 'want_to_go';
    }

    if (payload.status && payload.status !== 'visited') {
        payload.rating = null;
    }

    return payload;
};

const getPlaceNotificationMeta = (place: IPlace) => {
    if (place.isVisited) {
        return {
            title: '📍 Một địa điểm vừa thành kỷ niệm mới',
            description: `Người ấy vừa đi tại **${place.name}**`,
            color: 15844367
        };
    }

    if (place.status === 'next_time') {
        return {
            title: '📍 Một địa điểm được ghim cho lần tới',
            description: `Người ấy vừa ghim **${place.name}** cho buổi hẹn kế tiếp`,
            color: 3447003
        };
    }

    return {
        title: '📍 Một địa điểm mới trong danh sách muốn đi',
        description: `Người ấy vừa lưu **${place.name}** vào danh sách muốn đi`,
        color: 3066993
    };
};

class PlaceService {
    async getAllPlaces() {
        logger.info('Places', 'Lấy danh sách địa điểm');
        const places = await Place.find().sort({ createdAt: -1 });
        logger.success('Places', `Trả về ${places.length} địa điểm`);
        return places;
    }

    async getPlaceById(id: string) {
        logger.info('Places', 'Lấy địa điểm theo ID', { id });
        const place = await Place.findById(id);
        if (!place) {
            logger.warn('Places', 'Không tìm thấy địa điểm', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Places', 'Tìm thấy địa điểm', { name: place.name });
        return place;
    }

    async createPlace(data: Partial<IPlace>) {
        const payload = normalizePlacePayload(data);
        logger.info('Places', 'Tạo địa điểm mới', {
            name: payload.name,
            category: payload.category,
            isVisited: payload.isVisited,
            status: payload.status
        });
        try {
            const place = await Place.create(payload);
            logger.success('Places', 'Tạo địa điểm thành công', { id: place._id, name: place.name });

            const notification = getPlaceNotificationMeta(place);

            logger.info('Places', 'Gửi thông báo Discord...');
            await notificationService.sendDiscord(
                notification.title,
                `${notification.description}\n📍 Địa chỉ: ${place.address}\n<i>"${place.note || 'Giữ lại để hai bạn quyết định khi cần nhé.'}"</i>`,
                notification.color
            );
            logger.success('Places', 'Đã gửi thông báo Discord');

            return place;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                logger.error('Places', 'Lỗi validation khi tạo địa điểm', messages);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            logger.error('Places', 'Lỗi khi tạo địa điểm', error);
            throw error;
        }
    }

    async updatePlace(id: string, data: Partial<IPlace>) {
        logger.info('Places', 'Cập nhật địa điểm', { id, fields: Object.keys(data) });
        const payload = normalizePlacePayload(data);
        const place = await Place.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true
        });
        if (!place) {
            logger.warn('Places', 'Không tìm thấy địa điểm để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Places', 'Cập nhật thành công', {
            id,
            name: place.name,
            isVisited: place.isVisited,
            status: place.status,
            rating: place.rating
        });
        return place;
    }

    async deletePlace(id: string) {
        logger.info('Places', 'Xóa địa điểm', { id });
        const place = await Place.findById(id);
        if (!place) {
            logger.warn('Places', 'Không tìm thấy địa điểm để xóa', { id });
            throw new Error('NOT_FOUND');
        }
        await place.deleteOne();
        logger.success('Places', 'Đã xóa địa điểm', { name: place.name });
        return true;
    }

    async getRandomPlace(category?: string, isVisited?: boolean) {
        logger.info('Places', 'Random địa điểm', { category: category || 'tất cả', isVisited });
        const query: Record<string, any> = {};
        if (category) query.category = category;
        if (isVisited !== undefined) query.isVisited = isVisited;

        const count = await Place.countDocuments(query);
        logger.info('Places', `Tổng địa điểm phù hợp: ${count}`);
        if (count === 0) {
            logger.warn('Places', 'Không có địa điểm nào để random');
            throw new Error('NOT_FOUND_LIST');
        }

        const random = Math.floor(Math.random() * count);
        const place = await Place.findOne(query).skip(random);
        logger.success('Places', 'Random chọn được', { name: place?.name });
        return place;
    }
}

export default new PlaceService();
