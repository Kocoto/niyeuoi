import Letter, { ILetter } from '../models/Letter';
import type { AuthRole } from '../utils/authToken';
import logger from '../utils/logger';

class LetterService {
    async getAllLetters() {
        logger.info('Letter', 'Lấy danh sách lời muốn nói');
        const letters = await Letter.find().sort({ createdAt: -1 });
        logger.success('Letter', `Trả về ${letters.length} lời`);
        return letters;
    }

    async createLetter(data: Partial<ILetter>) {
        logger.info('Letter', 'Tạo lời muốn nói mới', { createdBy: data.createdBy });
        try {
            const letter = await Letter.create(data);
            logger.success('Letter', 'Tạo lời thành công', { id: letter._id, createdBy: letter.createdBy });
            return letter;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                logger.error('Letter', 'Lỗi validation', messages);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            logger.error('Letter', 'Lỗi khi tạo lời', error);
            throw error;
        }
    }

    async replyToLetter(id: string, reply: string, repliedBy: AuthRole) {
        logger.info('Letter', 'Trả lời lời muốn nói', { id, repliedBy });
        const letter = await Letter.findById(id);
        if (!letter) {
            logger.warn('Letter', 'Không tìm thấy lời để trả lời', { id });
            throw new Error('NOT_FOUND');
        }
        if (letter.reply) {
            throw new Error('ALREADY_REPLIED');
        }
        letter.reply = reply;
        letter.repliedBy = repliedBy;
        letter.repliedAt = new Date();
        await letter.save();
        logger.success('Letter', 'Đã trả lời thành công', { id });
        return letter;
    }

    async deleteLetter(id: string) {
        logger.info('Letter', 'Xóa lời muốn nói', { id });
        const letter = await Letter.findById(id);
        if (!letter) {
            logger.warn('Letter', 'Không tìm thấy lời để xóa', { id });
            throw new Error('NOT_FOUND');
        }
        await letter.deleteOne();
        logger.success('Letter', 'Đã xóa lời', { id });
        return true;
    }
}

export default new LetterService();
