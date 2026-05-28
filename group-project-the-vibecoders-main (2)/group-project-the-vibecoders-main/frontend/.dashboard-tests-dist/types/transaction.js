"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockTransactions = exports.INCOME_CATEGORIES = exports.EXPENSE_CATEGORIES = void 0;
exports.getCategoryOptions = getCategoryOptions;
exports.filterTransactions = filterTransactions;
exports.formatVND = formatVND;
exports.EXPENSE_CATEGORIES = [
    'Housing',
    'Food',
    'Transportation',
    'Entertainment',
    'Utilities',
    'Healthcare',
    'Shopping',
    'Groceries',
];
exports.INCOME_CATEGORIES = [
    'Salary',
    'Freelance',
    'Investments',
    'Gifts',
    'Refunds',
    'Income',
];
function getCategoryOptions(type) {
    return type.toUpperCase() === 'INCOME' ? [...exports.INCOME_CATEGORIES] : [...exports.EXPENSE_CATEGORIES];
}
function filterTransactions(transactions, search = '', filters = {}) {
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
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
}
exports.mockTransactions = [
    {
        id: '1',
        vendor: 'Co.opmart',
        category_id: '1', // Needs resolution
        amount: 2150000,
        date: '2026-04-13',
        type: 'EXPENSE',
        notes: 'Weekly grocery run',
    },
    {
        id: '2',
        vendor: 'Salary Deposit',
        category_id: '2', // Needs resolution
        amount: 28000000,
        date: '2026-04-13',
        type: 'INCOME',
        notes: 'March Salary',
    },
    {
        id: '3',
        vendor: 'CGV Cinemas',
        category_id: '3', // Needs resolution
        amount: 450000,
        date: '2026-04-13',
        type: 'EXPENSE',
    },
    {
        id: '4',
        vendor: 'GrabBike',
        category_id: '4', // Needs resolution
        amount: 95000,
        date: '2026-04-13',
        type: 'EXPENSE',
    },
    {
        id: '5',
        vendor: 'Shopee',
        category_id: '5', // Needs resolution
        amount: 1380000,
        date: '2026-04-13',
        type: 'EXPENSE',
        notes: 'Spring clothing haul',
    },
    {
        id: '6',
        vendor: 'Highlands Coffee',
        category_id: '6', // Needs resolution
        amount: 115000,
        date: '2026-04-13',
        type: 'EXPENSE',
    },
];
