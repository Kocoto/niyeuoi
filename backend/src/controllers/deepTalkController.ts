import { Request, Response } from 'express';
import deepTalkService from '../services/deepTalkService';
import { generateDeepQuestion } from '../services/aiService';
import DeepTalkQuestion from '../models/DeepTalkQuestion';
import type { IJournalEntry } from '../models/JournalEntry';
import { getRequestAuthRole, isAuthRole, resolveCreatePayload } from '../utils/requestIdentity';

// --- Questions ---

export const getQuestions = async (_req: Request, res: Response) => {
    try {
        const questions = await deepTalkService.getAllQuestions();
        res.status(200).json({ success: true, count: questions.length, data: questions });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const createQuestion = async (req: Request, res: Response) => {
    try {
        const question = await deepTalkService.createQuestion(req.body);
        res.status(201).json({ success: true, data: question });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const deleteQuestion = async (req: Request, res: Response) => {
    try {
        await deepTalkService.deleteQuestion(req.params.id as string);
        res.status(200).json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy' });
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const generateAiQuestion = async (_req: Request, res: Response) => {
    try {
        const existing = await DeepTalkQuestion.find().select('content').lean();
        const existingContents = existing.map((q: any) => q.content);

        const data = await generateDeepQuestion(existingContents);
        if (!data) {
            return res.status(503).json({ success: false, error: 'AI không sinh được câu hỏi, thử lại sau nhé!' });
        }

        const question = await deepTalkService.createQuestion({ ...data, isAiGenerated: true });
        res.status(201).json({ success: true, data: question });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const answerQuestion = async (req: Request, res: Response) => {
    try {
        const sessionRole = getRequestAuthRole(req);
        const bodyRole = isAuthRole(req.body?.role) ? req.body.role : undefined;
        const role = sessionRole ?? bodyRole;
        const { text, isInPerson } = req.body;
        if (!role) {
            return res.status(400).json({ success: false, error: 'role không hợp lệ' });
        }
        const question = await deepTalkService.answerQuestion(req.params.id as string, role, { text, isInPerson });
        res.status(200).json({ success: true, data: question });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy' });
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

// --- Journal ---

export const getJournalEntries = async (_req: Request, res: Response) => {
    try {
        const entries = await deepTalkService.getAllJournalEntries();
        res.status(200).json({ success: true, count: entries.length, data: entries });
    } catch {
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const createJournalEntry = async (req: Request, res: Response) => {
    try {
        const payload = resolveCreatePayload<IJournalEntry>(req, req.body as Partial<IJournalEntry>);
        const entry = await deepTalkService.createJournalEntry(payload as { content: string; createdBy: 'boyfriend' | 'girlfriend' });
        res.status(201).json({ success: true, data: entry });
    } catch (err: any) {
        if (err.message?.startsWith('VALIDATION_ERROR')) {
            return res.status(400).json({ success: false, error: err.message.replace('VALIDATION_ERROR: ', '') });
        }
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};

export const deleteJournalEntry = async (req: Request, res: Response) => {
    try {
        await deepTalkService.deleteJournalEntry(req.params.id as string);
        res.status(200).json({ success: true, data: {} });
    } catch (err: any) {
        if (err.message === 'NOT_FOUND') return res.status(404).json({ success: false, error: 'Không tìm thấy' });
        res.status(500).json({ success: false, error: 'Lỗi máy chủ' });
    }
};
