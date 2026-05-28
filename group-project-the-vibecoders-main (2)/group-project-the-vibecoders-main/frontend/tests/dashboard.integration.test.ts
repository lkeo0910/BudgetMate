import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterTransactionsByRange,
  getCategorySpendData,
  getDateRange,
  getPreviousDateRange,
  getRecentTransactions,
  getTransactionSummary,
} from '../lib/dashboard';
import type { Category } from '../types/category';
import type { Transaction } from '../types/transaction';

const categories: Category[] = [
  { id: 'salary', user_id: 'u1', category_name: 'Salary', monthly_limit: 0, category_type: 'income', created_at: '', updated_at: '' },
  { id: 'groceries', user_id: 'u1', category_name: 'Groceries', monthly_limit: 300, category_type: 'expense', created_at: '', updated_at: '' },
];

const transactions: Transaction[] = [
  { id: 'march', vendor: 'Old Payroll', category_id: 'salary', amount: 1000, date: '2026-03-30', type: 'INCOME' },
  { id: 'apr1', vendor: 'Payroll', category_id: 'salary', amount: 2000, date: '2026-04-01', type: 'INCOME' },
  { id: 'apr2', vendor: 'Market', category_id: 'groceries', amount: 100, date: '2026-04-02', type: 'EXPENSE' },
  { id: 'apr10', vendor: 'Market', category_id: 'groceries', amount: 60, date: '2026-04-10', type: 'EXPENSE' },
];

test('dashboard widgets use the same filtered dataset for a monthly view', () => {
  const range = getDateRange('month', new Date('2026-04-14'));
  const filtered = filterTransactionsByRange(transactions, range);
  const summary = getTransactionSummary(filtered, categories);
  const recent = getRecentTransactions(filtered, 2);
  const categorySpend = getCategorySpendData(filtered, categories);

  assert.deepEqual(filtered.map((transaction) => transaction.id), ['apr1', 'apr2', 'apr10']);
  assert.equal(summary.income, 2000);
  assert.equal(summary.expense, 160);
  assert.deepEqual(recent.map((transaction) => transaction.id), ['apr10', 'apr2']);
  assert.equal(categorySpend[0].value, 160);
});

test('previous period range stays aligned with custom range length', () => {
  const currentRange = getDateRange('custom', new Date('2026-04-14'), {
    from: new Date('2026-04-05'),
    to: new Date('2026-04-10'),
  });
  const previousRange = getPreviousDateRange(currentRange);

  assert.equal(previousRange.from.toISOString().slice(0, 10), '2026-03-30');
  assert.equal(previousRange.to.toISOString().slice(0, 10), '2026-04-04');
});
