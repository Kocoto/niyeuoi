import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, Trash2, Loader2, X, Send, MessageCircleHeart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import api from '../api/api';
import { ROLE_NAME, type Role } from '../constants/roles';

interface IAnswer {
  text?: string;
  isInPerson: boolean;
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
  createdBy: Role;
  createdAt: string;
}

const hasAnswered = (q: IDeepTalkQuestion, r: Role) =>
  q.answers[r].isInPerson || !!q.answers[r].text;

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

  const [activeTab, setActiveTab] = useState<'questions' | 'journal'>('questions');

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

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/deeptalk/questions');
      setQuestions(res.data.data);
    } catch {
      toast('Không tải được câu hỏi!', 'error');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const fetchJournal = async () => {
    try {
      const res = await api.get('/deeptalk/journal');
      setJournalEntries(res.data.data);
    } catch {
      toast('Không tải được nhật ký!', 'error');
    } finally {
      setJournalLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchJournal();
  }, []);

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

  const unansweredCount = questions.filter(q => !hasAnswered(q, role)).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircleHeart size={24} className="text-primary" />
          <h1 className="text-2xl font-black text-gray-800">Trò chuyện sâu</h1>
        </div>
        <p className="text-sm text-gray-400">Hiểu nhau hơn qua từng câu hỏi và cảm xúc... 💕</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1 mb-6">
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'questions' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
        >
          💬 Câu hỏi
          {unansweredCount > 0 && (
            <span className="bg-primary text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {unansweredCount}
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

      {/* ===== QUESTIONS TAB ===== */}
      {activeTab === 'questions' && (
        <>
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={handleAiGenerate}
              disabled={aiLoading}
              className="flex items-center gap-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold text-xs px-3 py-2 rounded-xl transition-all disabled:opacity-60"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              AI sinh
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
          ) : questions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 font-medium">Chưa có câu hỏi nào.</p>
              <p className="text-gray-300 text-sm mt-1">Để AI sinh hoặc tự thêm nhé! 💬</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {questions.map(q => (
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
                            <span className="text-[9px] font-bold bg-purple-100 text-purple-500 px-1.5 py-0.5 rounded-full">✨ AI</span>
                          )}
                        </div>
                        <p className="text-gray-800 font-semibold leading-snug">{q.content}</p>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {(['boyfriend', 'girlfriend'] as const).map(r => (
                            <span
                              key={r}
                              className={`text-[11px] font-bold px-2 py-1 rounded-lg ${hasAnswered(q, r) ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                            >
                              {ROLE_NAME[r]}: {hasAnswered(q, r) ? (q.answers[r].isInPerson ? '🗣️' : '✍️') : '...'}
                            </span>
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
            <div className="text-center py-16">
              <p className="text-gray-400 font-medium">Chưa có nhật ký nào.</p>
              <p className="text-gray-300 text-sm mt-1">Chia sẻ cảm xúc của bạn đi! 📔</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {journalEntries.map(entry => (
                  <motion.div
                    key={entry._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${entry.createdBy === 'boyfriend' ? 'bg-blue-400' : 'bg-pink-400'}`}>
                        {ROLE_NAME[entry.createdBy][0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-700">{ROLE_NAME[entry.createdBy]}</span>
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
                ))}
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
                    <span className="text-[9px] font-bold bg-purple-100 text-purple-500 px-1.5 py-0.5 rounded-full">✨ AI</span>
                  )}
                </div>
                <button onClick={() => setDetailQuestion(null)} className="p-1.5 text-gray-400 hover:text-gray-600 shrink-0">
                  <X size={18} />
                </button>
              </div>

              <p className="text-lg font-bold text-gray-800 leading-snug mb-6">{detailQuestion.content}</p>

              {/* Both answers */}
              <div className="flex flex-col gap-3 mb-6">
                {(['boyfriend', 'girlfriend'] as const).map(r => (
                  <div key={r} className={`rounded-2xl p-4 ${r === 'boyfriend' ? 'bg-blue-50' : 'bg-pink-50'}`}>
                    <p className={`text-xs font-bold mb-2 ${r === 'boyfriend' ? 'text-blue-500' : 'text-pink-500'}`}>
                      {ROLE_NAME[r]}
                    </p>
                    {detailQuestion.answers[r].isInPerson ? (
                      <p className="text-sm text-gray-600 font-medium">🗣️ Đã nói ngoài đời rồi</p>
                    ) : detailQuestion.answers[r].text ? (
                      <p className="text-sm text-gray-700 leading-relaxed">{detailQuestion.answers[r].text}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Chưa trả lời...</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Answer controls */}
              {!hasAnswered(detailQuestion, role) ? (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-bold text-gray-500 mb-3">Câu trả lời của {ROLE_NAME[role]}:</p>
                  <textarea
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    placeholder="Viết câu trả lời của bạn..."
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
                  Bạn đã trả lời câu hỏi này ✓
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
