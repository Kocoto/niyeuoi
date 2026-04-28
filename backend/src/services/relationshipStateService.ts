import Coupon, { type CouponParty } from '../models/Coupon';
import DeepTalkQuestion from '../models/DeepTalkQuestion';
import Event, { type EventTarget } from '../models/Event';
import Mood from '../models/Mood';
import Reward, { type RewardParty } from '../models/Reward';
import logger from '../utils/logger';
import type { AuthRole } from '../utils/authToken';

export const RELATIONSHIP_STATE_SIGNAL_TYPE_VALUES = [
    'mood_missing',
    'deeptalk_waiting',
    'event_upcoming',
    'coupon_waiting',
    'reward_open'
] as const;

export const RELATIONSHIP_STATE_URGENCY_VALUES = ['soft', 'soon', 'today'] as const;

export type RelationshipStateSignalType = (typeof RELATIONSHIP_STATE_SIGNAL_TYPE_VALUES)[number];
export type RelationshipStateUrgency = (typeof RELATIONSHIP_STATE_URGENCY_VALUES)[number];
export type RelationshipStateTarget = AuthRole | 'both';
export type RelationshipStateSourceType = 'mood' | 'deep_talk_question' | 'event' | 'coupon' | 'reward' | 'system';

export type RelationshipStateSignal = {
    id: string;
    type: RelationshipStateSignalType;
    title: string;
    detail: string;
    target: RelationshipStateTarget;
    urgency: RelationshipStateUrgency;
    source: {
        type: RelationshipStateSourceType;
        id?: string;
        label?: string;
        createdBy?: AuthRole | 'system';
    };
    cta?: {
        label: string;
        to: string;
    };
    createdAt?: string;
    dueAt?: string;
};

export type RelationshipStateTodayItem = {
    type: 'mood_checkin' | 'deeptalk_answered';
    label: string;
    at?: string;
    source: {
        type: 'mood' | 'deep_talk_question';
        id: string;
        label: string;
    };
};

export type RelationshipPersonState = {
    role: AuthRole;
    label: string;
    today: {
        hasMoodCheckIn: boolean;
        mood?: {
            id: string;
            value: string;
            at?: string;
        };
        actions: RelationshipStateTodayItem[];
        lastActiveAt?: string;
    };
    signals: RelationshipStateSignal[];
    summary: string;
};

export type RelationshipSharedState = {
    target: 'both';
    signals: RelationshipStateSignal[];
    nextStep?: RelationshipStateSignal;
    summary: string;
};

export type RelationshipState = {
    date: string;
    generatedAt: string;
    viewerRole?: AuthRole;
    people: Record<AuthRole, RelationshipPersonState>;
    shared: RelationshipSharedState;
    nextStep?: RelationshipStateSignal;
};

type RelationshipStateOptions = {
    date?: Date;
    viewerRole?: AuthRole;
};

type TimestampedDoc = {
    _id: unknown;
    createdAt?: Date;
    updatedAt?: Date;
};

type MoodStateDoc = TimestampedDoc & {
    mood: string;
    date?: Date;
    createdBy?: AuthRole;
};

type DeepTalkStateDoc = TimestampedDoc & {
    content: string;
    answers?: Record<AuthRole, { text?: string; isInPerson?: boolean; answeredAt?: Date }>;
};

type EventStateDoc = TimestampedDoc & {
    title: string;
    date: Date;
    description?: string;
    createdBy?: AuthRole;
    forWhom?: EventTarget;
};

type CouponStateDoc = TimestampedDoc & {
    title: string;
    description?: string;
    isUsed?: boolean;
    createdBy?: AuthRole | 'system';
    couponType?: string;
    receiverRole?: CouponParty;
    holderRole?: CouponParty;
    claimEndsAt?: Date;
};

type RewardStateDoc = TimestampedDoc & {
    title: string;
    description?: string;
    status: string;
    sourceType: string;
    sourceId: string;
    sourceLabel?: string;
    forWhom?: RewardParty;
    createdBy?: AuthRole | 'system';
    expiresAt?: Date;
};

