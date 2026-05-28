export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  vendor: string;
  category_id: string;
  amount: number;
  date: string; // ISO date "YYYY-MM-DD"
  type: TransactionType;
  notes?: string;
  category_name?: string; // Optional for UI mapping
}

export interface TransactionCreate {
  vendor: string;
  category_id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  notes?: string;
}

export interface TransactionDraft extends TransactionCreate {}

export interface TransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ReceiptOcrResult {
  vendor: string;
  category_id: string | null;
  amount: number | null;
  date: string | null;
  type: TransactionType;
  notes?: string | null;
}


export interface TransactionFilters {
  categories?: string[];
  type?: 'income' | 'expense' | 'all';
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  orderBy?: 'date' | 'amount' | 'vendor';
  order?: 'asc' | 'desc';
}

export const EXPENSE_CATEGORIES = [
  'Housing',
  'Food',
  'Transportation',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Shopping',
  'Groceries',
] as const;

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts',
  'Refunds',
  'Income',
] as const;

export function getCategoryOptions(type: Transaction['type']) {
  return type.toUpperCase() === 'INCOME' ? [...INCOME_CATEGORIES] : [...EXPENSE_CATEGORIES];
}

export function filterTransactions(
  transactions: Transaction[],
  search = '',
  filters: TransactionFilters = {}
) {
  const query = search.trim().toLowerCase();

  return transactions.filter((tx) => {
    if (query) {
      const haystack = `${tx.vendor} ${tx.category_name ?? ''} ${tx.notes ?? ''}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (filters.type && filters.type !== 'all' && tx.type.toLowerCase() !== filters.type) {
      return false;
    }

    if (filters.categories?.length && !filters.categories.includes(tx.category_id)) {
      return false;
    }

    const txDate = new Date(tx.date);

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      if (txDate < from) {
        return false;
      }
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      if (txDate > to) {
        return false;
      }
    }

    if (filters.minAmount !== undefined && tx.amount < filters.minAmount) {
      return false;
    }

    if (filters.maxAmount !== undefined && tx.amount > filters.maxAmount) {
      return false;
    }

    return true;
  });
}

/**
 * Formats a VND amount for display: no decimals, dot-thousands, ₫ suffix.
 * Example: 1_250_000 → "1,250,000 ₫"
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    vendor: 'Co.opmart',
    category_id: '1', // Needs resolution
    amount: 2_150_000,
    date: '2026-04-13',
    type: 'EXPENSE',
    notes: 'Weekly grocery run',
  },
  {
    id: '2',
    vendor: 'Salary Deposit',
    category_id: '2', // Needs resolution
    amount: 28_000_000,
    date: '2026-04-13',
    type: 'INCOME',
    notes: 'March Salary',
  },
  {
    id: '3',
    vendor: 'CGV Cinemas',
    category_id: '3', // Needs resolution
    amount: 450_000,
    date: '2026-04-13',
    type: 'EXPENSE',
  },
  {
    id: '4',
    vendor: 'GrabBike',
    category_id: '4', // Needs resolution
    amount: 95_000,
    date: '2026-04-13',
    type: 'EXPENSE',
  },
  {
    id: '5',
    vendor: 'Shopee',
    category_id: '5', // Needs resolution
    amount: 1_380_000,
    date: '2026-04-13',
    type: 'EXPENSE',
    notes: 'Spring clothing haul',
  },
  {
    id: '6',
    vendor: 'Highlands Coffee',
    category_id: '6', // Needs resolution
    amount: 115_000,
    date: '2026-04-13',
    type: 'EXPENSE',
  },
];
