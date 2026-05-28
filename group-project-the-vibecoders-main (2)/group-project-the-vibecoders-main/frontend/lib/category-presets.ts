import type { Category, CategoryType } from '@/types/category';

export type CategoryIconKey =
  | 'tag'
  | 'shopping-cart'
  | 'house'
  | 'car'
  | 'receipt'
  | 'film'
  | 'shopping-bag'
  | 'heart-pulse'
  | 'piggy-bank'
  | 'banknote-arrow-up'
  | 'briefcase'
  | 'wallet'
  | 'utensils-crossed'
  | 'plane'
  | 'graduation-cap'
  | 'tv'
  | 'landmark'
  | 'gift'
  | 'coffee';

export interface CategoryPreset {
  name: string;
  type: CategoryType;
  iconKey: CategoryIconKey;
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  { name: 'Groceries', type: 'expense', iconKey: 'shopping-cart' },
  { name: 'Rent', type: 'expense', iconKey: 'house' },
  { name: 'Transport', type: 'expense', iconKey: 'car' },
  { name: 'Utilities', type: 'expense', iconKey: 'receipt' },
  { name: 'Entertainment', type: 'expense', iconKey: 'film' },
  { name: 'Shopping', type: 'expense', iconKey: 'shopping-bag' },
  { name: 'Healthcare', type: 'expense', iconKey: 'heart-pulse' },
  { name: 'Food', type: 'expense', iconKey: 'utensils-crossed' },
  { name: 'Travel', type: 'expense', iconKey: 'plane' },
  { name: 'Education', type: 'expense', iconKey: 'graduation-cap' },
  { name: 'Subscriptions', type: 'expense', iconKey: 'tv' },
  { name: 'Coffee', type: 'expense', iconKey: 'coffee' },
  { name: 'Gifts', type: 'expense', iconKey: 'gift' },
  { name: 'Goals', type: 'expense', iconKey: 'piggy-bank' },
  { name: 'Salary', type: 'income', iconKey: 'banknote-arrow-up' },
  { name: 'Freelance', type: 'income', iconKey: 'briefcase' },
  { name: 'Other Income', type: 'income', iconKey: 'wallet' },
  { name: 'Bonus', type: 'income', iconKey: 'gift' },
  { name: 'Savings', type: 'income', iconKey: 'landmark' },
];

export function getPresetByName(name: string, type?: CategoryType): CategoryPreset | undefined {
  return CATEGORY_PRESETS.find((preset) => {
    if (preset.name.toLowerCase() !== name.trim().toLowerCase()) {
      return false;
    }
    return type ? preset.type === type : true;
  });
}

export function getRemainingCategoryPresets(categories: Category[], type: CategoryType): CategoryPreset[] {
  const existingNames = new Set(
    categories
      .filter((category) => category.category_type === type)
      .map((category) => category.category_name.trim().toLowerCase()),
  );

  return CATEGORY_PRESETS.filter((preset) => preset.type === type && !existingNames.has(preset.name.toLowerCase()));
}

export function inferCategoryIconKey(category: Pick<Category, 'category_name' | 'category_type' | 'category_icon'>): CategoryIconKey {
  if (category.category_icon) {
    return category.category_icon as CategoryIconKey;
  }

  const preset = getPresetByName(category.category_name, category.category_type);
  if (preset) {
    return preset.iconKey;
  }

  return category.category_type === 'income' ? 'wallet' : 'tag';
}
