import React, { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, MapPin, Calendar, Gift, Home, Map, Ticket, Bell, Smile, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TAPS_REQUIRED = 5;
const TAP_RESET_MS = 1500;

const Navbar: React.FC = () => {
  const location = useLocation();
  const { role, toggleRole } = useAuth();
  const [_tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleLogoTap = () => {
    if (role === 'boyfriend') {
      toggleRole();
      return;
    }
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
        <div className="flex items-center gap-2 group mx-auto md:mx-0 cursor-pointer select-none" onClick={handleLogoTap}>
          <Heart className={`${role === 'boyfriend' ? 'text-blue-400 fill-blue-400' : 'text-primary fill-primary'} transition-all`} size={20} />
          <span className="romantic-font text-xl font-bold text-gray-800">
            {role === 'boyfriend' ? 'Quản lý Niyeuoi' : 'Niyeuoi'}
          </span>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-5">
          <DesktopNavLink to="/" icon={<Home size={16} />} label="Nhà" active={isActive('/')} />
          <DesktopNavLink to="/places" icon={<MapPin size={16} />} label="Ẩm thực" active={isActive('/places')} />
          <DesktopNavLink to="/timeline" icon={<Calendar size={16} />} label="Kỷ niệm" active={isActive('/timeline')} />
          <DesktopNavLink to="/challenges" icon={<Trophy size={16} />} label="Thử thách" active={isActive('/challenges')} />
          <DesktopNavLink to="/events" icon={<Bell size={16} />} label="Sự kiện" active={isActive('/events')} />
          <DesktopNavLink to="/wishlist" icon={<Gift size={16} />} label="Wishlist" active={isActive('/wishlist')} />
          <DesktopNavLink to="/map" icon={<Map size={16} />} label="Bản đồ" active={isActive('/map')} />
          <DesktopNavLink to="/coupons" icon={<Ticket size={16} />} label="Voucher" active={isActive('/coupons')} />
          <DesktopNavLink to="/mood" icon={<Smile size={16} />} label="Góc nhỏ" active={isActive('/mood')} />
        </div>
      </header>

      {/* Bottom Navigation - Only Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-pink-100 px-1 py-2 flex justify-around items-center z-50 pb-safe overflow-x-auto no-scrollbar">
        <MobileNavLink to="/" icon={<Home size={18} />} label="Nhà" active={isActive('/')} />
        <MobileNavLink to="/places" icon={<MapPin size={18} />} label="Quán" active={isActive('/places')} />
        <MobileNavLink to="/timeline" icon={<Calendar size={18} />} label="Lịch" active={isActive('/timeline')} />
        <MobileNavLink to="/challenges" icon={<Trophy size={18} />} label="Đua" active={isActive('/challenges')} />
        <MobileNavLink to="/events" icon={<Bell size={18} />} label="Sự kiện" active={isActive('/events')} />
        <MobileNavLink to="/wishlist" icon={<Gift size={18} />} label="Ước" active={isActive('/wishlist')} />
        <MobileNavLink to="/mood" icon={<Smile size={18} />} label="Mood" active={isActive('/mood')} />
      </nav>
      
      {/* Spacer for bottom nav on mobile */}
      <div className="h-20 md:hidden"></div>
    </>
  );
};

const DesktopNavLink: React.FC<{ to: string, icon: React.ReactNode, label: string, active: boolean }> = ({ to, icon, label, active }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-1.5 transition-colors font-medium ${active ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
  >
    {icon}
    <span className="text-[13px]">{label}</span>
  </Link>
);

const MobileNavLink: React.FC<{ to: string, icon: React.ReactNode, label: string, active: boolean }> = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all flex-shrink-0 min-h-[52px] justify-center ${active ? 'text-primary' : 'text-gray-400'}`}
  >
    <div className={`${active ? 'scale-110' : 'scale-100'} transition-transform`}>
      {icon}
    </div>
    <span className="text-[11px] font-semibold">{label}</span>
  </Link>
);

export default Navbar;
