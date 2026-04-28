import Coupon, { type CouponParty } from '../models/Coupon';
import DeepTalkQuestion from '../models/DeepTalkQuestion';
import Event, { type EventTarget } from '../models/Event';
import Mood from '../models/Mood';
import Place, { type PlaceStatus } from '../models/Place';
import Wishlist from '../models/Wishlist';
import logger from '../utils/logger';
import type { AuthRole } from '../utils/authToken';

export const SMART_SUGGESTION_TYPE_VALUES = [
    'event_prepare',
    'deeptalk_waiting',
    'coupon_waiting',
    'mood_soft_support',
    'place_next_time',
    'wishlist_bridge'
] as const;

export const SMART_SUGGESTION_SURFACE_VALUES = [
    'home',
    'places',
    'wishlist',
    'deeptalk',
    'coupons',
    'events'
] as const;

export type SmartSuggestionType = (typeof SMART_SUGGESTION_TYPE_VALUES)[number];
export type SmartSuggestionSurface = (typeof SMART_SUGGESTION_SURFACE_VALUES)[number];
export type SmartSuggestionSourceType = 'event' | 'deep_talk_question' | 'coupon' | 'mood' | 'place' | 'wishlist';
export type SmartSuggestionTarget = AuthRole | 'both';

export type SmartSuggestion = {
    id: string;
    type: SmartSuggestionType;
    title: string;
    detail: string;
    reason: string;
    priority: number;
    targetRole?: SmartSuggestionTarget;
    source: {
        type: SmartSuggestionSourceType;
        id: string;
        label: string;
        createdBy?: AuthRole;
    };
    cta: {
        label: string;
        to: string;
    };
    surfaceHints: SmartSuggestionSurface[];
    createdAt?: string;
    expiresAt?: string;
};

type SuggestionListOptions = {
    limit?: number;
    forWhom?: AuthRole;
    surface?: SmartSuggestionSurface;
};

type TimestampedDoc = {
    _id: unknown;
    createdAt?: Date;
    updatedAt?: Date;
};

type EventSuggestionDoc = TimestampedDoc & {
    title: string;
    date: Date;
    description?: string;
    createdBy?: AuthRole;
    forWhom?: EventTarget;
};

type DeepTalkSuggestionDoc = TimestampedDoc & {
    content: string;
    answers?: Record<AuthRole, { text?: string; isInPerson?: boolean; answeredAt?: Date }>;
};

type CouponSuggestionDoc = TimestampedDoc & {
    title: string;
    description?: string;
    isUsed?: boolean;
    createdBy?: AuthRole | 'system';
    couponType?: string;
    receiverRole?: CouponParty;
    holderRole?: CouponParty;
    claimEndsAt?: Date;
};

type MoodSuggestionDoc = TimestampedDoc & {
    mood: string;
    note?: string;
    date?: Date;
    createdBy?: AuthRole;
};

type PlaceSuggestionDoc = TimestampedDoc & {
    name: string;
    note?: string;
    category?: string;
    isVisited?: boolean;
    status?: PlaceStatus;
    createdBy?: AuthRole;
};

type WishlistSuggestionDoc = TimestampedDoc & {
    itemName: string;
    status?: string;
    note?: string;
    isSecretlyPrepared?: boolean;
    createdBy?: AuthRole;
    owner?: AuthRole;
};

const ROLE_LABEL: Record<AuthRole, string> = {
    boyfriend: 'Được',
    girlfriend: 'Ni'
};

const NEGATIVE_MOODS = new Set(['Hơi buồn', 'Mệt mỏi', 'Buồn', 'Giận']);
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 12;
const UPCOMING_EVENT_WINDOW_DAYS = 14;

const isAuthRoleValue = (value: unknown): value is AuthRole =>
    value === 'boyfriend' || value === 'girlfriend';

const isBothOrRole = (value: unknown): value is SmartSuggestionTarget =>
    value === 'both' || isAuthRoleValue(value);

const getOppositeRole = (role: AuthRole): AuthRole =>
    role === 'boyfriend' ? 'girlfriend' : 'boyfriend';

const toId = (value: unknown) => String(value);

const toIso = (date?: Date) => {
    if (!date) return undefined;
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const startOfToday = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};

const getDaysUntil = (date: Date) => {
    const today = startOfToday();
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
};

