import Place, { IPlace } from '../models/Place.js';
import notificationService from './notificationService.js';

class PlaceService {
    async getAllPlaces() {
        return await Place.find().sort({ createdAt: -1 });
    }

    async getPlaceById(id: string) {
        const place = await Place.findById(id);
        if (!place) throw new Error('NOT_FOUND');
        return place;
    }

    async createPlace(data: Partial<IPlace>) {
        try {
            const place = await Place.create(data);
            
            const action = place.isVisited ? 'vừa măm măm tại' : 'vừa tìm thấy một quán cực xịn:';
            const color = place.isVisited ? 15844367 : 3066993; // Vàng nếu đã đi, Xanh lá nếu muốn đi

            await notificationService.sendDiscord(
                `🍴 Địa điểm ăn uống mới!`,
                `Người ấy ${action} **${place.name}**\n📍 Địa chỉ: ${place.address}\n<i>"${place.note || 'Hãy cùng nhau đi nhé!'}"</i>`,
                color
            );

            return place;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async updatePlace(id: string, data: Partial<IPlace>) {
        const place = await Place.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!place) throw new Error('NOT_FOUND');
        return place;
    }

    async deletePlace(id: string) {
        const place = await Place.findById(id);
        if (!place) throw new Error('NOT_FOUND');
        await place.deleteOne();
        return true;
    }

    async getRandomPlace(category?: string) {
        let query = {};
        if (category) {
            query = { category };
        }

        const count = await Place.countDocuments(query);
        if (count === 0) throw new Error('NOT_FOUND_LIST');

        const random = Math.floor(Math.random() * count);
        const place = await Place.findOne(query).skip(random);
        return place;
    }
}

export default new PlaceService();
