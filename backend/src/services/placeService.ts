import Place, { IPlace } from '../models/Place';
import notificationService from './notificationService';
import logger from '../utils/logger';

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
        logger.info('Places', 'Tạo địa điểm mới', { name: data.name, category: data.category, isVisited: data.isVisited });
        try {
            const place = await Place.create(data);
            logger.success('Places', 'Tạo địa điểm thành công', { id: place._id, name: place.name });

            const action = place.isVisited ? 'vừa măm măm tại' : 'vừa tìm thấy một quán cực xịn:';
            const color = place.isVisited ? 15844367 : 3066993;

            logger.info('Places', 'Gửi thông báo Discord...');
            await notificationService.sendDiscord(
                `🍴 Địa điểm ăn uống mới!`,
                `Người ấy ${action} **${place.name}**\n📍 Địa chỉ: ${place.address}\n<i>"${place.note || 'Hãy cùng nhau đi nhé!'}"</i>`,
                color
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
        const place = await Place.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!place) {
            logger.warn('Places', 'Không tìm thấy địa điểm để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Places', 'Cập nhật thành công', { id, name: place.name, isVisited: place.isVisited, rating: place.rating });
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
