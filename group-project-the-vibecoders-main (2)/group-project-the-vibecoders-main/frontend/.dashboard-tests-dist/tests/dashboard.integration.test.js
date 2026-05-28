"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const dashboard_1 = require("../lib/dashboard");
const categories = [
    { id: 'salary', user_id: 'u1', category_name: 'Salary', monthly_limit: 0, category_type: 'income', created_at: '', updated_at: '' },
    { id: 'groceries', user_id: 'u1', category_name: 'Groceries', monthly_limit: 300, category_type: 'expense', created_at: '', updated_at: '' },
];
const transactions = [
    { id: 'march', vendor: 'Old Payroll', category_id: 'salary', amount: 1000, date: '2026-03-30', type: 'INCOME' },
    { id: 'apr1', vendor: 'Payroll', category_id: 'salary', amount: 2000, date: '2026-04-01', type: 'INCOME' },
    { id: 'apr2', vendor: 'Market', category_id: 'groceries', amount: 100, date: '2026-04-02', type: 'EXPENSE' },
    { id: 'apr10', vendor: 'Market', category_id: 'groceries', amount: 60, date: '2026-04-10', type: 'EXPENSE' },
];
(0, node_test_1.default)('dashboard widgets use the same filtered dataset for a monthly view', () => {
    const range = (0, dashboard_1.getDateRange)('month', new Date('2026-04-14'));
    const filtered = (0, dashboard_1.filterTransactionsByRange)(transactions, range);
    const summary = (0, dashboard_1.getTransactionSummary)(filtered, categories);
    const recent = (0, dashboard_1.getRecentTransactions)(filtered, 2);
    const categorySpend = (0, dashboard_1.getCategorySpendData)(filtered, categories);
    strict_1.default.deepEqual(filtered.map((transaction) => transaction.id), ['apr1', 'apr2', 'apr10']);
    strict_1.default.equal(summary.income, 2000);
    strict_1.default.equal(summary.expense, 160);
    strict_1.default.deepEqual(recent.map((transaction) => transaction.id), ['apr10', 'apr2']);
    strict_1.default.equal(categorySpend[0].value, 160);
});
(0, node_test_1.default)('previous period range stays aligned with custom range length', () => {
    const currentRange = (0, dashboard_1.getDateRange)('custom', new Date('2026-04-14'), {
        from: new Date('2026-04-05'),
        to: new Date('2026-04-10'),
    });
    const previousRange = (0, dashboard_1.getPreviousDateRange)(currentRange);
    strict_1.default.equal(previousRange.from.toISOString().slice(0, 10), '2026-03-30');
    strict_1.default.equal(previousRange.to.toISOString().slice(0, 10), '2026-04-04');
});
