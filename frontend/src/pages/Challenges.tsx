import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/api';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  HeartHandshake,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
  X,
  type LucideIcon,
} from 'lucide-react';
import PersonBadge from '../components/PersonBadge';
import { ROLE_NAME, isRole, type Role } from '../constants/roles';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

type Difficulty = 'Dễ' | 'Trung bình' | 'Khó';
type ChallengeTarget = Role | 'both';
type ChallengeSectionKey = 'together' | 'for_girlfriend' | 'for_boyfriend' | 'legacy';

interface IChallenge {
  _id: string;
  title: string;
  description: string;
  points: number;
  isCompleted: boolean;
  difficulty: Difficulty;
  isAiGenerated?: boolean;
  createdBy?: Role;
  forWhom?: ChallengeTarget;
  createdAt?: string;
}

type ChallengeFormState = {
  title: string;
  description: string;
  points: number;
  difficulty: Difficulty;
  forWhom: ChallengeTarget;
};

const DIFFICULTY_ORDER: Difficulty[] = ['Dễ', 'Trung bình', 'Khó'];

const DIFFICULTY_META: Record<Difficulty, { tone: string; helper: string }> = {
  'Dễ': {
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
    helper: 'Một điều nhẹ nhàng có thể làm ngay trong tuần này.',
  },
  'Trung bình': {
    tone: 'bg-amber-50 text-amber-700 ring-amber-200/80',
    helper: 'Cần chủ động hơn một chút, nhưng vẫn vừa sức với nhịp sống hiện tại.',
  },
  'Khó': {
    tone: 'bg-rose-50 text-rose-700 ring-rose-200/80',
    helper: 'Một điều cần nhiều thời gian hoặc nhiều dũng khí hơn để đi tới cùng.',
  },
};

const SECTION_META: Record<
  ChallengeSectionKey,
  {
    title: string;
    description: string;
    emptyTitle: string;
    emptyBody: string;
    cta?: string;
    tone: string;
    icon: LucideIcon;
    defaultTarget?: ChallengeTarget;
  }
> = {
  together: {
    title: 'Cùng nhau',
    description: 'Những điều hai bạn đi qua cùng nhau, không phải để tích điểm mà để giữ nhịp gần nhau hơn.',
    emptyTitle: 'Chưa có challenge nào dành cho cả hai',
    emptyBody: 'Khi muốn tạo một điều nho nhỏ để cùng làm trong tuần, hãy bắt đầu từ đây.',
    cta: 'Tạo challenge cùng nhau',
    tone: 'bg-violet-50 text-violet-700 ring-violet-200/80',
    icon: HeartHandshake,
    defaultTarget: 'both',
  },
  for_girlfriend: {
    title: 'Được dành cho Ni',
    description: 'Những điều Được khởi xướng riêng để Ni cảm thấy được để ý, được nhớ, và được quan tâm rõ ràng hơn.',
    emptyTitle: 'Chưa có challenge nào theo hướng Được dành cho Ni',
    emptyBody: 'Khi một điều riêng cho Ni được mở ra, nó sẽ nằm ở đây thay vì lẫn vào một danh sách chung chung.',
    cta: 'Mở một điều cho Ni',
    tone: 'bg-pink-50 text-pink-700 ring-pink-200/80',
    icon: Sparkles,
    defaultTarget: 'girlfriend',
  },
  for_boyfriend: {
    title: 'Ni dành cho Được',
    description: 'Những điều Ni mở ra riêng cho Được, để challenge mang nghĩa chăm chút cho nhau chứ không chỉ là nhiệm vụ.',
    emptyTitle: 'Chưa có challenge nào theo hướng Ni dành cho Được',
    emptyBody: 'Khi có một challenge riêng cho Được, phần này sẽ giữ nó thật rõ thay vì để trôi trong nhóm chung.',
    cta: 'Mở một điều cho Được',
    tone: 'bg-sky-50 text-sky-700 ring-sky-200/80',
    icon: Sparkles,
    defaultTarget: 'boyfriend',
  },
  legacy: {
    title: 'Đang giữ từ trước',
    description: 'Những record cũ chưa rõ ai khởi xướng hoặc dành cho ai vẫn được giữ an toàn ở đây để bổ sung nghĩa dần dần.',
    emptyTitle: 'Không còn record cũ nào chưa rõ hướng',
    emptyBody: 'Khi dữ liệu cũ được bổ sung lại ý nghĩa, phần này sẽ tự thu gọn.',
    tone: 'bg-slate-100 text-slate-700 ring-slate-200',
    icon: Sparkles,
  },
};