const getTargetLabel = (target?: SmartSuggestionTarget) => {
    if (target === 'both') return 'cả hai';
    return target ? ROLE_LABEL[target] : 'hai người';
};

const normalizeLimit = (value?: number) => {
    if (!value || Number.isNaN(value)) return DEFAULT_LIMIT;
    return Math.min(Math.max(Math.floor(value), 1), MAX_LIMIT);
};

const createSuggestion = (data: Omit<SmartSuggestion, 'id'>): SmartSuggestion => ({
    ...data,
    id: [
        data.type,
        data.source.type,
        data.source.id,
        data.targetRole ?? 'all'
    ].join(':')
});

const isSuggestionVisible = (suggestion: SmartSuggestion, forWhom?: AuthRole) => {
    if (!forWhom) {
        return suggestion.targetRole !== 'boyfriend' && suggestion.targetRole !== 'girlfriend';
    }

    return !suggestion.targetRole || suggestion.targetRole === 'both' || suggestion.targetRole === forWhom;
};

const isAnswerDone = (answer?: { text?: string; isInPerson?: boolean }) =>
    Boolean(answer?.isInPerson || answer?.text);

const getCouponTarget = (coupon: CouponSuggestionDoc): SmartSuggestionTarget | undefined => {
    if (coupon.holderRole === 'both' || coupon.receiverRole === 'both' || coupon.couponType === 'shared') {
        return 'both';
    }

    if (isAuthRoleValue(coupon.holderRole)) return coupon.holderRole;
    if (isAuthRoleValue(coupon.receiverRole)) return coupon.receiverRole;
    if (coupon.couponType === 'claimable') return 'both';
    return undefined;
};

const getWishlistTarget = (wish: WishlistSuggestionDoc): AuthRole | undefined => {
    if (wish.isSecretlyPrepared) {
        return isAuthRoleValue(wish.createdBy) ? wish.createdBy : undefined;
    }

    if (isAuthRoleValue(wish.owner)) return wish.owner;
    if (isAuthRoleValue(wish.createdBy)) return wish.createdBy;
    return undefined;
};

const buildEventSuggestion = (event: EventSuggestionDoc): SmartSuggestion | null => {
    const daysUntil = getDaysUntil(event.date);
    if (daysUntil < 0 || daysUntil > UPCOMING_EVENT_WINDOW_DAYS) return null;

    const targetRole = isBothOrRole(event.forWhom) ? event.forWhom : 'both';
    const when = daysUntil === 0
        ? 'hôm nay'
        : daysUntil === 1
            ? 'ngày mai'
            : `còn ${daysUntil} ngày`;

    return createSuggestion({
        type: 'event_prepare',
        title: `Chuẩn bị nhẹ cho "${event.title}"`,
        detail: `${when} tới dịp dành cho ${getTargetLabel(targetRole)}. Chỉ cần mở lại để nhớ vì sao ngày này được giữ.`,
        reason: 'upcoming_event',
        priority: 95 - daysUntil,
        targetRole,
        source: {
            type: 'event',
            id: toId(event._id),
            label: event.title,
            createdBy: isAuthRoleValue(event.createdBy) ? event.createdBy : undefined
        },
        cta: {
            label: 'Mở ngày đã ghim',
            to: '/events'
        },
        surfaceHints: ['home', 'events'],
        createdAt: toIso(event.createdAt),
        expiresAt: toIso(event.date)
    });
};

const buildDeepTalkSuggestions = (questions: DeepTalkSuggestionDoc[], forWhom?: AuthRole): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = [];
    const roles: AuthRole[] = forWhom ? [forWhom] : ['girlfriend', 'boyfriend'];

    for (const question of questions) {
        for (const role of roles) {
            if (isAnswerDone(question.answers?.[role])) continue;

            suggestions.push(createSuggestion({
                type: 'deeptalk_waiting',
                title: `Một câu Deep Talk đang mở cho ${ROLE_LABEL[role]}`,
                detail: question.content,
                reason: 'unanswered_deeptalk',
                priority: 84,
                targetRole: role,
                source: {
                    type: 'deep_talk_question',
                    id: toId(question._id),
                    label: question.content
                },
                cta: {
                    label: 'Mở Deep Talk',
                    to: '/deeptalk'
                },
                surfaceHints: ['home', 'deeptalk'],
                createdAt: toIso(question.createdAt)
            }));
        }

        if (suggestions.length >= 2) break;
    }

    return suggestions;
};

