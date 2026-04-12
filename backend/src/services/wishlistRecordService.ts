import WishlistRecord, { IWishlistRecord } from '../models/WishlistRecord';
import logger from '../utils/logger';

class WishlistRecordService {
  async getAll() {
    const items = await WishlistRecord.find().sort({ createdAt: -1 });
    logger.success('WishlistRecord', `Trả về ${items.length} mong muốn`);
    return items;
  }

  async getById(id: string) {
    const item = await WishlistRecord.findById(id);
    if (!item) throw new Error('NOT_FOUND');
    return item;
  }

  async create(data: Partial<IWishlistRecord>) {
    try {
      const item = await WishlistRecord.create(data);
      logger.success('WishlistRecord', 'Tạo mong muốn mới', { id: item._id });
      return item;
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((v: any) => v.message);
        throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
      }
      throw error;
    }
  }

  async update(id: string, data: Partial<IWishlistRecord>) {
    const item = await WishlistRecord.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!item) throw new Error('NOT_FOUND');
    return item;
  }

  async delete(id: string) {
    const item = await WishlistRecord.findById(id);
    if (!item) throw new Error('NOT_FOUND');
    await item.deleteOne();
    return true;
  }
}

export default new WishlistRecordService();
