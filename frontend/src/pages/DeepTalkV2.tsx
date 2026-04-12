import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookHeart,
  CheckCircle2,
  Loader2,
  MessageCircleHeart,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import api from '../api/api';
import EmptyState from '../components/EmptyState';
import RolePill from '../components/RolePill';
import SheetDialog from '../components/SheetDialog';
import type { AppRole } from '../constants/appRoles';
import { ROLE_NAME } from '../constants/appRoles';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { formatRelativeTime } from '../utils/date';

type Answer = {
  text?: string;
  isInPerson: boolean;
  answeredAt?: string;
};

type DeepTalkQuestion = {
  _id: string;
  content: string;
  isAiGenerated: boolean;
  createdBy?: AppRole;
  answers: Record<AppRole, Answer>;
  createdAt?: string;
};

type JournalEntry = {
  _id: string;
  content: string;
  createdBy: AppRole;
  createdAt: string;
};

type QuestionTab = 'pending' | 'completed' | 'journal';

function hasAnswered(answer?: Answer) {
  return Boolean(answer?.isInPerson || answer?.text);
}

function getAnswerState(answer?: Answer) {
  if (answer?.isInPerson) return 'Đã nói ngoài đời';
  if (answer?.text) return 'Đã trả lời';
  return 'Đang chờ';
}

function getOverallState(question: DeepTalkQuestion) {
  const allAnswered = (['girlfriend', 'boyfriend'] as AppRole[]).every(role => hasAnswered(question.answers?.[role]));

  if (!allAnswered) return 'Đang chờ';
  if ((['girlfriend', 'boyfriend'] as AppRole[]).every(role => question.answers?.[role]?.isInPerson)) {
    return 'Đã nói ngoài đời';
  }

  return 'Đã trả lời';
}

