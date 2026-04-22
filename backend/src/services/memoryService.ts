import Memory, {
    IMemory,
    MEMORY_RESURFACING_REASON_VALUES,
    type MemoryResurfacingReason
} from '../models/Memory';
import notificationService from './notificationService';
import logger from '../utils/logger';

type MemoryResurfacingCandidate = {
    memory: IMemory;
    reason: MemoryResurfacingReason;
    label: string;
    detail: string;
    yearsAgo?: number;
};

const DAY_MS = 86400000;

const isMemoryResurfacingReason = (value: unknown): value is MemoryResurfacingReason =>
    typeof value === 'string' && MEMORY_RESURFACING_REASON_VALUES.includes(value as MemoryResurfacingReason);

const hasSameMonthDay = (left: Date, right: Date) =>
    left.getMonth() === right.getMonth() && left.getDate() === right.getDate();

const getDaysSince = (value?: Date) => {
    if (!value) return Number.POSITIVE_INFINITY;
    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) return Number.POSITIVE_INFINITY;
    return Math.floor((Date.now() - timestamp) / DAY_MS);
};

const getYearsAgo = (memoryDate: Date, referenceDate: Date) => {
    let yearsAgo = referenceDate.getFullYear() - memoryDate.getFullYear();

    if (
        referenceDate.getMonth() < memoryDate.getMonth() ||
        (referenceDate.getMonth() === memoryDate.getMonth() && referenceDate.getDate() < memoryDate.getDate())
    ) {
        yearsAgo -= 1;
    }

    return yearsAgo;
};

const buildMemoryResurfacingCandidate = (
    memory: IMemory,
    reason: MemoryResurfacingReason,
    referenceDate: Date
): MemoryResurfacingCandidate => {
    if (reason === 'anniversary_day') {
        const yearsAgo = getYearsAgo(new Date(memory.date), referenceDate);
        return {
            memory,
            reason,
            yearsAgo,
            label: yearsAgo > 0 ? `${yearsAgo} năm trước cũng là ngày này` : 'Đúng ngày này năm trước',
            detail: `Kỷ niệm "${memory.title}" đã đi cùng hai người tới đúng ngày này một lần nữa.`
        };
    }

    return {
        memory,
        reason,
        label: 'Một kỷ niệm đáng giữ lại đang nổi lên',
        detail: `Kỷ niệm "${memory.title}" đang được ghim để có thể quay lại đúng lúc, không cần tìm giữa cả một dòng dài.`
    };
};

class MemoryService {
    async getAllMemories() {
        logger.info('Memory', 'Lấy danh sách kỷ niệm');
        const memories = await Memory.find().sort({ date: -1 });
        logger.success('Memory', `Trả về ${memories.length} kỷ niệm`);
        return memories;
    }

    async getMemoryById(id: string) {
        logger.info('Memory', 'Lấy kỷ niệm theo ID', { id });
        const memory = await Memory.findById(id);
        if (!memory) {
            logger.warn('Memory', 'Không tìm thấy kỷ niệm', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Memory', 'Tìm thấy kỷ niệm', { title: memory.title });
        return memory;
    }

    async createMemory(data: Partial<IMemory>) {
        logger.info('Memory', 'Tạo kỷ niệm mới', { title: data.title, mood: data.mood, date: data.date });
        try {
            const memory = await Memory.create(data);
            logger.success('Memory', 'Tạo kỷ niệm thành công', { id: memory._id, title: memory.title });

            logger.info('Memory', 'Gửi thông báo Discord...');
            await notificationService.sendDiscord(
                '📸 Kỷ niệm mới vừa được ghi dấu!',
                `Tiêu đề: **${memory.title}**\nCảm xúc: **${memory.mood}**\nHãy vào xem ngay nhé! ❤️`,
                15277667
            );
            logger.success('Memory', 'Đã gửi thông báo Discord');

            return memory;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((val: any) => val.message);
                logger.error('Memory', 'Lỗi validation khi tạo kỷ niệm', messages);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            logger.error('Memory', 'Lỗi khi tạo kỷ niệm', error);
            throw error;
        }
    }

    async updateMemory(id: string, data: Partial<IMemory>) {
        logger.info('Memory', 'Cập nhật kỷ niệm', { id, fields: Object.keys(data) });
        const memory = await Memory.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
        if (!memory) {
            logger.warn('Memory', 'Không tìm thấy kỷ niệm để cập nhật', { id });
            throw new Error('NOT_FOUND');
        }
        logger.success('Memory', 'Cập nhật kỷ niệm thành công', { title: memory.title });
        return memory;
    }

    async deleteMemory(id: string) {
        logger.info('Memory', 'Xóa kỷ niệm', { id });
        const memory = await Memory.findById(id);
        if (!memory) {
            logger.warn('Memory', 'Không tìm thấy kỷ niệm để xóa', { id });
            throw new Error('NOT_FOUND');
        }
        await memory.deleteOne();
        logger.success('Memory', 'Đã xóa kỷ niệm', { title: memory.title });
        return true;
    }

    async getResurfacingCandidates(limit = 3, referenceDate = new Date()) {
        logger.info('Memory', 'Lấy danh sách memory resurfacing', { limit, referenceDate });

        const memories = await Memory.find().sort({ date: -1 });
        const anniversaryCandidates: MemoryResurfacingCandidate[] = [];
        const pinnedCandidates: MemoryResurfacingCandidate[] = [];

        for (const memory of memories) {
            const memoryDate = new Date(memory.date);
            const ageInDays = Math.floor((referenceDate.getTime() - memoryDate.getTime()) / DAY_MS);
            if (Number.isNaN(memoryDate.getTime()) || ageInDays < 30) {
                continue;
            }

            const daysSinceSurfaced = getDaysSince(memory.resurfacing?.lastSurfacedAt);

            if (hasSameMonthDay(memoryDate, referenceDate) && daysSinceSurfaced >= 7) {
                anniversaryCandidates.push(buildMemoryResurfacingCandidate(memory, 'anniversary_day', referenceDate));
                continue;
            }

            if (memory.resurfacing?.isPinned && daysSinceSurfaced >= 30) {
                pinnedCandidates.push(buildMemoryResurfacingCandidate(memory, 'pinned_highlight', referenceDate));
            }
        }

        const items = [...anniversaryCandidates, ...pinnedCandidates].slice(0, limit);
        logger.success('Memory', `Trả về ${items.length} memory resurfacing`);
        return items;
    }

    async markMemoryResurfaced(id: string, reason: MemoryResurfacingReason) {
        if (!isMemoryResurfacingReason(reason)) {
            throw new Error('VALIDATION_ERROR: lý do resurfacing không hợp lệ');
        }

        logger.info('Memory', 'Đánh dấu memory đã được resurfacing', { id, reason });
        const memory = await Memory.findById(id);

        if (!memory) {
            logger.warn('Memory', 'Không tìm thấy kỷ niệm để đánh dấu resurfacing', { id });
            throw new Error('NOT_FOUND');
        }

        const currentCount = memory.resurfacing?.surfacedCount ?? 0;
        memory.resurfacing = {
            ...memory.resurfacing,
            lastSurfacedAt: new Date(),
            surfacedCount: currentCount + 1,
            lastReason: reason
        };
        memory.markModified('resurfacing');
        await memory.save();

        logger.success('Memory', 'Đã đánh dấu memory resurfacing', {
            id: memory._id,
            reason,
            surfacedCount: memory.resurfacing?.surfacedCount
        });
        return memory;
    }
}

export default new MemoryService();
