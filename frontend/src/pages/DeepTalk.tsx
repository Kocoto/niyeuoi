import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, Trash2, Loader2, X, Send, MessageCircleHeart } from 'lucide-react';
import ContextualEmptyState from '../components/ContextualEmptyState';
import PersonBadge from '../components/PersonBadge';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import api from '../api/api';
import { ROLE_NAME, isRole, type Role } from '../constants/roles';

interface IAnswer {
  text?: string;
  isInPerson?: boolean;
  answeredAt?: string;
}

interface IDeepTalkQuestion {
  _id: string;
  content: string;
  isAiGenerated: boolean;
  answers: {
    boyfriend: IAnswer;
    girlfriend: IAnswer;
  };
  createdAt: string;
}

interface IJournalEntry {
  _id: string;
  content: string;
  createdBy?: Role;
  createdAt: string;
}

type DeepTalkTab = 'pending' | 'answered' | 'journal';
type AnswerState = 'waiting' | 'answered' | 'inPerson';

const ROLE_ORDER: Role[] = ['girlfriend', 'boyfriend'];
const EMPTY_ANSWER: IAnswer = { isInPerson: false };
const STATUS_TONE: Record<AnswerState, string> = {
  waiting: 'bg-amber-50 text-amber-700',
  answered: 'bg-emerald-50 text-emerald-700',
  inPerson: 'bg-sky-50 text-sky-700',
};

const getAnswer = (q: IDeepTalkQuestion, r: Role): IAnswer => q.answers?.[r] ?? EMPTY_ANSWER;

const getAnswerState = (answer?: IAnswer): AnswerState => {
  if (answer?.isInPerson) return 'inPerson';
  if (answer?.text) return 'answered';
  return 'waiting';
};

const hasAnswered = (q: IDeepTalkQuestion, r: Role) => getAnswerState(getAnswer(q, r)) !== 'waiting';

const isQuestionComplete = (q: IDeepTalkQuestion) => ROLE_ORDER.every(role => hasAnswered(q, role));

const getAnswerStateLabel = (answer?: IAnswer): string => {
  const state = getAnswerState(answer);
  if (state === 'inPerson') return 'Đã nói ngoài đời';
  if (state === 'answered') return 'Đã trả lời';
  return 'Đang mở';
};

const getQuestionSummary = (q: IDeepTalkQuestion): string => {
  const waitingRoles = ROLE_ORDER.filter(currentRole => !hasAnswered(q, currentRole));
  if (waitingRoles.length === 0) {
    return ROLE_ORDER.every(currentRole => getAnswerState(getAnswer(q, currentRole)) === 'inPerson')
      ? 'Cả hai đã nói ngoài đời'
      : 'Cả hai đã có câu trả lời';
  }
  if (waitingRoles.length === ROLE_ORDER.length) return 'Cả hai đang để mở câu này';
  return `Đang mở cho ${waitingRoles.map(waitingRole => ROLE_NAME[waitingRole]).join(' và ')}`;
};

const getJournalAuthor = (createdBy?: Role): Role | null => (isRole(createdBy) ? createdBy : null);

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days === 1) return 'hôm qua';
  return `${days} ngày trước`;
}