type WeightedSignal = RelationshipStateSignal & {
    weight: number;
};

const ROLES: AuthRole[] = ['girlfriend', 'boyfriend'];
const ROLE_LABEL: Record<AuthRole, string> = {
    boyfriend: 'Được',
    girlfriend: 'Ni'
};

const TARGET_LABEL: Record<RelationshipStateTarget, string> = {
    boyfriend: 'Được',
    girlfriend: 'Ni',
    both: 'cả hai'
};

const UPCOMING_EVENT_WINDOW_DAYS = 7;
const ACTIVE_REWARD_STATUSES = ['pending', 'revealed'];

const isAuthRoleValue = (value: unknown): value is AuthRole =>
    value === 'boyfriend' || value === 'girlfriend';

const isTargetValue = (value: unknown): value is RelationshipStateTarget =>
    value === 'both' || isAuthRoleValue(value);

const toId = (value: unknown) => String(value);

const toIso = (date?: Date) => {
    if (!date) return undefined;
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const startOfDay = (value?: Date) => {
    const date = value ? new Date(value) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};

const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
};

const toDateKey = (date: Date) => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
].join('-');

const trimString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const isWithinRange = (value: Date | undefined, start: Date, end: Date) => {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date >= start && date < end;
};

const getDaysUntil = (date: Date, from: Date) => {
    const target = startOfDay(date);
    return Math.round((target.getTime() - from.getTime()) / 86400000);
};

const getDueCopy = (daysUntil: number) => {
    if (daysUntil <= 0) return 'hôm nay';
    if (daysUntil === 1) return 'ngày mai';
    return `còn ${daysUntil} ngày`;
};

const getLatestIso = (items: Array<string | undefined>) => {
    const latest = items
        .filter((value): value is string => Boolean(value))
        .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
    return latest;
};

const isAnswerDone = (answer?: { text?: string; isInPerson?: boolean }) =>
    Boolean(answer?.isInPerson || trimString(answer?.text));

const createSignal = (signal: RelationshipStateSignal, weight: number): WeightedSignal => ({
    ...signal,
    weight
});

const stripWeight = ({ weight: _weight, ...signal }: WeightedSignal): RelationshipStateSignal => signal;

const sortSignals = (signals: WeightedSignal[]) =>
    signals.sort((left, right) => {
        if (right.weight !== left.weight) return right.weight - left.weight;
        return new Date(right.dueAt ?? right.createdAt ?? 0).getTime() - new Date(left.dueAt ?? left.createdAt ?? 0).getTime();
    });

const getCouponTarget = (coupon: CouponStateDoc): RelationshipStateTarget => {
    if (coupon.holderRole === 'both' || coupon.receiverRole === 'both' || coupon.couponType === 'shared' || coupon.couponType === 'claimable') {
        return 'both';
    }

    if (isAuthRoleValue(coupon.holderRole)) return coupon.holderRole;
    if (isAuthRoleValue(coupon.receiverRole)) return coupon.receiverRole;
    return 'both';
};

const getRewardTarget = (reward: RewardStateDoc): RelationshipStateTarget =>
    isTargetValue(reward.forWhom) ? reward.forWhom : 'both';

const getRewardCta = (reward: RewardStateDoc) => {
    switch (reward.sourceType) {
        case 'challenge':
            return { label: 'Mở Challenges', to: '/challenges' };
        case 'deep_talk_question':
            return { label: 'Mở Deep Talk', to: '/deeptalk' };
        case 'mood':
            return { label: 'Mở Mood', to: '/mood' };
        case 'event':
            return { label: 'Mở Events', to: '/events' };
        case 'coupon':
            return { label: 'Mở ví voucher', to: '/coupons' };
        case 'memory':
            return { label: 'Mở Timeline', to: '/timeline' };
        default:
            return { label: 'Mở tiếp từ đây', to: '/' };
    }
};

