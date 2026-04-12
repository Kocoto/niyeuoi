import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, MapPin, Calendar, Gift, Home, Map, Ticket, Bell, Smile, Trophy, Grid3x3, X, MessageCircleHeart, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { motion, AnimatePresence } from 'framer-motion';
import { ROLE_NAME } from '../constants/roles';

const allPages = [
  { to: '/', icon: <Home size={22} />, label: 'Trang chu', emoji: 'Home' },
  { to: '/places', icon: <MapPin size={22} />, label: 'Am thuc', emoji: 'Food' },
  { to: '/timeline', icon: <Calendar size={22} />, label: 'Ky niem', emoji: 'Time' },
  { to: '/mood', icon: <Smile size={22} />, label: 'Goc nho', emoji: 'Mood' },
  { to: '/challenges', icon: <Trophy size={22} />, label: 'Thu thach', emoji: 'Goal' },
  { to: '/events', icon: <Bell size={22} />, label: 'Su kien', emoji: 'Plan' },
  { to: '/wishlist', icon: <Gift size={22} />, label: 'Wishlist', emoji: 'Wish' },
  { to: '/map', icon: <Map size={22} />, label: 'Ban do', emoji: 'Map' },
  { to: '/coupons', icon: <Ticket size={22} />, label: 'Voucher', emoji: 'Card' },
  { to: '/deeptalk', icon: <MessageCircleHeart size={22} />, label: 'Deep Talk', emoji: 'Chat' },
];

const primaryNav = allPages.slice(0, 4);
const moreNav = allPages.slice(4);

const Navbar: React.FC = () => {
  const location = useLocation();
  const { role, logout } = useAuth();
  const [showMore, setShowMore] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = moreNav.some(p => isActive(p.to));
  const { tracking } = useLocationTracker(role === 'girlfriend');

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-pink-50 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md md:px-6">
        <div className="flex items-center gap-2 select-none">
          <Heart className={`${role === 'boyfriend' ? 'fill-blue-400 text-blue-400' : 'fill-primary text-primary'} transition-all`} size={20} />
          <span className="romantic-font text-xl font-bold text-gray-800">
            {role === 'boyfriend' ? 'Niyeuoi · Duoc' : 'Niyeuoi · Ni'}
          </span>
          {tracking && (
            <span className="relative ml-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
          )}
        </div>

        <div className="hidden md:flex items-center gap-5">
          {allPages.map(p => (
            <DesktopNavLink key={p.to} to={p.to} icon={p.icon} label={p.label} active={isActive(p.to)} />
          ))}
        </div>

        {role && (
          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center rounded-full px-3 py-1 text-xs font-bold ${role === 'boyfriend' ? 'bg-sky-50 text-sky-600' : 'bg-pink-50 text-pink-600'}`}>
              Active: {ROLE_NAME[role]}
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
            >
              <LogOut size={14} />
              Switch user
            </button>
          </div>
        )}
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-pink-100 bg-white/95 pb-safe backdrop-blur-lg md:hidden">
        <div className="flex items-center justify-around px-2 py-1">
          {primaryNav.map(p => (
            <MobileNavLink key={p.to} to={p.to} icon={p.icon} label={p.label} active={isActive(p.to)} />
          ))}
          <button
            onClick={() => setShowMore(v => !v)}
            className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 transition-all ${isMoreActive || showMore ? 'text-primary' : 'text-gray-400'}`}
          >
            <div className={`${isMoreActive || showMore ? 'scale-110' : 'scale-100'} transition-transform`}>
              {showMore ? <X size={18} /> : <Grid3x3 size={18} />}
            </div>
            <span className="text-[11px] font-semibold">More</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="fixed inset-0 z-40 bg-black/20 md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed bottom-[65px] left-0 right-0 z-40 rounded-t-[2rem] border-t border-pink-50 bg-white px-6 pb-6 pt-5 shadow-2xl md:hidden"
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">All features</p>
              <div className="grid grid-cols-5 gap-3">
                {moreNav.map(p => (
                  <Link
                    key={p.to}
                    to={p.to}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all ${isActive(p.to) ? 'bg-pink-50 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className="text-xs font-bold uppercase text-gray-400">{p.emoji}</span>
                    <span className="text-center text-[10px] font-semibold leading-tight">{p.label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="h-[65px] md:hidden" />
    </>
  );
};

const DesktopNavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean }> = ({ to, icon, label, active }) => (
  <Link to={to} className={`flex items-center gap-1.5 font-medium transition-colors ${active ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
    {icon}
    <span className="text-[13px]">{label}</span>
  </Link>
);

const MobileNavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean }> = ({ to, icon, label, active }) => (
  <Link to={to} className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 transition-all ${active ? 'text-primary' : 'text-gray-400'}`}>
    <div className={`${active ? 'scale-110' : 'scale-100'} transition-transform`}>
      {icon}
    </div>
    <span className="text-[11px] font-semibold">{label}</span>
  </Link>
);

export default Navbar;