const buildCouponSuggestion = (coupon: CouponSuggestionDoc): SmartSuggestion | null => {
    if (coupon.isUsed) return null;
    const targetRole = getCouponTarget(coupon);
    const targetCopy = getTargetLabel(targetRole);
    const claimEnding = coupon.claimEndsAt ? ` Có hạn nhận tới ${new Date(coupon.claimEndsAt).toLocaleDateString('vi-VN')}.` : '';

    return createSuggestion({
        type: 'coupon_waiting',
        title: `Một voucher đang chờ ${targetCopy}`,
        detail: `${coupon.description || coupon.title}.${claimEnding}`.trim(),
        reason: coupon.couponType === 'claimable' ? 'claimable_coupon_waiting' : 'unused_coupon',
        priority: coupon.couponType === 'claimable' ? 78 : 72,
        targetRole,
        source: {
            type: 'coupon',
            id: toId(coupon._id),
            label: coupon.title,
            createdBy: isAuthRoleValue(coupon.createdBy) ? coupon.createdBy : undefined
        },
        cta: {
            label: 'Mở ví voucher',
            to: '/coupons'
        },
        surfaceHints: ['home', 'coupons'],
        createdAt: toIso(coupon.createdAt),
        expiresAt: toIso(coupon.claimEndsAt)
    });
};

const buildMoodSuggestion = (mood: MoodSuggestionDoc): SmartSuggestion | null => {
    if (!isAuthRoleValue(mood.createdBy) || !NEGATIVE_MOODS.has(mood.mood)) return null;

    const targetRole = getOppositeRole(mood.createdBy);
    return createSuggestion({
        type: 'mood_soft_support',
        title: `Một nhịp dịu cho ${ROLE_LABEL[mood.createdBy]}`,
        detail: `${ROLE_LABEL[mood.createdBy]} vừa ghi "${mood.mood}". Có thể mở Mood để để lại một phản hồi nhẹ, không cần biến nó thành việc lớn.`,
        reason: 'recent_soft_mood',
        priority: 74,
        targetRole,
        source: {
            type: 'mood',
            id: toId(mood._id),
            label: mood.mood,
            createdBy: mood.createdBy
        },
        cta: {
            label: 'Mở Mood',
            to: '/mood'
        },
        surfaceHints: ['home'],
        createdAt: toIso(mood.date ?? mood.createdAt)
    });
};

const buildPlaceSuggestion = (place: PlaceSuggestionDoc): SmartSuggestion | null => {
    const status = place.status ?? (place.isVisited ? 'visited' : 'want_to_go');
    if (status === 'visited') return null;

    const isPinnedForNextTime = status === 'next_time';
    return createSuggestion({
        type: 'place_next_time',
        title: isPinnedForNextTime ? 'Một nơi đã được ghim cho lần tới' : 'Một nơi có thể thử khi cần đổi nhịp',
        detail: `${place.name}${place.note ? ` · ${place.note}` : ''}`,
        reason: isPinnedForNextTime ? 'place_soft_pin' : 'place_want_to_go',
        priority: isPinnedForNextTime ? 68 : 58,
        targetRole: 'both',
        source: {
            type: 'place',
            id: toId(place._id),
            label: place.name,
            createdBy: isAuthRoleValue(place.createdBy) ? place.createdBy : undefined
        },
        cta: {
            label: 'Mở Places',
            to: '/places'
        },
        surfaceHints: ['home', 'places'],
        createdAt: toIso(place.createdAt)
    });
};

