import DeepTalkQuestion, { IDeepTalkQuestion } from '../models/DeepTalkQuestion';
import JournalEntry, { IJournalEntry } from '../models/JournalEntry';
import notificationService from './notificationService';
import logger from '../utils/logger';

class DeepTalkService {
    // --- Questions ---

    async getAllQuestions(): Promise<IDeepTalkQuestion[]> {
        logger.info('DeepTalk', 'Lấy danh sách câu hỏi');
        const questions = await DeepTalkQuestion.find().sort({ createdAt: -1 });
        logger.success('DeepTalk', `Trả về ${questions.length} câu hỏi`);
        return questions;
    }

    async createQuestion(data: { content: string; isAiGenerated?: boolean }): Promise<IDeepTalkQuestion> {
        logger.info('DeepTalk', 'Tạo câu hỏi mới', { content: data.content.substring(0, 40) });
        try {
            const question = await DeepTalkQuestion.create(data);
            logger.success('DeepTalk', 'Tạo câu hỏi thành công', { id: question._id });

            await notificationService.sendDiscord(
                '💬 Câu hỏi Deep Talk mới!',
                `"${question.content}"${data.isAiGenerated ? '\n✨ _AI sinh_' : ''}`,
                6736942
            );

            return question;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                logger.error('DeepTalk', 'Lỗi validation khi tạo câu hỏi', messages);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async answerQuestion(
        id: string,
        role: 'boyfriend' | 'girlfriend',
        answerData: { text?: string; isInPerson?: boolean }
    ): Promise<IDeepTalkQuestion> {
        logger.info('DeepTalk', 'Trả lời câu hỏi', { id, role });
        const question = await DeepTalkQuestion.findById(id);
        if (!question) {
            logger.warn('DeepTalk', 'Không tìm thấy câu hỏi', { id });
            throw new Error('NOT_FOUND');
        }

        if (answerData.isInPerson) {
            question.answers[role].isInPerson = true;
            question.answers[role].text = undefined;
        } else if (answerData.text) {
            question.answers[role].text = answerData.text;
            question.answers[role].isInPerson = false;
        }
        question.answers[role].answeredAt = new Date();
        question.markModified('answers');
        await question.save();

        logger.success('DeepTalk', 'Đã lưu câu trả lời', { role, isInPerson: answerData.isInPerson });
        return question;
    }

    async deleteQuestion(id: string): Promise<boolean> {
        logger.info('DeepTalk', 'Xóa câu hỏi', { id });
        const question = await DeepTalkQuestion.findById(id);
        if (!question) {
            logger.warn('DeepTalk', 'Không tìm thấy câu hỏi để xóa', { id });
            throw new Error('NOT_FOUND');
        }
        await question.deleteOne();
        logger.success('DeepTalk', 'Đã xóa câu hỏi');
        return true;
    }

    // --- Journal ---

    async getAllJournalEntries(): Promise<IJournalEntry[]> {
        logger.info('DeepTalk', 'Lấy nhật ký cảm xúc');
        const entries = await JournalEntry.find().sort({ createdAt: -1 });
        logger.success('DeepTalk', `Trả về ${entries.length} nhật ký`);
        return entries;
    }

    async createJournalEntry(data: { content: string; createdBy: 'boyfriend' | 'girlfriend' }): Promise<IJournalEntry> {
        logger.info('DeepTalk', 'Tạo nhật ký mới', { createdBy: data.createdBy });
        try {
            const entry = await JournalEntry.create(data);
            logger.success('DeepTalk', 'Tạo nhật ký thành công', { id: entry._id });

            await notificationService.sendDiscord(
                '📔 Nhật ký cảm xúc mới!',
                `_${data.createdBy === 'boyfriend' ? 'Được' : 'Ni'}_ vừa chia sẻ:\n"${data.content}"`,
                15277667
            );

            return entry;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async deleteJournalEntry(id: string): Promise<boolean> {
        logger.info('DeepTalk', 'Xóa nhật ký', { id });
        const entry = await JournalEntry.findById(id);
        if (!entry) {
            logger.warn('DeepTalk', 'Không tìm thấy nhật ký để xóa', { id });
            throw new Error('NOT_FOUND');
        }
        await entry.deleteOne();
        logger.success('DeepTalk', 'Đã xóa nhật ký');
        return true;
    }
}

export default new DeepTalkService();
