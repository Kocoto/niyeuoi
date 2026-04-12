import CouponRecord, { ICouponRecord, AppRole, VoucherType } from '../models/CouponRecord';
import notificationService from './notificationService';
import logger from '../utils/logger';

class CouponRecordService {
  async getAll() {
    logger.info('CouponRecord', 'Lấy danh sách voucher');
    const items = await CouponRecord.find().sort({ createdAt: -1 });
    logger.success('CouponRecord', `Trả về ${items.length} voucher`);
    return items;
  }

  async getById(id: string) {
    logger.info('CouponRecord', 'Lấy voucher theo ID', { id });
    const item = await CouponRecord.findById(id);
    if (!item) {
      logger.warn('CouponRecord', 'Không tìm thấy voucher', { id });
      throw new Error('NOT_FOUND');
    }
    return item;
  }

  async create(data: Partial<ICouponRecord>) {
    logger.info('CouponRecord', 'Tạo voucher mới', { title: data.title, type: data.voucherType });
    try {
      // Với personal voucher, ownedBy = recipientRole ngay khi tạo
      if (data.voucherType === 'personal' && data.recipientRole && !data.ownedBy) {
        data.ownedBy = data.recipientRole;
      }
      const item = await CouponRecord.create(data);
      logger.success('CouponRecord', 'Tạo voucher thành công', { id: item._id });
      return item;
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((v: any) => v.message);
        throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Claim a grab-type voucher. Only valid if voucherType === 'grab' and ownedBy is null.
   */
  async claim(id: string, claimerRole: AppRole) {
    logger.info('CouponRecord', 'Claim voucher nhanh tay', { id, claimerRole });
    const item = await CouponRecord.findById(id);
    if (!item) throw new Error('NOT_FOUND');
    if (item.voucherType !== 'grab') throw new Error('NOT_GRAB_TYPE');
    if (item.ownedBy) throw new Error('ALREADY_CLAIMED');
    if (item.isUsed) throw new Error('ALREADY_USED');

    item.ownedBy = claimerRole;
    await item.save();

    logger.success('CouponRecord', `${claimerRole} đã nhận voucher nhanh tay`, { title: item.title });
    return item;
  }

  async use(id: string) {
    logger.info('CouponRecord', 'Sử dụng voucher', { id });
    const item = await CouponRecord.findById(id);
    if (!item) throw new Error('NOT_FOUND');
    if (item.isUsed) throw new Error('ALREADY_USED');

    item.isUsed = true;
    await item.save();

    logger.success('CouponRecord', `Voucher "${item.title}" đã được dùng`);
    await notificationService.sendDiscord(
      '🎉 Voucher vừa được sử dụng!',
      `Voucher: **${item.title}**\nLoại: ${item.voucherType}\nChuẩn bị thực hiện lời hứa nhé! ❤️`,
      15844367,
    );
    return item;
  }

  async delete(id: string) {
    logger.info('CouponRecord', 'Xóa voucher', { id });
    const item = await CouponRecord.findById(id);
    if (!item) throw new Error('NOT_FOUND');
    await item.deleteOne();
    logger.success('CouponRecord', 'Đã xóa voucher', { title: item.title });
    return true;
  }
}

export default new CouponRecordService();
