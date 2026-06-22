import React from 'react';
import {
  Utensils, Gamepad2, Heart, ShoppingBag, Car, Stethoscope, Home,
  PiggyBank, CircleEllipsis, Coffee, Plane, Gift, Music, Book, Dumbbell,
  Wallet, ArrowLeftRight, CalendarCheck, HeartHandshake,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  utensils: Utensils,
  'gamepad-2': Gamepad2,
  heart: Heart,
  'shopping-bag': ShoppingBag,
  car: Car,
  stethoscope: Stethoscope,
  home: Home,
  'piggy-bank': PiggyBank,
  'circle-ellipsis': CircleEllipsis,
  coffee: Coffee,
  plane: Plane,
  gift: Gift,
  music: Music,
  book: Book,
  dumbbell: Dumbbell,
  wallet: Wallet,
  'arrow-left-right': ArrowLeftRight,
  'calendar-check': CalendarCheck,
  'heart-handshake': HeartHandshake,
};

interface CategoryIconProps {
  name: string;
  size?: number;
  className?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ name, size = 16, className }) => {
  const Icon = ICON_MAP[name] ?? CircleEllipsis;
  return <Icon size={size} className={className} />;
};

export default CategoryIcon;
