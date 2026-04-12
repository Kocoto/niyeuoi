import EventRecord, { IEventRecord } from '../models/EventRecord';
import logger from '../utils/logger';

class EventRecordService {
  async getAll() {
    const items = await EventRecord.find().sort({ date: 1 });
    logger.success('EventRecord', `Trả về ${items.length} sự kiện`);
    return items;
  }

  async create(data: Partial<IEventRecord>) {
    try {
      const item = await EventRecord.create(data);
      logger.success('EventRecord', 'Tạo sự kiện mới', { id: item._id });
      return item;
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((v: any) => v.message);
        throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
      }
      throw error;
    }
  }

  async update(id: string, data: Partial<IEventRecord>) {
    const item = await EventRecord.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!item) throw new Error('NOT_FOUND');
    return item;
  }

  async delete(id: string) {
    const item = await EventRecord.findById(id);
    if (!item) throw new Error('NOT_FOUND');
    await item.deleteOne();
    return true;
  }
}

export default new EventRecordService();
