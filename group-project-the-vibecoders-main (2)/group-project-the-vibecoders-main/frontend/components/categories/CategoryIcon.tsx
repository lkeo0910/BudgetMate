'use client';

import React from 'react';
import {
  BanknoteArrowUp,
  Briefcase,
  Car,
  Clapperboard,
  Coffee,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Receipt,
  PiggyBank,
  Plane,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Tv,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import type { CategoryIconKey } from '@/lib/category-presets';

const iconMap: Record<CategoryIconKey, React.ComponentType<{ className?: string }>> = {
  tag: Tag,
  'shopping-cart': ShoppingCart,
  house: House,
  car: Car,
  receipt: Receipt,
  film: Clapperboard,
  'shopping-bag': ShoppingBag,
  'heart-pulse': HeartPulse,
  'piggy-bank': PiggyBank,
  'banknote-arrow-up': BanknoteArrowUp,
  briefcase: Briefcase,
  wallet: Wallet,
  'utensils-crossed': UtensilsCrossed,
  plane: Plane,
  'graduation-cap': GraduationCap,
  tv: Tv,
  landmark: Landmark,
  gift: Gift,
  coffee: Coffee,
};

export function CategoryIcon({
  iconKey,
  className,
}: {
  iconKey: CategoryIconKey;
  className?: string;
}) {
  const Icon = iconMap[iconKey] ?? Tag;
  return <Icon className={className} />;
}
