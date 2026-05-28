import type { Category } from '@/types/category';
import type { Transaction } from '@/types/transaction';

export type BudgetCategoryType = 'income' | 'expense';

export function inferCategoryType(
  category: Pick<Category, 'id' | 'category_name' | 'category_type'>,
  transactions: Pick<Transaction, 'category_id' | 'type'>[],
): BudgetCategoryType {
  if (category.category_type) {
    return category.category_type.toLowerCase() as BudgetCategoryType;
  }

  const relatedTransactions = transactions.filter((transaction) => transaction.category_id === category.id);
  if (relatedTransactions.some((transaction) => transaction.type === 'INCOME')) {
    return 'income';
  }
  if (relatedTransactions.some((transaction) => transaction.type === 'EXPENSE')) {
    return 'expense';
  }

  const normalizedName = category.category_name.toLowerCase();
  if (
    normalizedName.includes('salary') ||
    normalizedName.includes('income') ||
    normalizedName.includes('bonus') ||
    normalizedName.includes('freelance') ||
    normalizedName.includes('refund') ||
    normalizedName.includes('gift')
  ) {
    return 'income';
  }

  return 'expense';
}
