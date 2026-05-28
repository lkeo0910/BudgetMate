export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  user_id: string;
  category_name: string;
  monthly_limit: number | null;
  category_type: CategoryType;
  category_icon?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  category_name: string;
  monthly_limit: number | null;
  category_type: CategoryType;
  category_icon?: string | null;
}

export interface CategoryUpdate {
  category_name?: string;
  monthly_limit?: number | null;
  category_type?: CategoryType;
  category_icon?: string | null;
}