const isChallengeTarget = (value: unknown): value is ChallengeTarget =>
  value === 'boyfriend' || value === 'girlfriend' || value === 'both';

const resolveChallengeCreator = (createdBy?: Role): Role | null => (isRole(createdBy) ? createdBy : null);

const resolveChallengeTarget = (target?: ChallengeTarget): ChallengeTarget | null => (isChallengeTarget(target) ? target : null);

const createInitialForm = (target: ChallengeTarget = 'both'): ChallengeFormState => ({
  title: '',
  description: '',
  points: 10,
  difficulty: 'Dễ',
  forWhom: target,
});

const getChallengeSection = (challenge: IChallenge): ChallengeSectionKey => {
  const target = resolveChallengeTarget(challenge.forWhom);
  if (target === 'both') return 'together';
  if (target === 'girlfriend') return 'for_girlfriend';
  if (target === 'boyfriend') return 'for_boyfriend';
  return 'legacy';
};

const getDirectionLabel = (challenge: IChallenge) => {
  const creator = resolveChallengeCreator(challenge.createdBy);
  const target = resolveChallengeTarget(challenge.forWhom);

  if (target === 'both') return 'Cùng nhau';
  if (creator && target) return `${ROLE_NAME[creator]} dành cho ${ROLE_NAME[target]}`;
  if (target) return `Dành cho ${ROLE_NAME[target]}`;
  if (creator) return `Khởi xướng bởi ${ROLE_NAME[creator]}`;
  return 'Đang giữ từ trước';
};

const getFallbackDescription = (challenge: IChallenge) => {
  const sectionKey = getChallengeSection(challenge);
  if (sectionKey === 'together') return 'Một challenge được giữ cho cả hai, để khi mở ra là biết đây là điều mình có thể đi cùng nhau.';
  if (sectionKey === 'for_girlfriend' || sectionKey === 'for_boyfriend') {
    return 'Một challenge riêng cho một người trong hai bạn, để sự quan tâm không bị chìm vào danh sách chung.';
  }
  return 'Một challenge cũ vẫn đang được giữ an toàn ở đây, dù chưa đủ metadata để biết rõ hướng của nó.';
};

const sortChallenges = (items: IChallenge[]) =>
  [...items].sort((first, second) => {
    const completionDelta = Number(first.isCompleted) - Number(second.isCompleted);
    if (completionDelta !== 0) return completionDelta;
    return new Date(second.createdAt ?? 0).getTime() - new Date(first.createdAt ?? 0).getTime();
  });