const DeepTalkV2: React.FC = () => {
  const { role } = useAuth();
  const { toast, confirm } = useUI();

  const [activeTab, setActiveTab] = useState<QuestionTab>('pending');
  const [questions, setQuestions] = useState<DeepTalkQuestion[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [journalLoading, setJournalLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showAddJournal, setShowAddJournal] = useState(false);
  const [detailQuestion, setDetailQuestion] = useState<DeepTalkQuestion | null>(null);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newJournalText, setNewJournalText] = useState('');
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [addingJournal, setAddingJournal] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [answerSubmitting, setAnswerSubmitting] = useState(false);

  const fetchQuestions = async () => {
    try {
      const response = await api.get('/deeptalk/questions');
      setQuestions(response.data.data ?? []);
    } catch {
      toast('Chưa tải được câu hỏi trò chuyện sâu.', 'error');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const fetchJournal = async () => {
    try {
      const response = await api.get('/deeptalk/journal');
      setJournalEntries(response.data.data ?? []);
    } catch {
      toast('Chưa tải được nhật ký riêng.', 'error');
    } finally {
      setJournalLoading(false);
    }
  };

  useEffect(() => {
    void fetchQuestions();
    void fetchJournal();
  }, []);

  const pendingQuestions = useMemo(() => {
    return questions.filter(question => (['girlfriend', 'boyfriend'] as AppRole[]).some(person => !hasAnswered(question.answers?.[person])));
  }, [questions]);

  const completedQuestions = useMemo(() => {
    return questions.filter(question => (['girlfriend', 'boyfriend'] as AppRole[]).every(person => hasAnswered(question.answers?.[person])));
  }, [questions]);

  const visibleQuestions = activeTab === 'pending' ? pendingQuestions : completedQuestions;

  const unansweredCount = useMemo(() => {
    return pendingQuestions.filter(question => !hasAnswered(question.answers?.[role as AppRole])).length;
  }, [pendingQuestions, role]);

  const handleAiGenerate = async () => {
    setAiLoading(true);

    try {
      await api.post('/deeptalk/questions/generate');
      await fetchQuestions();
      toast('Đã thêm một gợi ý mới cho cuộc trò chuyện.', 'success');
    } catch {
      toast('Chưa tạo được câu hỏi từ AI lần này.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newQuestionText.trim()) return;

    setAddingQuestion(true);

    try {
      await api.post('/deeptalk/questions', { content: newQuestionText.trim(), createdBy: role });
      setNewQuestionText('');
      setShowAddQuestion(false);
      await fetchQuestions();
      toast('Đã đưa câu hỏi mới vào không gian chung.', 'success');
    } catch {
      toast('Chưa thêm được câu hỏi lần này.', 'error');
    } finally {
      setAddingQuestion(false);
    }
  };

  const handleAddJournal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newJournalText.trim()) return;

    setAddingJournal(true);

    try {
      await api.post('/deeptalk/journal', { content: newJournalText.trim(), createdBy: role });
      setNewJournalText('');
      setShowAddJournal(false);
      await fetchJournal();
      toast('Đã lưu một đoạn nhật ký riêng.', 'success');
    } catch {
      toast('Chưa lưu được nhật ký lần này.', 'error');
    } finally {
      setAddingJournal(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!await confirm('Bạn có muốn gỡ câu hỏi này khỏi danh sách không?')) return;

    try {
      await api.delete(`/deeptalk/questions/${id}`);
      if (detailQuestion?._id === id) {
        setDetailQuestion(null);
      }
      await fetchQuestions();
      toast('Đã gỡ câu hỏi khỏi luồng trò chuyện.', 'success');
    } catch {
      toast('Chưa gỡ được câu hỏi này.', 'error');
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (!await confirm('Bạn có muốn xoá đoạn nhật ký này không?')) return;

    try {
      await api.delete(`/deeptalk/journal/${id}`);
      await fetchJournal();
      toast('Đã xoá đoạn nhật ký.', 'success');
    } catch {
      toast('Chưa xoá được đoạn nhật ký này.', 'error');
    }
  };

  const handleAnswerText = async () => {
    if (!detailQuestion || !answerText.trim()) return;

    setAnswerSubmitting(true);

    try {
      const response = await api.put(`/deeptalk/questions/${detailQuestion._id}/answer`, {
        role,
        text: answerText.trim(),
      });
      setDetailQuestion(response.data.data);
      setAnswerText('');
      await fetchQuestions();
      toast('Đã lưu câu trả lời của bạn.', 'success');
    } catch {
      toast('Chưa lưu được câu trả lời lần này.', 'error');
    } finally {
      setAnswerSubmitting(false);
    }
  };

  const handleAnswerInPerson = async () => {
    if (!detailQuestion) return;

    setAnswerSubmitting(true);

    try {
      const response = await api.put(`/deeptalk/questions/${detailQuestion._id}/answer`, {
        role,
        isInPerson: true,
      });
      setDetailQuestion(response.data.data);
      await fetchQuestions();
      toast('Đã đánh dấu là hai bạn đã nói ngoài đời.', 'success');
    } catch {
      toast('Chưa cập nhật được trạng thái này.', 'error');
    } finally {
      setAnswerSubmitting(false);
    }
  };

  return (
    <div className="page-container space-y-4">
      <section className="surface-card-strong overflow-hidden p-5 md:p-7">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="section-label">Deep Talk</p>
            <h1 className="page-title mt-2">Trò chuyện sâu</h1>
            <p className="page-subtitle">
              Ở đây cần biết rõ ai đang nói, ai đang chờ, và điều gì đã thực sự được mang ra khỏi app để nói ngoài đời.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <RolePill role={role as AppRole} text={`Bạn đang ở góc ${ROLE_NAME[role as AppRole]}`} />
              <span className="chip bg-white/80 text-soft">{unansweredCount} điều đang chờ phía bạn</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <SummaryTile label="Đang chờ" value={`${pendingQuestions.length}`} hint="Những câu hỏi chưa đủ hai phía" />
            <SummaryTile label="Đã trả lời" value={`${completedQuestions.length}`} hint="Những câu chuyện đã khép lại trong app" />
            <SummaryTile label="Nhật ký riêng" value={`${journalEntries.length}`} hint="Những đoạn giữ lại cho từng người" />
          </div>
        </div>
      </section>

      <section className="surface-card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            <TabButton
              active={activeTab === 'pending'}
              label="Đang chờ"
              count={pendingQuestions.length}
              onClick={() => setActiveTab('pending')}
            />
            <TabButton
              active={activeTab === 'completed'}
              label="Đã trả lời"
              count={completedQuestions.length}
              onClick={() => setActiveTab('completed')}
            />
            <TabButton
              active={activeTab === 'journal'}
              label="Nhật ký riêng"
              count={journalEntries.length}
              onClick={() => setActiveTab('journal')}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {activeTab === 'journal' ? (
              <button type="button" onClick={() => setShowAddJournal(true)} className="btn-primary">
                <Plus size={16} />
                Viết nhật ký
              </button>
            ) : (
              <>
                <button type="button" onClick={handleAiGenerate} disabled={aiLoading} className="btn-secondary">
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Gợi ý từ AI
                </button>
                <button type="button" onClick={() => setShowAddQuestion(true)} className="btn-primary">
                  <Plus size={16} />
                  Thêm câu hỏi
                </button>
              </>
            )}
          </div>
        </div>

        {activeTab === 'journal' ? (
          <div className="mt-5">
            {journalLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : journalEntries.length === 0 ? (
              <EmptyState
                icon={<BookHeart size={18} />}
                title="Chưa có nhật ký riêng nào"
                description="Mỗi người có thể giữ lại một đoạn ngắn ở đây mà vẫn nhìn rõ đó là lời của ai."
                action={
                  <button type="button" onClick={() => setShowAddJournal(true)} className="btn-primary">
                    <Plus size={16} />
                    Viết đoạn đầu tiên
                  </button>
                }
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {journalEntries.map(entry => {
                  const canDelete = role === 'boyfriend' || entry.createdBy === role;

                  return (
                    <article key={entry._id} className="rounded-[1.5rem] bg-[#faf6f8] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <RolePill role={entry.createdBy} />
                          <p className="mt-3 text-sm leading-7 text-ink">{entry.content}</p>
                        </div>
                        {canDelete ? (
                          <button type="button" onClick={() => handleDeleteJournal(entry._id)} className="rounded-full p-2 text-soft transition hover:bg-white hover:text-rose-500">
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-3 text-xs font-bold text-soft">{formatRelativeTime(entry.createdAt)}</p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {questionsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : visibleQuestions.length === 0 ? (
              <EmptyState
                icon={<MessageCircleHeart size={18} />}
                title={activeTab === 'pending' ? 'Không còn câu hỏi nào đang chờ' : 'Chưa có câu hỏi nào hoàn thành'}
                description={
                  activeTab === 'pending'
                    ? 'Không gian này đang khá yên. Bạn có thể thêm một câu hỏi mới để tiếp tục kéo cuộc trò chuyện đi tới.'
                    : 'Khi cả hai đã trả lời đủ hoặc đã nói ngoài đời, câu hỏi sẽ chuyển sang đây.'
                }
                action={
                  activeTab === 'pending' ? (
                    <button type="button" onClick={() => setShowAddQuestion(true)} className="btn-primary">
                      <Plus size={16} />
                      Thêm câu hỏi
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <AnimatePresence>
                {visibleQuestions.map(question => {
                  const canDelete = role === 'boyfriend' || (question.createdBy ?? 'girlfriend') === role;

                  return (
                    <motion.button
                      key={question._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setDetailQuestion(question);
                        setAnswerText('');
                      }}
                      className="w-full rounded-[1.5rem] bg-[#faf6f8] p-4 text-left transition hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <RolePill role={(question.createdBy ?? 'girlfriend') as AppRole} text={`${ROLE_NAME[question.createdBy ?? 'girlfriend']} mang câu hỏi vào`} />
                            <span className="chip bg-white text-soft">{getOverallState(question)}</span>
                            {question.isAiGenerated ? <span className="chip bg-violet-50 text-violet-600">AI gợi ý</span> : null}
                          </div>

                          <p className="mt-3 text-base font-bold leading-7 text-ink">{question.content}</p>

                          <div className="mt-4 grid gap-2 md:grid-cols-2">
                            {(['girlfriend', 'boyfriend'] as AppRole[]).map(person => (
                              <StatusRow
                                key={`${question._id}-${person}`}
                                role={person}
                                state={getAnswerState(question.answers?.[person])}
                                detail={
                                  question.answers?.[person]?.text
                                    ? question.answers[person].text!
                                    : question.answers?.[person]?.isInPerson
                                      ? 'Hai bạn đã nói chuyện này ngoài đời.'
                                      : person === role
                                        ? 'Phía bạn vẫn chưa trả lời.'
                                        : `${ROLE_NAME[person]} vẫn chưa trả lời.`
                                }
                              />
                            ))}
                          </div>
                        </div>

                        {canDelete ? (
                          <button
                            type="button"
                            onClick={event => {
                              event.stopPropagation();
                              void handleDeleteQuestion(question._id);
                            }}
                            className="rounded-full p-2 text-soft transition hover:bg-white hover:text-rose-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        )}
      </section>

      <SheetDialog
        open={showAddQuestion}
        onClose={() => setShowAddQuestion(false)}
        title="Thêm một câu hỏi"
        subtitle="Câu hỏi này sẽ đi vào không gian chung và hiển thị rõ ai là người mang nó vào."
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAddQuestion(false)} className="btn-secondary flex-1 justify-center py-3">
              Để sau
            </button>
            <button type="submit" form="add-question-form" disabled={!newQuestionText.trim() || addingQuestion} className="btn-primary flex-1 justify-center py-3">
              {addingQuestion ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Lưu câu hỏi
            </button>
          </div>
        }
      >
        <form id="add-question-form" onSubmit={handleAddQuestion}>
          <textarea
            value={newQuestionText}
            onChange={event => setNewQuestionText(event.target.value)}
            rows={4}
            placeholder="Ví dụ: Có điều gì gần đây em muốn anh hiểu rõ hơn nhưng chưa nói thành lời?"
            className="form-input min-h-[148px] resize-none"
          />
        </form>
      </SheetDialog>

      <SheetDialog
        open={showAddJournal}
        onClose={() => setShowAddJournal(false)}
        title="Viết một đoạn nhật ký"
        subtitle="Nhật ký giữ rõ người viết, để không lẫn với câu trả lời chung của cả hai."
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAddJournal(false)} className="btn-secondary flex-1 justify-center py-3">
              Để sau
            </button>
            <button type="submit" form="add-journal-form" disabled={!newJournalText.trim() || addingJournal} className="btn-primary flex-1 justify-center py-3">
              {addingJournal ? <Loader2 size={16} className="animate-spin" /> : <BookHeart size={16} />}
              Lưu nhật ký
            </button>
          </div>
        }
      >
        <form id="add-journal-form" onSubmit={handleAddJournal}>
          <textarea
            value={newJournalText}
            onChange={event => setNewJournalText(event.target.value)}
            rows={5}
            maxLength={500}
            placeholder="Chỉ một đoạn vừa đủ để giữ lại điều bạn chưa muốn nói quá to."
            className="form-input min-h-[168px] resize-none"
          />
          <p className="mt-2 text-right text-xs text-soft">{newJournalText.length}/500 ký tự</p>
        </form>
      </SheetDialog>

      <SheetDialog
        open={Boolean(detailQuestion)}
        onClose={() => setDetailQuestion(null)}
        title="Chi tiết câu hỏi"
        subtitle={detailQuestion ? getOverallState(detailQuestion) : ''}
        headerSlot={
          detailQuestion ? (
            <div className="flex flex-wrap items-center gap-2">
              <RolePill role={(detailQuestion.createdBy ?? 'girlfriend') as AppRole} text={`${ROLE_NAME[detailQuestion.createdBy ?? 'girlfriend']} mang câu hỏi này vào`} />
              {detailQuestion.isAiGenerated ? <span className="chip bg-violet-50 text-violet-600">AI gợi ý</span> : null}
            </div>
          ) : null
        }
        footer={
          detailQuestion && !hasAnswered(detailQuestion.answers?.[role as AppRole]) ? (
            <div className="space-y-3">
              <textarea
                value={answerText}
                onChange={event => setAnswerText(event.target.value)}
                rows={4}
                placeholder={`Viết phần của ${ROLE_NAME[role as AppRole]} ở đây...`}
                className="form-input min-h-[148px] resize-none"
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleAnswerText}
                  disabled={!answerText.trim() || answerSubmitting}
                  className="btn-primary flex-1 justify-center py-3"
                >
                  {answerSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Gửi câu trả lời
                </button>
                <button type="button" onClick={handleAnswerInPerson} disabled={answerSubmitting} className="btn-secondary flex-1 justify-center py-3">
                  <CheckCircle2 size={16} />
                  Đã nói ngoài đời
                </button>
              </div>
            </div>
          ) : detailQuestion ? (
            <p className="text-sm leading-6 text-soft">
              Phần của {ROLE_NAME[role as AppRole]} đã có rồi. Bạn có thể quay lại danh sách để tiếp tục một câu hỏi khác đang chờ.
            </p>
          ) : null
        }
      >
        {detailQuestion ? (
          <div className="space-y-4">
            <div className="rounded-[1.5rem] bg-[#faf6f8] p-4">
              <p className="text-base font-bold leading-7 text-ink">{detailQuestion.content}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {(['girlfriend', 'boyfriend'] as AppRole[]).map(person => {
                const answer = detailQuestion.answers?.[person];

                return (
                  <article key={`${detailQuestion._id}-${person}`} className="rounded-[1.5rem] bg-[#faf6f8] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <RolePill role={person} />
                      <span className="chip bg-white text-soft">{getAnswerState(answer)}</span>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-soft">
                      {answer?.isInPerson
                        ? 'Hai bạn đã mang phần này ra để nói ngoài đời.'
                        : answer?.text
                          ? answer.text
                          : `${ROLE_NAME[person]} vẫn chưa để lại phần trả lời trong app.`}
                    </p>

                    {answer?.answeredAt ? <p className="mt-3 text-xs font-bold text-soft">{formatRelativeTime(answer.answeredAt)}</p> : null}
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}
      </SheetDialog>
    </div>
  );
};

const SummaryTile: React.FC<{ label: string; value: string; hint: string }> = ({ label, value, hint }) => (
  <div className="rounded-[1.4rem] bg-white/84 p-4 shadow-sm ring-1 ring-black/5">
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b292a6]">{label}</p>
    <p className="mt-2 text-xl font-black text-ink">{value}</p>
    <p className="mt-1 text-sm text-soft">{hint}</p>
  </div>
);

const TabButton: React.FC<{ active: boolean; label: string; count: number; onClick: () => void }> = ({
  active,
  label,
  count,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-4 py-2 text-sm font-bold transition ${active ? 'bg-rose-50 text-primary' : 'bg-[#faf6f8] text-soft'}`}
  >
    {label}
    <span className="ml-2 text-xs">{count}</span>
  </button>
);

const StatusRow: React.FC<{ role: AppRole; state: string; detail: string }> = ({ role, state, detail }) => (
  <div className="rounded-[1.2rem] bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
    <div className="flex items-center justify-between gap-3">
      <RolePill role={role} className="px-2.5 py-1" />
      <span className="text-xs font-bold text-soft">{state}</span>
    </div>
    <p className="mt-2 text-sm leading-6 text-soft">{detail}</p>
  </div>
);

export default DeepTalkV2;
