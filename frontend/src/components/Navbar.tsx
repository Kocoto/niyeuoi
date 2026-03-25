import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Calendar, Gift, User, Menu } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm px-6 py-4 flex items-center justify-between border-b border-pink-100">
      <Link to="/" className="flex items-center gap-2 group">
        <Heart className="text-primary fill-primary group-hover:scale-110 transition-transform" />
        <span className="romantic-font text-2xl font-bold text-gray-800">Niyeuoi</span>
      </Link>
      
      <div className="hidden md:flex items-center gap-8">
        <NavLink to="/places" icon={<MapPin size={18} />} label="Sổ tay Ẩm thực" />
        <NavLink to="/timeline" icon={<Calendar size={18} />} label="Kỷ niệm" />
        <NavLink to="/wishlist" icon={<Gift size={18} />} label="Wishlist" />
        <NavLink to="/map" icon={<User size={18} />} label="Tình yêu" />
      </div>

      <button className="md:hidden text-gray-600">
        <Menu />
      </button>
    </nav>
  );
};

const NavLink: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => (
  <Link to={to} className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium">
    {icon}
    <span>{label}</span>
  </Link>
);

export default Navbar;
