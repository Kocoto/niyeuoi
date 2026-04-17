import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  ChevronRight,
  Compass,
  Grid3x3,
  Heart,
  History,
  LogOut,
  Map,
  MapPinned,
  MessageCircleHeart,
  NotebookTabs,
  Sparkles,
  Ticket,
  Trophy,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { useAuth } from '../context/AuthContext';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { ROLE_CORNER_LABEL } from '../constants/roles';
import PersonBadge from './PersonBadge';

type NavItem = {
  to: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  isPrimary?: boolean;
  groupTitle?: string;
};

type NavGroup = {
  key: string;
  title: string;
  hint: string;
  items: NavItem[];
};

const NAV_STORAGE_KEY = 'niyeuoi:recent-destinations';
const RECENT_LIMIT = 4;

const primaryNav: NavItem[] = [
  {
    to: '/',
    label: 'Trang chủ',
    description: 'Nơi bắt đầu cho hôm nay',
    icon: <Heart size={18} />,
    isPrimary: true,
  },
  {
    to: '/timeline',
    label: 'Kỷ niệm',
    description: 'Những điều vừa đi qua và còn muốn giữ lại',
    icon: <CalendarDays size={18} />,
    isPrimary: true,
  },
  {
    to: '/places',
    label: 'Địa điểm',
    description: 'Chỗ đã đi, muốn đi, và lần tới nên thử',
    icon: <MapPinned size={18} />,
    isPrimary: true,
  },
];

const groupedNav: NavGroup[] = [
  {
    key: 'feelings',
    title: 'Cảm xúc và trò chuyện',
    hint: 'Những flow để check-in và tiếp tục điều còn đang chờ giữa hai người.',
    items: [
      { to: '/mood', label: 'Góc cảm xúc', description: 'Check-in nhẹ nhàng hôm nay', icon: <Sparkles size={18} /> },
      { to: '/deeptalk', label: 'Trò chuyện sâu', description: 'Những câu hỏi cần thời gian', icon: <MessageCircleHeart size={18} /> },
    ],
  },
  {
    key: 'dates',
    title: 'Hẹn hò và ý tưởng',
    hint: 'Giữ nhịp mong muốn, ngày đáng nhớ, và những điều muốn cùng nhau làm.',
    items: [
      { to: '/wishlist', label: 'Điều mong muốn', description: 'Quà, trải nghiệm, và những điều đang nghĩ tới', icon: <NotebookTabs size={18} /> },
      { to: '/events', label: 'Ngày hẹn', description: 'Những ngày đáng nhớ phía trước', icon: <CalendarDays size={18} /> },
      { to: '/challenges', label: 'Thử thách', description: 'Những việc mình cùng làm', icon: <Trophy size={18} /> },
    ],
  },
  {
    key: 'utility',
    title: 'Tiện ích',
    hint: 'Mở khi thật sự cần, để app shell vẫn giữ nhịp nhẹ và rõ.',
    items: [
      { to: '/map', label: 'Bản đồ yêu thương', description: 'Nhìn lại các điểm chung', icon: <Map size={18} /> },
      { to: '/coupons', label: 'Vé yêu thương', description: 'Những đặc quyền dành cho nhau', icon: <Ticket size={18} /> },
    ],
  },
];

const secondaryNav: NavItem[] = groupedNav.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    groupTitle: group.title,
  })),
);

const allNavItems: NavItem[] = [...primaryNav, ...secondaryNav];

const CONTEXTUAL_LINKS: Partial<Record<string, string[]>> = {
  '/': ['/mood', '/deeptalk', '/timeline'],
  '/mood': ['/deeptalk', '/timeline'],
  '/deeptalk': ['/mood', '/timeline'],
  '/timeline': ['/places', '/events', '/wishlist'],
  '/places': ['/timeline', '/events'],
  '/wishlist': ['/events', '/places', '/coupons'],
  '/events': ['/wishlist', '/coupons'],
  '/challenges': ['/events', '/coupons'],
  '/coupons': ['/events', '/wishlist'],
  '/map': ['/places', '/timeline'],
};

const readRecentPaths = () => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(NAV_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
};

const writeRecentPaths = (paths: string[]) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(paths));
  } catch {
    // Ignore storage failures and keep navigation working.
  }
};

const MobileNavLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onSelect?: (to: string) => void;
}> = ({ to, icon, label, active, onSelect }) => (
  <Link
    to={to}
    onClick={() => onSelect?.(to)}
    aria-current={active ? 'page' : undefined}
    className={`flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold transition ${
      active ? 'bg-rose-50 text-primary' : 'text-soft'
    }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

const NavCardLink: React.FC<{
  item: NavItem;
  active: boolean;
  onSelect: (to: string) => void;
}> = ({ item, active, onSelect }) => (
  <Link
    to={item.to}
    onClick={() => onSelect(item.to)}
    className={`flex items-center gap-3 rounded-[1.4rem] px-4 py-4 transition ${
      active ? 'bg-rose-50 text-ink ring-1 ring-rose-100' : 'bg-[#faf6f8] text-ink'
    }`}
  >
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      {item.icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-bold">{item.label}</p>
      <p className="truncate text-xs text-soft">{item.description}</p>
    </div>
    <ChevronRight size={16} className="text-soft" />
  </Link>
);

const ShortcutSection: React.FC<{
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  items: NavItem[];
  pathname: string;
  onSelect: (to: string) => void;
}> = ({ eyebrow, title, description, icon, items, pathname, onSelect }) => {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#b292a6]">{eyebrow}</p>
        <h3 className="mt-2 flex items-center gap-2 text-lg font-black text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            {icon}
          </span>
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-soft">{description}</p>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <NavCardLink key={item.to} item={item} active={pathname === item.to} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
};

const NavGroupSection: React.FC<{
  group: NavGroup;
  pathname: string;
  onSelect: (to: string) => void;
  emphasize?: boolean;
}> = ({ group, pathname, onSelect, emphasize = false }) => (
  <section>
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#b292a6]">{group.title}</p>
      {emphasize ? (
        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-rose-600 ring-1 ring-rose-100">
          Vừa dùng gần đây
        </span>
      ) : null}
    </div>
    <p className="mb-3 text-sm leading-6 text-soft">{group.hint}</p>
    <div className="space-y-2">
      {group.items.map((item) => (
        <NavCardLink key={item.to} item={item} active={pathname === item.to} onSelect={onSelect} />
      ))}
    </div>
  </section>
);

const MoreMenuContent: React.FC<{
  pathname: string;
  currentLabel: string;
  recentItems: NavItem[];
  contextualItems: NavItem[];
  orderedGroups: NavGroup[];
  recentGroupTitle: string | null;
  onSelect: (to: string) => void;
}> = ({
  pathname,
  currentLabel,
  recentItems,
  contextualItems,
  orderedGroups,
  recentGroupTitle,
  onSelect,
}) => (
  <div className="space-y-6">
    <ShortcutSection
      eyebrow="Đi tiếp từ đây"
      title={`Từ ${currentLabel}, thường sẽ cần`}
      description="Gợi ý vài bước tiếp theo để không phải quay lại từ đầu khi đang ở giữa một flow."
      icon={<Compass size={17} className="text-primary" />}
      items={contextualItems}
      pathname={pathname}
      onSelect={onSelect}
    />

    <ShortcutSection
      eyebrow="Vừa mở gần đây"
      title="Mở lại nhanh nơi vừa dùng"
      description="Những chỗ bạn mới vào gần đây được kéo lên trước để `Thêm` bớt cảm giác là một danh sách dài."
      icon={<History size={17} className="text-sky-500" />}
      items={recentItems}
      pathname={pathname}
      onSelect={onSelect}
    />

    {orderedGroups.map((group) => (
      <NavGroupSection
        key={group.key}
        group={group}
        pathname={pathname}
        onSelect={onSelect}
        emphasize={group.title === recentGroupTitle}
      />
    ))}
  </div>
);

const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  const { role, logout } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const [recentPaths, setRecentPaths] = useState<string[]>(readRecentPaths);
  const { tracking } = useLocationTracker(role === 'girlfriend');
  const isMoreActive = secondaryNav.some((item) => item.to === pathname);

  const activeItem = useMemo(
    () => allNavItems.find((entry) => entry.to === pathname) ?? primaryNav[0],
    [pathname],
  );

  const recentItems = useMemo(
    () =>
      recentPaths
        .filter((to) => to !== pathname)
        .map((to) => allNavItems.find((item) => item.to === to))
        .filter((item): item is NavItem => Boolean(item))
        .slice(0, RECENT_LIMIT),
    [pathname, recentPaths],
  );

  const contextualItems = useMemo(() => {
    const paths = CONTEXTUAL_LINKS[pathname] ?? [];
    const items = paths
      .map((to) => allNavItems.find((item) => item.to === to))
      .filter((item): item is NavItem => Boolean(item));

    return items.filter((item, index, array) => array.findIndex((entry) => entry.to === item.to) === index);
  }, [pathname]);

  const recentGroupTitle = useMemo(
    () => recentItems.find((item) => item.groupTitle)?.groupTitle ?? null,
    [recentItems],
  );

  const orderedGroups = useMemo(() => {
    if (!recentGroupTitle) return groupedNav;

    const prioritized = groupedNav.find((group) => group.title === recentGroupTitle);
    if (!prioritized) return groupedNav;

    return [prioritized, ...groupedNav.filter((group) => group.title !== recentGroupTitle)];
  }, [recentGroupTitle]);

  const closeMore = () => setShowMore(false);

  const rememberDestination = (to: string) => {
    if (to === '/') return;

    setRecentPaths((current) => {
      const next = [to, ...current.filter((value) => value !== to)].slice(0, RECENT_LIMIT);
      writeRecentPaths(next);
      return next;
    });
  };

  const handleMenuSelect = (to: string) => {
    rememberDestination(to);
    closeMore();
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/70 backdrop-blur-xl">
        <div className="pt-safe mx-auto flex max-w-[78rem] items-center justify-between gap-3 px-4 pb-3 md:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <Heart
                  size={20}
                  className={role === 'boyfriend' ? 'fill-sky-500 text-sky-500' : 'fill-primary text-primary'}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-black uppercase tracking-[0.24em] text-[#b292a6]">Niyeuoi</p>
                  {tracking ? (
                    <span className="relative flex h-2.5 w-2.5" aria-label="Đang chia sẻ vị trí">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <p className="truncate text-lg font-black text-ink md:text-[1.35rem]">{ROLE_CORNER_LABEL[role]}</p>
                  <PersonBadge role={role} prefix="Đang là" variant="soft" />
                </div>
                <p className="truncate text-xs text-soft md:text-sm">
                  {activeItem.label} · {activeItem.description}
                </p>
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {primaryNav.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => rememberDestination(item.to)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    active ? 'bg-white text-ink shadow-sm ring-1 ring-black/5' : 'text-soft hover:bg-white/80 hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setShowMore((value) => !value)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                isMoreActive || showMore
                  ? 'bg-rose-50 text-primary ring-1 ring-rose-100'
                  : 'text-soft hover:bg-white/80 hover:text-ink'
              }`}
              aria-expanded={showMore}
              aria-label={showMore ? 'Đóng thêm' : 'Mở thêm'}
            >
              {showMore ? <X size={16} /> : <Grid3x3 size={16} />}
              Thêm
            </button>
          </nav>

          <button
            type="button"
            onClick={logout}
            className="btn-secondary shrink-0 px-3 py-2 text-xs md:px-4 md:text-sm"
            aria-label="Đổi người dùng"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Đổi người dùng</span>
          </button>
        </div>
      </header>

      <nav className="nav-safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/80 bg-white/86 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-[38rem] items-center gap-1 px-2 pt-2">
          {primaryNav.map((item) => (
            <MobileNavLink
              key={item.to}
              to={item.to}
              label={item.label}
              active={pathname === item.to}
              icon={item.icon}
              onSelect={rememberDestination}
            />
          ))}
          <button
            type="button"
            onClick={() => setShowMore((value) => !value)}
            className={`flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold transition ${
              isMoreActive || showMore ? 'bg-rose-50 text-primary' : 'text-soft'
            }`}
            aria-expanded={showMore}
            aria-label={showMore ? 'Đóng thêm' : 'Mở thêm'}
          >
            {showMore ? <X size={18} /> : <Grid3x3 size={18} />}
            Thêm
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {showMore ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMore}
              className="fixed inset-0 z-40 hidden bg-slate-900/15 backdrop-blur-[2px] md:block"
              aria-label="Đóng menu thêm"
            />

            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="fixed right-6 top-[5.1rem] z-50 hidden w-[33rem] max-h-[78vh] overflow-y-auto rounded-[2rem] border border-white/70 bg-white/96 p-5 shadow-[0_30px_100px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl md:block"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="section-label">Đi tiếp từ app shell</p>
                  <h2 className="mt-2 text-2xl font-black text-ink">Thêm cho hai bạn</h2>
                  <p className="mt-2 text-sm leading-6 text-soft">
                    `Thêm` giờ ưu tiên chỗ vừa dùng và vài hướng đi tiếp hợp ngữ cảnh, thay vì trải hết mọi tính năng cùng lúc.
                  </p>
                </div>
                <button type="button" onClick={closeMore} className="rounded-full p-2 text-soft">
                  <X size={18} />
                </button>
              </div>

              <MoreMenuContent
                pathname={pathname}
                currentLabel={activeItem.label}
                recentItems={recentItems}
                contextualItems={contextualItems}
                orderedGroups={orderedGroups}
                recentGroupTitle={recentGroupTitle}
                onSelect={handleMenuSelect}
              />
            </motion.div>

            <div className="md:hidden">
              <div className="sheet-shell">
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={closeMore}
                  className="sheet-backdrop"
                  aria-label="Đóng menu thêm"
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                  className="sheet-panel max-h-[82vh] overflow-y-auto"
                >
                  <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-rose-100" />
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="section-label">Đi tiếp từ app shell</p>
                      <h2 className="mt-2 text-2xl font-black text-ink">Thêm cho hai bạn</h2>
                      <p className="mt-2 text-sm leading-6 text-soft">
                        Vài lối đi tiếp được kéo lên trước để `Thêm` bớt dài và gần nhịp dùng thật hơn.
                      </p>
                    </div>
                    <button type="button" onClick={closeMore} className="rounded-full p-2 text-soft">
                      <X size={18} />
                    </button>
                  </div>

                  <MoreMenuContent
                    pathname={pathname}
                    currentLabel={activeItem.label}
                    recentItems={recentItems}
                    contextualItems={contextualItems}
                    orderedGroups={orderedGroups}
                    recentGroupTitle={recentGroupTitle}
                    onSelect={handleMenuSelect}
                  />
                </motion.div>
              </div>
            </div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