const DeepTalk: React.FC = () => {
  const { role } = useAuth();
  const { toast, confirm } = useUI();

  const [activeTab, setActiveTab] = useState<DeepTalkTab>('pending');

  // Questions state
  const [questions, setQuestions] = useState<IDeepTalkQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [detailQuestion, setDetailQuestion] = useState<IDeepTalkQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [answerSubmitting, setAnswerSubmitting] = useState(false);

  // Journal state
  const [journalEntries, setJournalEntries] = useState<IJournalEntry[]>([]);
  const [journalLoading, setJournalLoading] = useState(true);
  const [showAddJournal, setShowAddJournal] = useState(false);
  const [newJournalText, setNewJournalText] = useState('');
  const [addingJournal, setAddingJournal] = useState(false);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await api.get('/deeptalk/questions');
      setQuestions(res.data.data ?? []);
    } catch {
      toast('Không tải được câu hỏi!', 'error');
    } finally {
      setQuestionsLoading(false);
    }
  }, [toast]);

  const fetchJournal = useCallback(async () => {
    try {
      const res = await api.get('/deeptalk/journal');
      setJournalEntries(res.data.data ?? []);
    } catch {
      toast('Không tải được nhật ký!', 'error');
    } finally {
      setJournalLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchQuestions();
    fetchJournal();
  }, [fetchJournal, fetchQuestions]);

  const handleAiGenerate = async () => {
    setAiLoading(true);
    try {
      await api.post('/deeptalk/questions/generate');
      await fetchQuestions();
      toast('AI vừa tạo câu hỏi mới! 💬', 'success');
    } catch {
      toast('AI đang bận, thử lại sau nhé!', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    setAddingQuestion(true);
    try {
      await api.post('/deeptalk/questions', { content: newQuestionText.trim() });
      setShowAddQuestion(false);
      setNewQuestionText('');
      await fetchQuestions();
      toast('Đã thêm câu hỏi!', 'success');
    } catch {
      toast('Không thêm được câu hỏi!', 'error');
    } finally {
      setAddingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!await confirm('Xóa câu hỏi này nhé?')) return;
    try {
      await api.delete(`/deeptalk/questions/${id}`);
      if (detailQuestion?._id === id) setDetailQuestion(null);
      await fetchQuestions();
      toast('Đã xóa câu hỏi', 'success');
    } catch {
      toast('Không xóa được!', 'error');
    }
  };

  const handleAnswerText = async () => {
    if (!detailQuestion || !answerText.trim()) return;
    setAnswerSubmitting(true);
    try {
      const res = await api.put(`/deeptalk/questions/${detailQuestion._id}/answer`, { role, text: answerText.trim() });
      setDetailQuestion(res.data.data);
      setAnswerText('');
      await fetchQuestions();
      toast('Đã lưu câu trả lời! ✍️', 'success');
    } catch {
      toast('Không lưu được!', 'error');
    } finally {
      setAnswerSubmitting(false);
    }
  };

  const handleAnswerInPerson = async () => {
    if (!detailQuestion) return;
    setAnswerSubmitting(true);
    try {
      const res = await api.put(`/deeptalk/questions/${detailQuestion._id}/answer`, { role, isInPerson: true });
      setDetailQuestion(res.data.data);
      await fetchQuestions();
      toast('Đã đánh dấu đã nói ngoài đời! 🗣️', 'success');
    } catch {
      toast('Không lưu được!', 'error');
    } finally {
      setAnswerSubmitting(false);
    }
  };

  const handleAddJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJournalText.trim()) return;
    setAddingJournal(true);
    try {
      await api.post('/deeptalk/journal', { content: newJournalText.trim(), createdBy: role });
      setShowAddJournal(false);
      setNewJournalText('');
      await fetchJournal();
      toast('Đã chia sẻ cảm xúc! 📔', 'success');
    } catch {
      toast('Không lưu được!', 'error');
    } finally {
      setAddingJournal(false);
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (!await confirm('Xóa nhật ký này nhé?')) return;
    try {
      await api.delete(`/deeptalk/journal/${id}`);
      await fetchJournal();
    } catch {
      toast('Không xóa được!', 'error');
    }
  };

  const pendingQuestions = useMemo(() => questions.filter(question => !isQuestionComplete(question)), [questions]);
  const answeredQuestions = useMemo(() => questions.filter(question => isQuestionComplete(question)), [questions]);
  const visibleQuestions = activeTab === 'pending' ? pendingQuestions : answeredQuestions;
  const unansweredCount = pendingQuestions.filter(question => !hasAnswered(question, role)).length;
  const answeredEmptyAction = pendingQuestions.length > 0
    ? { label: 'Mở các câu đang mở', onClick: () => setActiveTab('pending'), variant: 'secondary' as const }
    : { label: 'Thêm câu hỏi đầu tiên', onClick: () => setShowAddQuestion(true) };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 rounded-[2rem] border border-rose-100 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircleHeart size={24} className="text-primary" />
          <h1 className="text-2xl font-black text-gray-800">Trò chuyện sâu</h1>
        </div>
        <p className="text-sm text-gray-500">Nhìn là biết ai đã trả lời, ai còn một phần đang mở, và nhật ký riêng là của ai.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PersonBadge role={role} prefix="Bạn đang tiếp tục với vai trò" />
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${unansweredCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {unansweredCount > 0 ? `${ROLE_NAME[role]} còn ${unansweredCount} câu đang mở` : `${ROLE_NAME[role]} đang tạm khép các câu đang mở`}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'pending' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
        >
          💬 Đang mở
          {pendingQuestions.length > 0 && (
            <span className="bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {pendingQuestions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('answered')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'answered' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
        >
          ✍️ Đã trả lời
          {answeredQuestions.length > 0 && (
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {answeredQuestions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'journal' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
        >
          📔 Nhật ký
          {journalEntries.length > 0 && (
            <span className="bg-gray-300 text-gray-600 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {journalEntries.length}
            </span>
          )}
        </button>
      </div>

      {/* ===== QUESTIONS TABS ===== */}
      {activeTab !== 'journal' && (
        <>
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={handleAiGenerate}
              disabled={aiLoading}
              className="flex items-center gap-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold text-xs px-3 py-2 rounded-xl transition-all disabled:opacity-60"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              AI gợi ý
            </button>
            <button
              onClick={() => setShowAddQuestion(true)}
              className="btn-add !p-2"
            >
              <Plus size={18} />
            </button>
          </div>

          {questionsLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={28} /></div>
          ) : visibleQuestions.length === 0 ? (
            activeTab === 'pending' ? (
              <ContextualEmptyState
                icon={<MessageCircleHeart size={18} />}
                title="Hiện chưa có câu nào đang mở cho cả hai"
                description="Deep Talk giữ những câu cần thời gian để Ni và Được nhìn là biết phía nào đã trả lời và phía nào còn một phần ở phía trước."
                action={{ label: 'Thêm câu hỏi đầu tiên', onClick: () => setShowAddQuestion(true) }}
              />
            ) : (
              <ContextualEmptyState
                icon={<Sparkles size={18} />}
                title="Chưa có câu nào được cả hai giữ trọn"
                description="Khi cả Ni và Được đều có câu trả lời hoặc đã nói ngoài đời, câu hỏi sẽ ở lại đây để hai người nhìn lại nhịp đã đi qua."
                action={answeredEmptyAction}
              />
            )
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {visibleQuestions.map(q => (
                  <motion.div
                    key={q._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => { setDetailQuestion(q); setAnswerText(''); }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-pink-200 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {q.isAiGenerated && (
                            <span className="text-[9px] font-bold bg-purple-100 text-purple-500 px-1.5 py-0.5 rounded-full">✨ Gợi ý AI</span>
                          )}
                          <span className="text-[11px] font-medium text-gray-400">{getQuestionSummary(q)}</span>
                          <span className="text-[11px] text-gray-300">•</span>
                          <span className="text-[11px] text-gray-400">{formatRelativeTime(q.createdAt)}</span>
                        </div>
                        <p className="text-gray-800 font-semibold leading-snug">{q.content}</p>
                        <div className="grid gap-2 mt-3">
                          {ROLE_ORDER.map(currentRole => (
                            <div key={currentRole} className="flex items-center justify-between gap-3 rounded-2xl bg-[#fcfafb] px-3 py-3">
                              <PersonBadge role={currentRole} showIcon={false} />
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_TONE[getAnswerState(getAnswer(q, currentRole))]}`}>
                                {getAnswerStateLabel(getAnswer(q, currentRole))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {role === 'boyfriend' && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteQuestion(q._id); }}
                          className="p-2 text-gray-300 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-all rounded-xl shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* ===== JOURNAL TAB ===== */}
      {activeTab === 'journal' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowAddJournal(true)} className="btn-add !p-2">
              <Plus size={18} />
            </button>
          </div>

          {journalLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={28} /></div>
          ) : journalEntries.length === 0 ? (
            <ContextualEmptyState
              icon={<Send size={18} />}
              title="Chưa có dòng nào được giữ lại sau các cuộc trò chuyện"
              description="Nhật ký này dành cho những điều Ni hoặc Được muốn ghi thêm sau khi nghĩ tiếp, để cảm xúc không chỉ nằm trong một câu trả lời ngắn."
              action={{ label: 'Viết một dòng đầu tiên', onClick: () => setShowAddJournal(true) }}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {journalEntries.map(entry => {
                  const author = getJournalAuthor(entry.createdBy);

                  return (
                    <motion.div
                      key={entry._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {author ? (
                              <PersonBadge role={author} prefix="Nhật ký của" />
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-600 ring-1 ring-stone-200">
                                Bản ghi cũ chưa rõ người viết
                              </span>
                            )}
                            <span className="text-[11px] text-gray-400">{formatRelativeTime(entry.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 leading-relaxed text-sm">{entry.content}</p>
                        </div>
                        {role === 'boyfriend' && (
                          <button
                            onClick={() => handleDeleteJournal(entry._id)}
                            className="p-2 text-gray-300 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-all rounded-xl shrink-0"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* ===== QUESTION DETAIL MODAL ===== */}
      <AnimatePresence>
        {detailQuestion && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailQuestion(null)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl shadow-2xl p-6 max-w-lg mx-auto max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-2 flex-wrap">
                  {detailQuestion.isAiGenerated && (
                    <span className="text-[9px] font-bold bg-purple-100 text-purple-500 px-1.5 py-0.5 rounded-full">✨ Gợi ý AI</span>
                  )}
                  <span className="text-[11px] font-medium text-gray-400">{getQuestionSummary(detailQuestion)}</span>
                </div>
                <button onClick={() => setDetailQuestion(null)} className="p-1.5 text-gray-400 hover:text-gray-600 shrink-0">
                  <X size={18} />
                </button>
              </div>

              <p className="text-lg font-bold text-gray-800 leading-snug mb-6">{detailQuestion.content}</p>

              {/* Both answers */}
              <div className="flex flex-col gap-3 mb-6">
                {ROLE_ORDER.map(currentRole => {
                  const answer = getAnswer(detailQuestion, currentRole);
                  const answerState = getAnswerState(answer);

                  return (
                    <div key={currentRole} className={`rounded-2xl p-4 ${currentRole === 'boyfriend' ? 'bg-blue-50' : 'bg-pink-50'}`}>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <PersonBadge role={currentRole} prefix="Phần của" />
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_TONE[answerState]}`}>
                          {getAnswerStateLabel(answer)}
                        </span>
                      </div>
                      {answerState === 'inPerson' ? (
                        <p className="text-sm text-gray-600 font-medium">Hai người đã nói câu này ngoài đời rồi.</p>
                      ) : answer.text ? (
                        <p className="text-sm text-gray-700 leading-relaxed">{answer.text}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Đang chờ phần này được trả lời.</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Answer controls */}
              {!hasAnswered(detailQuestion, role) ? (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-bold text-gray-500 mb-3">Bạn đang trả lời với vai trò:</p>
                  <PersonBadge role={role} prefix="Đang là" className="mb-3" />
                  <textarea
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    placeholder={`Viết phần của ${ROLE_NAME[role]}...`}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-primary transition-colors mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAnswerText}
                      disabled={!answerText.trim() || answerSubmitting}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold text-sm py-2.5 rounded-xl transition-all disabled:opacity-50"
                    >
                      {answerSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Gửi câu trả lời
                    </button>
                    <button
                      onClick={handleAnswerInPerson}
                      disabled={answerSubmitting}
                      className="flex items-center gap-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold text-sm px-3 py-2.5 rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      🗣️ Nói ngoài đời
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
                  Phần của {ROLE_NAME[role]} đã được lưu rồi ✓
                </p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== ADD QUESTION MODAL ===== */}
      <AnimatePresence>
        {showAddQuestion && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddQuestion(false)} className="fixed inset-0 bg-black/40 z-50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl shadow-2xl p-6 max-w-lg mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-800">Thêm câu hỏi 💬</h2>
                <button onClick={() => setShowAddQuestion(false)} className="p-1.5 text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <form onSubmit={handleAddQuestion}>
                <textarea
                  value={newQuestionText}
                  onChange={e => setNewQuestionText(e.target.value)}
                  placeholder="Nhập câu hỏi muốn cùng nhau trả lời..."
                  rows={3}
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-primary transition-colors mb-4"
                />
                <button
                  type="submit"
                  disabled={!newQuestionText.trim() || addingQuestion}
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {addingQuestion ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Thêm câu hỏi'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== ADD JOURNAL MODAL ===== */}
      <AnimatePresence>
        {showAddJournal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddJournal(false)} className="fixed inset-0 bg-black/40 z-50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl shadow-2xl p-6 max-w-lg mx-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-800">Chia sẻ cảm xúc 📔</h2>
                <button onClick={() => setShowAddJournal(false)} className="p-1.5 text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <form onSubmit={handleAddJournal}>
                <PersonBadge role={role} prefix="Bạn đang ghi với vai trò" className="mb-4" />
                <textarea
                  value={newJournalText}
                  onChange={e => setNewJournalText(e.target.value)}
                  placeholder="Bạn đang cảm thấy thế nào? (1-2 câu thôi nhé...)"
                  rows={3}
                  maxLength={500}
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-primary transition-colors mb-1"
                />
                <p className="text-xs text-right text-gray-300 mb-4">{newJournalText.length}/500</p>
                <button
                  type="submit"
                  disabled={!newJournalText.trim() || addingJournal}
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {addingJournal ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Chia sẻ'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeepTalk;
