import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  ChevronRight,
  Grid3x3,
  Heart,
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
import type { AppRole } from '../constants/appRoles';
import { ROLE_CORNER_LABEL, ROLE_NAME } from '../constants/appRoles';
import RolePill from './RolePill';

type NavItem = {
  to: string;
  label: string;
  description: string;
  icon: React.ReactNode;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const primaryNav: NavItem[] = [
  {
    to: '/',
    label: 'Trang chủ',
    description: 'Nơi nhìn nhanh hôm nay của hai bạn',
    icon: <Heart size={18} />,
  },
  {
    to: '/timeline',
    label: 'Kỷ niệm',
    description: 'Dòng chuyện đã được ghi lại',
    icon: <CalendarDays size={18} />,
  },
  {
    to: '/places',
    label: 'Địa điểm',
    description: 'Nơi đã đi và nơi nên ghé lần tới',
    icon: <MapPinned size={18} />,
  },
];

const groupedNav: NavGroup[] = [
  {
    title: 'Cảm xúc và trò chuyện',
    items: [
      { to: '/mood', label: 'Góc cảm xúc', description: 'Hai nhịp cảm xúc đứng cạnh nhau', icon: <Sparkles size={18} /> },
      { to: '/deeptalk', label: 'Trò chuyện sâu', description: 'Biết rõ ai đang chờ và ai đã trả lời', icon: <MessageCircleHeart size={18} /> },
    ],
  },
  {
    title: 'Hẹn hò và ý tưởng',
    items: [
      { to: '/wishlist', label: 'Điều mong muốn', description: 'Quà, nơi muốn đi và điều muốn làm', icon: <NotebookTabs size={18} /> },
      { to: '/events', label: 'Ngày hẹn', description: 'Những ngày đáng nhớ sắp tới', icon: <CalendarDays size={18} /> },
      { to: '/challenges', label: 'Thử thách', description: 'Những điều làm cùng nhau', icon: <Trophy size={18} /> },
    ],
  },
  {
    title: 'Tiện ích riêng',
    items: [
      { to: '/map', label: 'Bản đồ yêu thương', description: 'Nhìn lại các điểm chung', icon: <Map size={18} /> },
      { to: '/coupons', label: 'Vé yêu thương', description: 'Những đặc quyền dành cho nhau', icon: <Ticket size={18} /> },
    ],
  },
];

const desktopNav = [...primaryNav, ...groupedNav.flatMap(group => group.items)];

const NavbarV2: React.FC = () => {
  const { pathname } = useLocation();
  const { role, logout } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const { tracking } = useLocationTracker(role === 'girlfriend');

  const activeLabel = useMemo(() => {
    const item = desktopNav.find(entry => entry.to === pathname);
    return item?.label ?? 'Trang chủ';
  }, [pathname]);

  const activeDescription = useMemo(() => {
    const item = desktopNav.find(entry => entry.to === pathname);
    return item?.description ?? 'Không gian chung của hai bạn';
  }, [pathname]);

  const isMoreActive = groupedNav.some(group => group.items.some(item => item.to === pathname));

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/78 backdrop-blur-xl">
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

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="truncate text-lg font-black text-ink md:text-[1.35rem]">{ROLE_CORNER_LABEL[role as AppRole]}</p>
                  <RolePill role={role as AppRole} text={`Đang là ${ROLE_NAME[role as AppRole]}`} />
                </div>

                <p className="mt-1 truncate text-xs text-soft md:text-sm">
                  {activeLabel} · {activeDescription}
                </p>
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {desktopNav.map(item => {
              const active = pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    active ? 'bg-white text-ink shadow-sm ring-1 ring-black/5' : 'text-soft hover:bg-white/80 hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
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

      <nav className="nav-safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/80 bg-white/88 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-[38rem] items-center gap-1 px-2 pt-2">
          {primaryNav.map(item => (
            <MobileNavLink key={item.to} to={item.to} label={item.label} active={pathname === item.to} icon={item.icon} />
          ))}
          <button
            type="button"
            onClick={() => setShowMore(value => !value)}
            className={`flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold transition ${
              isMoreActive || showMore ? 'bg-rose-50 text-primary' : 'text-soft'
            }`}
            aria-label={showMore ? 'Đóng thêm' : 'Mở thêm'}
          >
            {showMore ? <X size={18} /> : <Grid3x3 size={18} />}
            Thêm
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {showMore ? (
          <div className="sheet-shell md:hidden">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
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
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="section-label">Không gian khác</p>
                  <h2 className="mt-2 text-2xl font-black text-ink">Thêm cho hai bạn</h2>
                </div>
                <button type="button" onClick={() => setShowMore(false)} className="rounded-full p-2 text-soft">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                {groupedNav.map(group => (
                  <section key={group.title}>
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#b292a6]">{group.title}</p>
                    <div className="space-y-2">
                      {group.items.map(item => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setShowMore(false)}
                          className={`flex items-center gap-3 rounded-[1.4rem] px-4 py-4 transition ${
                            pathname === item.to ? 'bg-rose-50 text-ink' : 'bg-[#faf6f8] text-ink'
                          }`}
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                            {item.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">{item.label}</p>
                            <p className="line-clamp-2 text-xs text-soft">{item.description}</p>
                          </div>
                          <ChevronRight size={16} className="text-soft" />
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

const MobileNavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean }> = ({
  to,
  icon,
  label,
  active,
}) => (
  <Link
    to={to}
    aria-current={active ? 'page' : undefined}
    className={`flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold transition ${
      active ? 'bg-rose-50 text-primary' : 'text-soft'
    }`}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export default NavbarV2;