const getPersonSummary = (label: string, hasMoodCheckIn: boolean, signalCount: number) => {
    if (hasMoodCheckIn && signalCount > 0) {
        return `Hôm nay của ${label} đã có một nhịp riêng, và vẫn còn vài điều nhỏ có thể mở tiếp.`;
    }

    if (hasMoodCheckIn) {
        return `Hôm nay của ${label} đang yên, đã có một check-in nhẹ.`;
    }

    if (signalCount > 0) {
        return `Hôm nay của ${label} còn mở cho một check-in nhẹ hoặc một bước đang chờ.`;
    }

    return `Hôm nay của ${label} còn trống, không sao cả; chỉ cần một nhịp nhỏ khi thấy hợp.`;
};

class RelationshipStateService {
    async getRelationshipState(options: RelationshipStateOptions = {}): Promise<RelationshipState> {
        const dayStart = startOfDay(options.date);
        const dayEnd = addDays(dayStart, 1);
        const eventWindowEnd = addDays(dayStart, UPCOMING_EVENT_WINDOW_DAYS);

        logger.info('RelationshipState', 'Lấy relationship state', {
            date: toDateKey(dayStart),
            viewerRole: options.viewerRole
        });

        const [
            moods,
            questions,
            events,
            coupons,
            rewards
        ] = await Promise.all([
            Mood.find({ date: { $gte: dayStart, $lt: dayEnd } })
                .sort({ date: -1, createdAt: -1 })
                .limit(12)
                .lean() as unknown as Promise<MoodStateDoc[]>,
            DeepTalkQuestion.find()
                .sort({ updatedAt: -1, createdAt: -1 })
                .limit(24)
                .lean() as unknown as Promise<DeepTalkStateDoc[]>,
            Event.find({ date: { $gte: dayStart, $lte: eventWindowEnd } })
                .sort({ date: 1 })
                .limit(8)
                .lean() as unknown as Promise<EventStateDoc[]>,
            Coupon.find({
                isUsed: false,
                $or: [
                    { claimEndsAt: { $exists: false } },
                    { claimEndsAt: { $gte: dayStart } }
                ]
            })
                .sort({ claimEndsAt: 1, createdAt: -1 })
                .limit(12)
                .lean() as unknown as Promise<CouponStateDoc[]>,
            Reward.find({ status: { $in: ACTIVE_REWARD_STATUSES } })
                .sort({ createdAt: -1 })
                .limit(8)
                .lean() as unknown as Promise<RewardStateDoc[]>
        ]);

        const moodByRole = new Map<AuthRole, MoodStateDoc>();
        moods.forEach((mood) => {
            if (isAuthRoleValue(mood.createdBy) && !moodByRole.has(mood.createdBy)) {
                moodByRole.set(mood.createdBy, mood);
            }
        });

        const actionsByRole: Record<AuthRole, RelationshipStateTodayItem[]> = {
            girlfriend: [],
            boyfriend: []
        };

        moodByRole.forEach((mood, role) => {
            actionsByRole[role].push({
                type: 'mood_checkin',
                label: `${ROLE_LABEL[role]} đã check-in mood`,
                at: toIso(mood.date ?? mood.createdAt),
                source: {
                    type: 'mood',
                    id: toId(mood._id),
                    label: mood.mood
                }
            });
        });

        questions.forEach((question) => {
            ROLES.forEach((role) => {
                const answer = question.answers?.[role];
                if (!isWithinRange(answer?.answeredAt, dayStart, dayEnd)) return;

                actionsByRole[role].push({
                    type: 'deeptalk_answered',
                    label: `${ROLE_LABEL[role]} đã trả lời một câu Deep Talk`,
                    at: toIso(answer?.answeredAt),
                    source: {
                        type: 'deep_talk_question',
                        id: toId(question._id),
                        label: question.content
                    }
                });
            });
        });

        const personSignals: Record<AuthRole, WeightedSignal[]> = {
            girlfriend: [],
            boyfriend: []
        };
        const sharedSignals: WeightedSignal[] = [];

        const addSignal = (signal: WeightedSignal) => {
            if (signal.target === 'both') {
                sharedSignals.push(signal);
                return;
            }

            personSignals[signal.target].push(signal);
        };

        ROLES.forEach((role) => {
            if (moodByRole.has(role)) return;

            addSignal(createSignal({
                id: `mood_missing:${role}:${toDateKey(dayStart)}`,
                type: 'mood_missing',
                title: `Một check-in nhẹ còn mở cho ${ROLE_LABEL[role]}`,
                detail: `Nếu ${ROLE_LABEL[role]} muốn, hôm nay vẫn còn một chỗ nhỏ để ghi lại cảm xúc. Không cần dài, chỉ cần đúng nhịp.`,
                target: role,
                urgency: 'soft',
                source: {
                    type: 'system',
                    label: 'daily_mood_open'
                },
                cta: {
                    label: 'Mở Mood',
                    to: '/mood'
                }
            }, 54));
        });

        const waitingDeepTalkByRole: Record<AuthRole, number> = {
            girlfriend: 0,
            boyfriend: 0
        };

        questions.forEach((question) => {
            ROLES.forEach((role) => {
                if (waitingDeepTalkByRole[role] >= 2) return;
                if (isAnswerDone(question.answers?.[role])) return;

                waitingDeepTalkByRole[role] += 1;
                addSignal(createSignal({
                    id: `deeptalk_waiting:${role}:${toId(question._id)}`,
                    type: 'deeptalk_waiting',
                    title: `Một câu Deep Talk đang mở cho ${ROLE_LABEL[role]}`,
                    detail: `"${question.content}" đang chờ một câu trả lời nhỏ hoặc một lần nói ngoài đời.`,
                    target: role,
                    urgency: 'soft',
                    source: {
                        type: 'deep_talk_question',
                        id: toId(question._id),
                        label: question.content
                    },
                    cta: {
                        label: 'Mở Deep Talk',
                        to: '/deeptalk'
                    },
                    createdAt: toIso(question.createdAt)
                }, 80));
            });
        });

        events.forEach((event) => {
            const target = isTargetValue(event.forWhom) ? event.forWhom : 'both';
            const daysUntil = getDaysUntil(event.date, dayStart);
            const when = getDueCopy(daysUntil);

            addSignal(createSignal({
                id: `event_upcoming:${target}:${toId(event._id)}`,
                type: 'event_upcoming',
                title: daysUntil <= 0 ? `Hôm nay có một ngày đã ghim cho ${TARGET_LABEL[target]}` : `Một ngày sắp tới dành cho ${TARGET_LABEL[target]}`,
                detail: `"${event.title}" ${when}. Mở Events nếu hai người muốn giữ lại ý nghĩa của ngày này.`,
                target,
                urgency: daysUntil <= 0 ? 'today' : 'soon',
                source: {
                    type: 'event',
                    id: toId(event._id),
                    label: event.title,
                    createdBy: isAuthRoleValue(event.createdBy) ? event.createdBy : undefined
                },
                cta: {
                    label: 'Mở Events',
                    to: '/events'
                },
                createdAt: toIso(event.createdAt),
                dueAt: toIso(event.date)
            }, daysUntil <= 0 ? 96 : 90 - daysUntil));
        });

        coupons.forEach((coupon) => {
            const target = getCouponTarget(coupon);
            const dueAt = toIso(coupon.claimEndsAt);
            const daysUntil = coupon.claimEndsAt ? getDaysUntil(coupon.claimEndsAt, dayStart) : undefined;
            const urgency: RelationshipStateUrgency = daysUntil !== undefined && daysUntil <= 1 ? 'today' : daysUntil !== undefined && daysUntil <= 3 ? 'soon' : 'soft';

            addSignal(createSignal({
                id: `coupon_waiting:${target}:${toId(coupon._id)}`,
                type: 'coupon_waiting',
                title: `Một voucher đang chờ ${TARGET_LABEL[target]}`,
                detail: coupon.description || coupon.title,
                target,
                urgency,
                source: {
                    type: 'coupon',
                    id: toId(coupon._id),
                    label: coupon.title,
                    createdBy: coupon.createdBy
                },
                cta: {
                    label: 'Mở ví voucher',
                    to: '/coupons'
                },
                createdAt: toIso(coupon.createdAt),
                dueAt
            }, urgency === 'today' ? 78 : urgency === 'soon' ? 72 : 64));
        });

        rewards.forEach((reward) => {
            const target = getRewardTarget(reward);

            addSignal(createSignal({
                id: `reward_open:${target}:${toId(reward._id)}`,
                type: 'reward_open',
                title: reward.title,
                detail: reward.description || 'Một nhịp nhỏ vừa mở ra từ điều hai người đã làm.',
                target,
                urgency: 'soft',
                source: {
                    type: 'reward',
                    id: toId(reward._id),
                    label: reward.sourceLabel || reward.title,
                    createdBy: reward.createdBy
                },
                cta: getRewardCta(reward),
                createdAt: toIso(reward.createdAt),
                dueAt: toIso(reward.expiresAt)
            }, reward.status === 'pending' ? 76 : 68));
        });

        const people = ROLES.reduce((result, role) => {
            const mood = moodByRole.get(role);
            const sortedSignals = sortSignals(personSignals[role]).slice(0, 4).map(stripWeight);
            const actions = actionsByRole[role]
                .sort((left, right) => new Date(right.at ?? 0).getTime() - new Date(left.at ?? 0).getTime())
                .slice(0, 4);

            result[role] = {
                role,
                label: ROLE_LABEL[role],
                today: {
                    hasMoodCheckIn: Boolean(mood),
                    mood: mood ? {
                        id: toId(mood._id),
                        value: mood.mood,
                        at: toIso(mood.date ?? mood.createdAt)
                    } : undefined,
                    actions,
                    lastActiveAt: getLatestIso(actions.map(action => action.at))
                },
                signals: sortedSignals,
                summary: getPersonSummary(ROLE_LABEL[role], Boolean(mood), sortedSignals.length)
            };

            return result;
        }, {} as Record<AuthRole, RelationshipPersonState>);

        const sharedSorted = sortSignals(sharedSignals).slice(0, 5).map(stripWeight);
        const weightedAll = sortSignals([
            ...personSignals.girlfriend,
            ...personSignals.boyfriend,
            ...sharedSignals
        ]);
        const viewerWeighted = options.viewerRole
            ? weightedAll.filter(signal => signal.target === 'both' || signal.target === options.viewerRole)
            : weightedAll;
        const nextStep = (viewerWeighted[0] ?? weightedAll[0]);
        const sharedNextStep = sharedSignals.length > 0 ? stripWeight(sortSignals(sharedSignals)[0]) : undefined;

        const state: RelationshipState = {
            date: toDateKey(dayStart),
            generatedAt: new Date().toISOString(),
            viewerRole: options.viewerRole,
            people,
            shared: {
                target: 'both',
                signals: sharedSorted,
                nextStep: sharedNextStep,
                summary: sharedSorted.length > 0
                    ? 'Có một vài nhịp chung đang mở, ưu tiên điều thật sự có ngữ cảnh.'
                    : 'Chưa có điều chung nào cần kéo ra thành nhắc nhở.'
            },
            nextStep: nextStep ? stripWeight(nextStep) : undefined
        };

        logger.success('RelationshipState', 'Trả về relationship state', {
            date: state.date,
            girlfriendSignals: state.people.girlfriend.signals.length,
            boyfriendSignals: state.people.boyfriend.signals.length,
            sharedSignals: state.shared.signals.length
        });

        return state;
    }
}

export default new RelationshipStateService();
