import React, { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, MapPin, Calendar, Gift, Home, Map, Ticket, Bell, Smile, Trophy, Grid3x3, X, MessageCircleHeart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { motion, AnimatePresence } from 'framer-motion';

const TAPS_REQUIRED = 5;
const TAP_RESET_MS = 1500;

const allPages = [
  { to: '/',           icon: <Home size={22} />,    label: 'Trang chủ',  emoji: '🏠' },
  { to: '/places',     icon: <MapPin size={22} />,  label: 'Ẩm thực',    emoji: '🍜' },
  { to: '/timeline',   icon: <Calendar size={22} />,label: 'Kỷ niệm',    emoji: '📸' },
  { to: '/mood',       icon: <Smile size={22} />,   label: 'Góc nhỏ',    emoji: '🎵' },
  { to: '/challenges', icon: <Trophy size={22} />,  label: 'Thử thách',  emoji: '🏆' },
  { to: '/events',     icon: <Bell size={22} />,    label: 'Sự kiện',    emoji: '📅' },
  { to: '/wishlist',   icon: <Gift size={22} />,    label: 'Wishlist',   emoji: '🎁' },
  { to: '/map',        icon: <Map size={22} />,     label: 'Bản đồ',     emoji: '🗺️' },
  { to: '/coupons',    icon: <Ticket size={22} />,              label: 'Voucher',    emoji: '🎟️' },
  { to: '/deeptalk',  icon: <MessageCircleHeart size={22} />,  label: 'Deep Talk',  emoji: '💬' },
];

// 4 mục chính luôn hiện ở bottom nav
const primaryNav = allPages.slice(0, 4);
// Còn lại hiện trong "Thêm"
const moreNav = allPages.slice(4);

const Navbar: React.FC = () => {
  const location = useLocation();
  const { role, toggleRole } = useAuth();
  const [_tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showMore, setShowMore] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = moreNav.some(p => isActive(p.to));
  const { tracking } = useLocationTracker(role === 'girlfriend');

  const handleLogoTap = () => {
    if (role === 'boyfriend') { toggleRole(); return; }
    if (tapTimer.current) clearTimeout(tapTimer.current);
    setTapCount(prev => {
      const next = prev + 1;
      if (next >= TAPS_REQUIRED) {
        setTapCount(0);
        toggleRole();
        return 0;
      }
      tapTimer.current = setTimeout(() => setTapCount(0), TAP_RESET_MS);
      return next;
    });
  };

  return (
    <>
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm px-6 py-3 flex items-center justify-between border-b border-pink-50">
        <div className="flex items-center gap-2 mx-auto md:mx-0 cursor-pointer select-none" onClick={handleLogoTap}>
          <Heart className={`${role === 'boyfriend' ? 'text-blue-400 fill-blue-400' : 'text-primary fill-primary'} transition-all`} size={20} />
          <span className="romantic-font text-xl font-bold text-gray-800">
            {role === 'boyfriend' ? 'Niyeuoi · Được' : 'Niyeuoi'}
          </span>
          {tracking && (
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          )}
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-5">
          {allPages.map(p => (
            <DesktopNavLink key={p.to} to={p.to} icon={p.icon} label={p.label} active={isActive(p.to)} />
          ))}
        </div>
      </header>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-pink-100 z-50 pb-safe">
        <div className="flex justify-around items-center px-2 py-1">
          {primaryNav.map(p => (
            <MobileNavLink key={p.to} to={p.to} icon={p.icon} label={p.label} active={isActive(p.to)} />
          ))}
          {/* Nút Thêm */}
          <button
            onClick={() => setShowMore(v => !v)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-h-[52px] justify-center ${isMoreActive || showMore ? 'text-primary' : 'text-gray-400'}`}
          >
            <div className={`${isMoreActive || showMore ? 'scale-110' : 'scale-100'} transition-transform`}>
              {showMore ? <X size={18} /> : <Grid3x3 size={18} />}
            </div>
            <span className="text-[11px] font-semibold">Thêm</span>
          </button>
        </div>
      </nav>

      {/* More Sheet */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="md:hidden fixed inset-0 bg-black/20 z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="md:hidden fixed bottom-[65px] left-0 right-0 z-40 bg-white rounded-t-[2rem] shadow-2xl border-t border-pink-50 px-6 pt-5 pb-6"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Tất cả tính năng</p>
              <div className="grid grid-cols-5 gap-3">
                {moreNav.map(p => (
                  <Link
                    key={p.to}
                    to={p.to}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${isActive(p.to) ? 'bg-pink-50 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="text-[10px] font-semibold text-center leading-tight">{p.label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-[65px] md:hidden" />
    </>
  );
};

const DesktopNavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean }> = ({ to, icon, label, active }) => (
  <Link to={to} className={`flex items-center gap-1.5 transition-colors font-medium ${active ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
    {icon}
    <span className="text-[13px]">{label}</span>
  </Link>
);

const MobileNavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean }> = ({ to, icon, label, active }) => (
  <Link to={to} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-h-[52px] justify-center ${active ? 'text-primary' : 'text-gray-400'}`}>
    <div className={`${active ? 'scale-110' : 'scale-100'} transition-transform`}>
      {icon}
    </div>
    <span className="text-[11px] font-semibold">{label}</span>
  </Link>
);

export default Navbar;
