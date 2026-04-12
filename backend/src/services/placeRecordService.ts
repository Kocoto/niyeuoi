import PlaceRecord, { IPlaceRecord } from '../models/PlaceRecord';
import logger from '../utils/logger';

class PlaceRecordService {
  async getAll() {
    const items = await PlaceRecord.find().sort({ createdAt: -1 });
    logger.success('PlaceRecord', `Trả về ${items.length} địa điểm`);
    return items;
  }

  async getRandom(isVisited?: boolean) {
    const filter = isVisited !== undefined ? { isVisited } : {};
    const count = await PlaceRecord.countDocuments(filter);
    if (count === 0) throw new Error('NOT_FOUND');
    const random = Math.floor(Math.random() * count);
    const item = await PlaceRecord.findOne(filter).skip(random);
    if (!item) throw new Error('NOT_FOUND');
    return item;
  }

  async create(data: Partial<IPlaceRecord>) {
    try {
      const item = await PlaceRecord.create(data);
      logger.success('PlaceRecord', 'Tạo địa điểm mới', { id: item._id });
      return item;
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((v: any) => v.message);
        throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
      }
      throw error;
    }
  }

  async update(id: string, data: Partial<IPlaceRecord>) {
    const item = await PlaceRecord.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!item) throw new Error('NOT_FOUND');
    return item;
  }

  async delete(id: string) {
    const item = await PlaceRecord.findById(id);
    if (!item) throw new Error('NOT_FOUND');
    await item.deleteOne();
    return true;
  }
}

export default new PlaceRecordService();