const buildWishlistSuggestion = (wish: WishlistSuggestionDoc, viewerRole?: AuthRole): SmartSuggestion | null => {
    const targetRole = getWishlistTarget(wish);

    if (wish.isSecretlyPrepared) {
        if (!viewerRole || viewerRole !== targetRole) return null;

        return createSuggestion({
            type: 'wishlist_bridge',
            title: 'Một kế hoạch nhỏ đang cần người giữ nhịp',
            detail: `"${wish.itemName}" đang được chuẩn bị. Suggestion này chỉ hiện cho phía đang chuẩn bị để không lộ bất ngờ.`,
            reason: 'secret_wishlist_preparation',
            priority: 64,
            targetRole,
            source: {
                type: 'wishlist',
                id: toId(wish._id),
                label: wish.itemName,
                createdBy: isAuthRoleValue(wish.createdBy) ? wish.createdBy : undefined
            },
            cta: {
                label: 'Mở Wishlist',
                to: '/wishlist'
            },
            surfaceHints: ['home', 'wishlist'],
            createdAt: toIso(wish.createdAt)
        });
    }

    if (wish.status && wish.status !== 'Đang đợi') return null;

    return createSuggestion({
        type: 'wishlist_bridge',
        title: `Biến "${wish.itemName}" thành một bước cụ thể`,
        detail: wish.note || 'Wishlist này có thể nối sang một kế hoạch nhỏ khi hai người muốn đi tiếp.',
        reason: 'wishlist_waiting_to_plan',
        priority: 56,
        targetRole,
        source: {
            type: 'wishlist',
            id: toId(wish._id),
            label: wish.itemName,
            createdBy: isAuthRoleValue(wish.createdBy) ? wish.createdBy : undefined
        },
        cta: {
            label: 'Mở Wishlist',
            to: '/wishlist'
        },
        surfaceHints: ['home', 'wishlist'],
        createdAt: toIso(wish.createdAt)
    });
};

const sortSuggestions = (suggestions: SmartSuggestion[]) =>
    suggestions.sort((left, right) => {
        if (right.priority !== left.priority) return right.priority - left.priority;
        return new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime();
    });

class SuggestionService {
    async getSmartSuggestions(options: SuggestionListOptions = {}) {
        const limit = normalizeLimit(options.limit);
        logger.info('Suggestion', 'Lấy smart suggestions', {
            limit,
            forWhom: options.forWhom,
            surface: options.surface
        });

        const today = startOfToday();
        const eventWindowEnd = new Date(today);
        eventWindowEnd.setDate(eventWindowEnd.getDate() + UPCOMING_EVENT_WINDOW_DAYS);

        const [
            events,
            questions,
            coupons,
            moods,
            places,
            wishes
        ] = await Promise.all([
            Event.find({ date: { $gte: today, $lte: eventWindowEnd } }).sort({ date: 1 }).limit(6).lean() as unknown as Promise<EventSuggestionDoc[]>,
            DeepTalkQuestion.find().sort({ createdAt: -1 }).limit(12).lean() as unknown as Promise<DeepTalkSuggestionDoc[]>,
            Coupon.find({ isUsed: false }).sort({ createdAt: -1 }).limit(12).lean() as unknown as Promise<CouponSuggestionDoc[]>,
            Mood.find().sort({ date: -1 }).limit(6).lean() as unknown as Promise<MoodSuggestionDoc[]>,
            Place.find({
                $or: [
                    { status: { $in: ['next_time', 'want_to_go'] } },
                    { status: { $exists: false }, isVisited: false }
                ]
            }).sort({ status: 1, createdAt: -1 }).limit(10).lean() as unknown as Promise<PlaceSuggestionDoc[]>,
            Wishlist.find().sort({ createdAt: -1 }).limit(12).lean() as unknown as Promise<WishlistSuggestionDoc[]>
        ]);

        const suggestions = [
            ...events.flatMap(event => buildEventSuggestion(event) ?? []),
            ...buildDeepTalkSuggestions(questions, options.forWhom),
            ...coupons.flatMap(coupon => buildCouponSuggestion(coupon) ?? []),
            ...moods.flatMap(mood => buildMoodSuggestion(mood) ?? []),
            ...places.flatMap(place => buildPlaceSuggestion(place) ?? []),
            ...wishes.flatMap(wish => buildWishlistSuggestion(wish, options.forWhom) ?? [])
        ].filter(suggestion =>
            isSuggestionVisible(suggestion, options.forWhom) &&
            (!options.surface || suggestion.surfaceHints.includes(options.surface))
        );

        const uniqueSuggestions = Array.from(
            new Map(suggestions.map(suggestion => [suggestion.id, suggestion])).values()
        );

        const result = sortSuggestions(uniqueSuggestions).slice(0, limit);
        logger.success('Suggestion', `Trả về ${result.length} smart suggestions`);
        return result;
    }
}

export default new SuggestionService();
