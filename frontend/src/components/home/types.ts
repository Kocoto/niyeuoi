import type { ReactNode } from 'react';
import type { Role } from '../../constants/roles';

export type Memory = {
  _id: string;
  title: string;
  date: string;
  content: string;
  media?: string[];
  mood?: string;
  createdAt?: string;
  createdBy?: Role;
};

export type Mood = {
  mood: string;
  note?: string;
  createdAt?: string;
  createdBy?: Role;
};

export type DeepTalkQuestion = {
  _id: string;
  content: string;
  createdAt?: string;
  answers: Record<Role, { text?: string; isInPerson?: boolean; answeredAt?: string }>;
};

export type EventItem = {
  _id: string;
  title: string;
  date: string;
  description: string;
  createdAt?: string;
  createdBy?: Role;
  eventType?: 'birthday' | 'anniversary' | 'date_plan' | 'special_plan';
  forWhom?: Role | 'both';
};

export type Challenge = {
  _id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  createdAt?: string;
  createdBy?: Role;
  forWhom?: Role | 'both';
};

export type Coupon = {
  _id: string;
  title: string;
  description: string;
  isUsed: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: Role;
};

export type Reward = {
  _id: string;
  triggerType: 'challenge_completed' | 'deeptalk_paired' | 'mood_weekly_sync' | 'event_completed';
  rewardKind: 'coupon' | 'prompt' | 'challenge' | 'date_suggestion' | 'memory_highlight';
  status: 'pending' | 'revealed' | 'consumed' | 'dismissed' | 'expired';
  title: string;
  description?: string;
  sourceType: 'challenge' | 'deep_talk_question' | 'mood' | 'event' | 'coupon' | 'memory';
  sourceId: string;
  sourceLabel?: string;
  surfaceHint?: 'home' | 'challenge' | 'deeptalk' | 'mood' | 'event';
  forWhom?: Role | 'both';
  createdAt?: string;
  openedAt?: string;
};

export type MemoryResurfacingReason = 'anniversary_day' | 'pinned_highlight';

export type MemoryResurfacingItem = {
  memory: Memory;
  reason: MemoryResurfacingReason;
  label: string;
  detail: string;
  yearsAgo?: number;
};

export type SmartSuggestionSourceType = 'event' | 'deep_talk_question' | 'coupon' | 'mood' | 'place' | 'wishlist';
export type SmartSuggestionTarget = Role | 'both';

export type SmartSuggestion = {
  id: string;
  type: 'event_prepare' | 'deeptalk_waiting' | 'coupon_waiting' | 'mood_soft_support' | 'place_next_time' | 'wishlist_bridge';
  title: string;
  detail: string;
  reason: string;
  priority: number;
  targetRole?: SmartSuggestionTarget;
  source: {
    type: SmartSuggestionSourceType;
    id: string;
    label: string;
    createdBy?: Role;
  };
  cta: {
    label: string;
    to: string;
  };
  surfaceHints: Array<'home' | 'places' | 'wishlist' | 'deeptalk' | 'coupons' | 'events'>;
  createdAt?: string;
  expiresAt?: string;
};

export type RelationshipStateTarget = Role | 'both';
export type RelationshipStateSourceType = 'mood' | 'deep_talk_question' | 'event' | 'coupon' | 'reward' | 'system';
export type RelationshipStateSignalType = 'mood_missing' | 'deeptalk_waiting' | 'event_upcoming' | 'coupon_waiting' | 'reward_open';

export type RelationshipStateSignal = {
  id: string;
  type: RelationshipStateSignalType;
  title: string;
  detail: string;
  target: RelationshipStateTarget;
  urgency: 'soft' | 'soon' | 'today';
  source: {
    type: RelationshipStateSourceType;
    id?: string;
    label?: string;
    createdBy?: Role | 'system';
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
  role: Role;
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

export type RelationshipState = {
  date: string;
  generatedAt: string;
  viewerRole?: Role;
  people: Record<Role, RelationshipPersonState>;
  shared: {
    target: 'both';
    signals: RelationshipStateSignal[];
    nextStep?: RelationshipStateSignal;
    summary: string;
  };
  nextStep?: RelationshipStateSignal;
};

export type DashboardState = {
  memories: Memory[];
  resurfacingMemories: MemoryResurfacingItem[];
  suggestions: SmartSuggestion[];
  relationshipState: RelationshipState | null;
  moods: Mood[];
  questions: DeepTalkQuestion[];
  events: EventItem[];
  challenges: Challenge[];
  coupons: Coupon[];
  rewards: Reward[];
};

export type RoleSummary = {
  role: Role;
  title: string;
  checkedInToday: boolean;
  moodValue: string;
  moodMeta: string;
  recentLabel: string;
  recentMeta: string;
  waitingLabel: string;
  actionTo: string;
  actionLabel: string;
};

export type SharedPendingItem = {
  key: string;
  title: string;
  detail: string;
  to: string;
};

export type FeedItem = {
  key: string;
  role: Role | null;
  title: string;
  detail: string;
  meta: string;
  to: string;
  timestamp?: string;
};

export type RewardHandoffView = {
  reward: Reward;
  to: string;
  button: string;
  icon: ReactNode;
  meta: string;
};

export type MemoryResurfacingView = {
  item: MemoryResurfacingItem;
  owner: Role | null;
  badge: string;
  title: string;
  detail: string;
  meta: string;
};

export type NextStepView = {
  to: string;
  title: string;
  detail: string;
  button: string;
  icon: ReactNode;
};

export type Daypart = {
  label: string;
  note: string;
  icon: ReactNode;
};