const Challenges: React.FC = () => {
  const [challenges, setChallenges] = useState<IChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detailChallenge, setDetailChallenge] = useState<IChallenge | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState<ChallengeFormState>(createInitialForm());

  const { role } = useAuth();
  const { toast, confirm } = useUI();

  const oppositeRole: Role = role === 'boyfriend' ? 'girlfriend' : 'boyfriend';

  const resetForm = useCallback((target: ChallengeTarget = 'both') => {
    setFormData(createInitialForm(target));
    setEditingId(null);
    setIsEditing(false);
  }, []);

  const openCreateModal = (target: ChallengeTarget = 'both') => {
    resetForm(target);
    setShowModal(true);
  };

  const closeFormModal = () => {
    setShowModal(false);
    resetForm();
  };

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await api.get('/challenges');
      const data: IChallenge[] = res.data.data ?? [];
      setChallenges(data);
      setDetailChallenge((current) => (current ? data.find((challenge) => challenge._id === current._id) ?? null : null));
    } catch {
      console.error('Lỗi khi tải challenge');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const canManageChallenge = (challenge: IChallenge) => {
    const creator = resolveChallengeCreator(challenge.createdBy);
    return !creator || creator === role;
  };

  const canCreateForSection = (sectionKey: ChallengeSectionKey) => {
    if (sectionKey === 'together') return true;
    if (sectionKey === 'for_girlfriend') return role === 'boyfriend';
    if (sectionKey === 'for_boyfriend') return role === 'girlfriend';
    return false;
  };

  const handleEdit = (challenge: IChallenge) => {
    setFormData({
      title: challenge.title,
      description: challenge.description || '',
      points: challenge.points || 0,
      difficulty: challenge.difficulty || 'Dễ',
      forWhom: resolveChallengeTarget(challenge.forWhom) ?? 'both',
    });
    setEditingId(challenge._id);
    setIsEditing(true);
    setDetailChallenge(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = { ...formData, description: formData.description.trim() };

    try {
      if (isEditing && editingId) {
        await api.put(`/challenges/${editingId}`, payload);
      } else {
        await api.post('/challenges', payload);
      }

      closeFormModal();
      await fetchChallenges();
    } catch {
      toast('Lỗi khi lưu challenge!', 'error');
    }
  };

  const toggleComplete = async (challenge: IChallenge) => {
    try {
      await api.put(`/challenges/${challenge._id}`, { isCompleted: !challenge.isCompleted });
      await fetchChallenges();
    } catch {
      toast('Lỗi cập nhật trạng thái challenge!', 'error');
    }
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);

    try {
      await api.post('/challenges/generate');
      await fetchChallenges();
      toast('AI vừa gợi ý một challenge cùng nhau mới.', 'success');
    } catch {
      toast('AI chưa gợi ý được challenge mới, thử lại sau nhé!', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const deleteChallenge = async (challenge: IChallenge) => {
    if (!await confirm('Xóa challenge này nhé?')) return;

    try {
      await api.delete(`/challenges/${challenge._id}`);
      setDetailChallenge((current) => (current?._id === challenge._id ? null : current));
      await fetchChallenges();
    } catch {
      toast('Không xóa được challenge này!', 'error');
    }
  };

  const sections = {
    together: sortChallenges(challenges.filter((challenge) => getChallengeSection(challenge) === 'together')),
    for_girlfriend: sortChallenges(challenges.filter((challenge) => getChallengeSection(challenge) === 'for_girlfriend')),
    for_boyfriend: sortChallenges(challenges.filter((challenge) => getChallengeSection(challenge) === 'for_boyfriend')),
    legacy: sortChallenges(challenges.filter((challenge) => getChallengeSection(challenge) === 'legacy')),
  };

  const openCount = challenges.filter((challenge) => !challenge.isCompleted).length;
  const completedCount = challenges.filter((challenge) => challenge.isCompleted).length;
  const dedicatedCount = sections.for_girlfriend.length + sections.for_boyfriend.length;
  const pointsUnlocked = challenges.reduce((total, challenge) => total + (challenge.isCompleted ? challenge.points : 0), 0);

  const directionOptions: Array<{ value: ChallengeTarget; title: string; description: string }> = [
    {
      value: 'both',
      title: 'Cùng nhau',
      description: 'Dùng khi đây là điều cả hai có thể cùng trải qua trong tuần này.',
    },
    {
      value: oppositeRole,
      title: `${ROLE_NAME[role]} dành cho ${ROLE_NAME[oppositeRole]}`,
      description: 'Dùng khi bạn muốn mở một challenge riêng để người kia cảm thấy được quan tâm rõ hơn.',
    },
  ];

  const renderDirectionBadge = (challenge: IChallenge) => {
    const sectionKey = getChallengeSection(challenge);
    const meta = SECTION_META[sectionKey];

    return (
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${meta.tone}`}>
        <meta.icon size={12} />
        {getDirectionLabel(challenge)}
      </span>
    );
  };

  const renderChallengeCard = (challenge: IChallenge) => {
    const creator = resolveChallengeCreator(challenge.createdBy);
    const target = resolveChallengeTarget(challenge.forWhom);
    const difficultyMeta = DIFFICULTY_META[challenge.difficulty];
    const canManage = canManageChallenge(challenge);

    return (
      <motion.article
        key={challenge._id}
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-[1.75rem] border p-4 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.25)] transition md:p-5 ${
          challenge.isCompleted
            ? 'border-emerald-100 bg-emerald-50/50'
            : 'border-white/70 bg-white/90 ring-1 ring-slate-100'
        }`}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => toggleComplete(challenge)}
            className={`mt-0.5 rounded-full p-1 transition ${
              challenge.isCompleted ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-300 hover:text-slate-600'
            }`}
            aria-label={challenge.isCompleted ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}
          >
            {challenge.isCompleted ? <CheckCircle2 size={28} /> : <Circle size={28} />}
          </button>

          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setDetailChallenge(challenge)}>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
                  challenge.isCompleted
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/80'
                    : 'bg-slate-100 text-slate-600 ring-slate-200'
                }`}
              >
                {challenge.isCompleted ? 'Đã khép lại' : 'Đang mở'}
              </span>
              {renderDirectionBadge(challenge)}
              {challenge.isAiGenerated ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 ring-1 ring-violet-200/80">
                  <Wand2 size={12} />
                  AI gợi ý
                </span>
              ) : null}
            </div>

            <h3 className={`mt-3 text-xl font-black tracking-tight ${challenge.isCompleted ? 'text-emerald-900/80 line-through' : 'text-slate-900'}`}>
              {challenge.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{challenge.description?.trim() || getFallbackDescription(challenge)}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {creator ? (
                <PersonBadge role={creator} prefix="Khởi xướng bởi" showIcon={false} />
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  Record cũ chưa rõ ai khởi xướng
                </span>
              )}

              {target === 'both' ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 ring-1 ring-violet-200/80">
                  <HeartHandshake size={12} />
                  Dành cho cả hai
                </span>
              ) : target ? (
                <PersonBadge role={target} prefix="Dành cho" showIcon={false} />
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                  Chưa rõ dành cho ai
                </span>
              )}

              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${difficultyMeta.tone}`}>
                {challenge.difficulty}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200/80">
                Nhịp thưởng {challenge.points}
              </span>
            </div>
          </div>

          {canManage ? (
            <div className="flex shrink-0 gap-1">
              <button onClick={() => handleEdit(challenge)} className="rounded-2xl p-2.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Chỉnh challenge">
                <Pencil size={17} />
              </button>
              <button onClick={() => deleteChallenge(challenge)} className="rounded-2xl p-2.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" aria-label="Xóa challenge">
                <Trash2 size={17} />
              </button>
            </div>
          ) : null}
        </div>
      </motion.article>
    );
  };

  const renderEmptyState = (sectionKey: ChallengeSectionKey) => {
    const meta = SECTION_META[sectionKey];
    const canCreate = canCreateForSection(sectionKey);

    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white/75 p-5 shadow-sm">
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${meta.tone}`}>
          <meta.icon size={12} />
          {meta.title}
        </div>
        <h3 className="mt-4 text-lg font-black tracking-tight text-slate-900">{meta.emptyTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{meta.emptyBody}</p>
        {canCreate && meta.defaultTarget ? (
          <button onClick={() => openCreateModal(meta.defaultTarget)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 active:scale-[0.98]">
            <Plus size={15} />
            {meta.cta}
          </button>
        ) : null}
      </div>
    );
  };

  const renderSection = (sectionKey: ChallengeSectionKey) => {
    const meta = SECTION_META[sectionKey];
    const items = sections[sectionKey];
    const Icon = meta.icon;
    const canCreate = canCreateForSection(sectionKey);

    return (
      <motion.section key={sectionKey} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${meta.tone}`}>
                <Icon size={18} />
              </span>
              {meta.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{meta.description}</p>
          </div>

          {canCreate && meta.defaultTarget ? (
            <button onClick={() => openCreateModal(meta.defaultTarget)} className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 md:inline-flex">
              <Plus size={15} />
              {meta.cta}
            </button>
          ) : null}
        </div>

        {items.length === 0 ? renderEmptyState(sectionKey) : <div className="space-y-3">{items.map((challenge) => renderChallengeCard(challenge))}</div>}
      </motion.section>
    );
  };

  const visibleSections: ChallengeSectionKey[] = ['together', 'for_girlfriend', 'for_boyfriend'];
  if (sections.legacy.length > 0) {
    visibleSections.push('legacy');
  }

  const summaryCards = [
    { label: 'Đang mở', value: openCount, body: 'Những điều vẫn đang ở phía trước.' },
    { label: 'Đã khép lại', value: completedCount, body: 'Những điều đã đi tới cùng.' },
    { label: 'Cùng nhau', value: sections.together.length, body: 'Challenge dành cho cả hai.' },
    { label: 'Dành riêng', value: dedicatedCount, body: `Nhịp thưởng đã mở: ${pointsUnlocked}` },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 md:py-8 md:pb-8">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-5 shadow-[0_30px_100px_-55px_rgba(245,158,11,0.35)] md:p-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-amber-700 ring-1 ring-amber-100">
                <Sparkles size={12} />
                Challenges
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-[2.7rem]">
                Những điều để gần nhau hơn, không phải nhiệm vụ để kiếm điểm
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-[15px]">
                Màn này giữ những điều hai bạn cùng làm hoặc dành cho nhau. Điểm và độ khó vẫn còn ở đây nếu cần,
                nhưng chúng chỉ là chi tiết phụ sau ý nghĩa thật của challenge.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={handleAiGenerate} disabled={aiLoading} className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-bold text-violet-700 transition hover:-translate-y-0.5 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60">
                {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                AI gợi ý challenge cùng nhau
              </button>
              <button onClick={() => openCreateModal('both')} className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-slate-800 active:scale-[0.98]">
                <Plus size={16} />
                Tạo challenge mới
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PersonBadge role={role} prefix="Đang xem với vai" variant="solid" />
            <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-white/70">
              <HeartHandshake size={15} className="text-amber-500" />
              Challenge riêng cho nhau sẽ được tách rõ khỏi challenge cùng nhau.
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {summaryCards.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 shadow-sm ring-1 ring-white/70">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
                <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">{item.value}</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="mt-8 space-y-10">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-amber-500" size={40} />
          </div>
        ) : challenges.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-amber-200 bg-white/85 p-6 text-center shadow-sm md:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200">
              <HeartHandshake size={24} />
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Chưa có challenge nào được mở ra</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Challenges là nơi giữ những điều cả hai cùng làm hoặc một người dành riêng cho người kia. Hiện tại phần
              này chưa có gì, nên bước đầu tiên hợp lý nhất là mở một điều nhẹ nhàng để cùng đi qua trong tuần này.
            </p>
            <button onClick={() => openCreateModal('both')} className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 active:scale-[0.98]">
              <Plus size={16} />
              Tạo challenge đầu tiên
            </button>
          </section>
        ) : (
          visibleSections.map((sectionKey) => renderSection(sectionKey))
        )}
      </div>

      <AnimatePresence>
        {detailChallenge && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailChallenge(null)} className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 28, scale: 0.98 }} className="relative z-[101] w-full max-w-xl rounded-t-[2rem] bg-white p-5 shadow-2xl md:rounded-[2rem] md:p-7">
              <button onClick={() => setDetailChallenge(null)} className="absolute right-5 top-5 rounded-2xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng">
                <X size={20} />
              </button>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {renderDirectionBadge(detailChallenge)}
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${DIFFICULTY_META[detailChallenge.difficulty].tone}`}>
                    {detailChallenge.difficulty}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200/80">
                    Nhịp thưởng {detailChallenge.points}
                  </span>
                </div>

                <div>
                  <h2 className={`text-2xl font-black tracking-tight ${detailChallenge.isCompleted ? 'text-emerald-900/80 line-through' : 'text-slate-900'}`}>
                    {detailChallenge.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {detailChallenge.description?.trim() || getFallbackDescription(detailChallenge)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {resolveChallengeCreator(detailChallenge.createdBy) ? (
                    <PersonBadge role={detailChallenge.createdBy as Role} prefix="Khởi xướng bởi" showIcon={false} />
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                      Record cũ chưa rõ ai khởi xướng
                    </span>
                  )}

                  {resolveChallengeTarget(detailChallenge.forWhom) === 'both' ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 ring-1 ring-violet-200/80">
                      <HeartHandshake size={12} />
                      Dành cho cả hai
                    </span>
                  ) : resolveChallengeTarget(detailChallenge.forWhom) ? (
                    <PersonBadge role={detailChallenge.forWhom as Role} prefix="Dành cho" showIcon={false} />
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                      Chưa rõ dành cho ai
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button onClick={() => { toggleComplete(detailChallenge); setDetailChallenge(null); }} className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${detailChallenge.isCompleted ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800'}`}>
                    {detailChallenge.isCompleted ? <Circle size={16} /> : <CheckCircle2 size={16} />}
                    {detailChallenge.isCompleted ? 'Bỏ đánh dấu hoàn thành' : 'Khép lại challenge này'}
                  </button>

                  {canManageChallenge(detailChallenge) ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(detailChallenge)} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                        <Pencil size={16} />
                        Chỉnh
                      </button>
                      <button onClick={() => deleteChallenge(detailChallenge)} className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50">
                        <Trash2 size={16} />
                        Xóa
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeFormModal} className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 28, scale: 0.98 }} className="relative z-[101] w-full max-w-xl rounded-t-[2rem] bg-white p-5 shadow-2xl md:rounded-[2rem] md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-amber-700 ring-1 ring-amber-200">
                    <Sparkles size={12} />
                    {isEditing ? 'Chỉnh challenge' : 'Challenge mới'}
                  </span>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                    {isEditing ? 'Làm rõ hướng của challenge này' : 'Mở một challenge có nghĩa thật sự'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Chọn xem đây là điều cả hai cùng làm hay điều bạn dành riêng cho người kia, rồi thêm mức độ nếu cần.
                  </p>
                </div>

                <button onClick={closeFormModal} className="rounded-2xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng">
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4">
                <PersonBadge role={role} prefix={isEditing ? 'Bạn đang chỉnh với vai' : 'Bạn đang mở với vai'} />
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Tên challenge</label>
                  <input required value={formData.title} onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value }))} placeholder="Ví dụ: cùng ăn tối không điện thoại, viết một điều cảm ơn..." className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-100" />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Hướng challenge</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {directionOptions.map((option) => {
                      const active = formData.forWhom === option.value;
                      return (
                        <button key={option.title} type="button" onClick={() => setFormData((current) => ({ ...current, forWhom: option.value }))} className={`rounded-[1.25rem] border px-4 py-4 text-left transition ${active ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'}`}>
                          <span className="block text-sm font-black">{option.title}</span>
                          <span className={`mt-2 block text-sm leading-6 ${active ? 'text-white/80' : 'text-slate-500'}`}>{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Ý nghĩa hoặc gợi ý thực hiện</label>
                  <textarea rows={4} value={formData.description} onChange={(e) => setFormData((current) => ({ ...current, description: e.target.value }))} placeholder="Viết ngắn để lần sau nhìn vào là hiểu đây là điều gì và vì sao nó đáng làm." className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-6 outline-none transition focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-100" />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700">Mức độ</label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {DIFFICULTY_ORDER.map((difficulty) => {
                      const active = formData.difficulty === difficulty;
                      const meta = DIFFICULTY_META[difficulty];
                      return (
                        <button key={difficulty} type="button" onClick={() => setFormData((current) => ({ ...current, difficulty }))} className={`rounded-[1.25rem] border px-4 py-4 text-left transition ${active ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'}`}>
                          <span className="block text-sm font-black">{difficulty}</span>
                          <span className={`mt-2 block text-sm leading-6 ${active ? 'text-white/80' : 'text-slate-500'}`}>{meta.helper}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Nhịp thưởng nếu có</label>
                  <input type="number" min={0} value={formData.points} onChange={(e) => setFormData((current) => ({ ...current, points: parseInt(e.target.value, 10) || 0 }))} className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-100" />
                  <p className="text-xs leading-5 text-slate-500">
                    Phần này chỉ là chi tiết phụ để ghi nhớ “thưởng nếu có”, không nên lấn át ý nghĩa chính của challenge.
                  </p>
                </div>

                <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 active:scale-[0.98]">
                  <Sparkles size={16} />
                  {isEditing ? 'Cập nhật challenge này' : 'Lưu challenge này'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Challenges;
