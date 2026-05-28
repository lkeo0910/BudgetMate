"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Dashboard logic regression tests.
 * These tests keep date-range, forecast, formatting, and insight rules stable
 * so changes in dashboard helpers do not silently break the app.
 */
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const dashboard_1 = require("../lib/dashboard");
const categories = [
    { id: 'salary', user_id: 'u1', category_name: 'Salary', monthly_limit: 0, category_type: 'income', created_at: '', updated_at: '' },
    { id: 'groceries', user_id: 'u1', category_name: 'Groceries', monthly_limit: 300, category_type: 'expense', created_at: '', updated_at: '' },
    { id: 'rent', user_id: 'u1', category_name: 'Rent', monthly_limit: 1500, category_type: 'expense', created_at: '', updated_at: '' },
    { id: 'fun', user_id: 'u1', category_name: 'Entertainment', monthly_limit: 120, category_type: 'expense', created_at: '', updated_at: '' },
];
const transactions = [
    { id: '1', vendor: 'Payroll', category_id: 'salary', amount: 3000, date: '2026-04-01', type: 'INCOME' },
    { id: '2', vendor: 'Rent', category_id: 'rent', amount: 1400, date: '2026-04-03', type: 'EXPENSE' },
    { id: '3', vendor: 'Market', category_id: 'groceries', amount: 120, date: '2026-04-11', type: 'EXPENSE' },
    { id: '4', vendor: 'Cinema', category_id: 'fun', amount: 90, date: '2026-04-12', type: 'EXPENSE' },
];
(0, node_test_1.default)('recent transactions sort by most recent first', () => {
    const result = (0, dashboard_1.getRecentTransactions)(transactions, 3);
    strict_1.default.deepEqual(result.map((transaction) => transaction.id), ['4', '3', '2']);
});
(0, node_test_1.default)('correct sign display for income and expense', () => {
    strict_1.default.equal((0, dashboard_1.getSignedAmountLabel)(transactions[0]), '+3.000 ₫');
    strict_1.default.equal((0, dashboard_1.getSignedAmountLabel)(transactions[1]), '-1.400 ₫');
});
(0, node_test_1.default)('empty-state rendering helper returns empty', () => {
    strict_1.default.equal((0, dashboard_1.getRecentTransactionsState)([], false), 'empty');
});
(0, node_test_1.default)('currency formatting returns VND format', () => {
    strict_1.default.equal((0, dashboard_1.formatDashboardCurrency)(1450), '1.450 ₫');
});
(0, node_test_1.default)('budget summary and progress ignore income category assigned amounts', () => {
    const categoriesWithIncomeLimit = categories.map((category) => category.id === 'salary'
        ? { ...category, monthly_limit: 5000 }
        : category);
    const summary = (0, dashboard_1.getTransactionSummary)(transactions, categoriesWithIncomeLimit);
    const progress = (0, dashboard_1.getBudgetProgressItems)(categoriesWithIncomeLimit, transactions);
    strict_1.default.equal(summary.budgetLimit, 1920);
    strict_1.default.equal(summary.budgetRemaining, 310);
    strict_1.default.equal(progress.some((item) => item.categoryId === 'salary'), false);
});
(0, node_test_1.default)('forecast with income only', () => {
    const forecast = (0, dashboard_1.buildCashFlowForecast)({
        currentBalance: 1000,
        recurringCashFlow: [{ id: 'salary', name: 'Salary', amount: 500, type: 'income', dayOfMonth: 20 }],
        upcomingBills: [],
        today: new Date('2026-04-18'),
    });
    strict_1.default.equal(forecast.projectedBalance, 1500);
});
(0, node_test_1.default)('forecast with expenses only', () => {
    const forecast = (0, dashboard_1.buildCashFlowForecast)({
        currentBalance: 1000,
        recurringCashFlow: [{ id: 'rent', name: 'Rent', amount: 200, type: 'expense', dayOfMonth: 20 }],
        upcomingBills: [],
        today: new Date('2026-04-18'),
    });
    strict_1.default.equal(forecast.projectedBalance, 800);
});
(0, node_test_1.default)('recurring cash flow can be inferred from backend transactions', () => {
    const recurring = (0, dashboard_1.inferRecurringCashFlowFromTransactions)([
        { id: 'a', vendor: 'Salary', category_id: 'salary', amount: 3000, date: '2026-02-28', type: 'INCOME' },
        { id: 'b', vendor: 'Salary', category_id: 'salary', amount: 3000, date: '2026-03-28', type: 'INCOME' },
        { id: 'c', vendor: 'Rent', category_id: 'rent', amount: 1200, date: '2026-02-25', type: 'EXPENSE' },
        { id: 'd', vendor: 'Rent', category_id: 'rent', amount: 1200, date: '2026-03-25', type: 'EXPENSE' },
    ], new Date('2026-04-14'));
    strict_1.default.deepEqual(recurring.map((entry) => ({ name: entry.name, type: entry.type, dayOfMonth: entry.dayOfMonth })), [
        { name: 'Salary', type: 'income', dayOfMonth: 28 },
        { name: 'Rent', type: 'expense', dayOfMonth: 25 },
    ]);
});
(0, node_test_1.default)('forecast with mixed recurring events crossing below zero', () => {
    const forecast = (0, dashboard_1.buildCashFlowForecast)({
        currentBalance: 200,
        recurringCashFlow: [{ id: 'rent', name: 'Rent', amount: 500, type: 'expense', dayOfMonth: 20 }],
        upcomingBills: [{ id: 'loan', name: 'Loan', amount: 100, dueDate: '2026-04-21', paid: false }],
        today: new Date('2026-04-18'),
    });
    strict_1.default.equal(forecast.projectedBalance, -400);
});
(0, node_test_1.default)('end-of-month projected balance uses deterministic final point', () => {
    const forecast = (0, dashboard_1.buildCashFlowForecast)({
        currentBalance: 1000,
        recurringCashFlow: [{ id: 'bonus', name: 'Bonus', amount: 100, type: 'income', dayOfMonth: 30 }],
        upcomingBills: [],
        today: new Date('2026-04-29'),
    });
    strict_1.default.equal(forecast.points.at(-1)?.balance, 1100);
});
(0, node_test_1.default)('forecast respects the selected week filter horizon', () => {
    const forecast = (0, dashboard_1.buildCashFlowForecast)({
        currentBalance: 1000,
        recurringCashFlow: [{ id: 'salary', name: 'Salary', amount: 250, type: 'income', dayOfMonth: 19 }],
        upcomingBills: [],
        today: new Date('2026-04-14'),
        range: {
            preset: 'week',
            from: new Date('2026-04-13'),
            to: new Date('2026-04-14'),
        },
    });
    strict_1.default.equal(forecast.points[0]?.date, '2026-04-13');
    strict_1.default.equal(forecast.points.at(-1)?.date, '2026-04-19');
    strict_1.default.equal(forecast.projectedBalance, 1250);
});
(0, node_test_1.default)('forecast respects custom range without projecting past the selected end date', () => {
    const forecast = (0, dashboard_1.buildCashFlowForecast)({
        currentBalance: 1000,
        recurringCashFlow: [{ id: 'rent', name: 'Rent', amount: 300, type: 'expense', dayOfMonth: 18 }],
        upcomingBills: [],
        today: new Date('2026-04-14'),
        range: {
            preset: 'custom',
            from: new Date('2026-04-10'),
            to: new Date('2026-04-17'),
        },
    });
    strict_1.default.equal(forecast.points[0]?.date, '2026-04-10');
    strict_1.default.equal(forecast.points.at(-1)?.date, '2026-04-17');
    strict_1.default.equal(forecast.projectedBalance, 1000);
});
(0, node_test_1.default)('forecast starts from the beginning of selected month and year ranges', () => {
    const monthForecast = (0, dashboard_1.buildCashFlowForecast)({
        currentBalance: 1000,
        recurringCashFlow: [],
        upcomingBills: [],
        today: new Date('2026-04-14'),
        range: {
            preset: 'month',
            from: new Date('2026-04-01'),
            to: new Date('2026-04-14'),
        },
    });
    const yearForecast = (0, dashboard_1.buildCashFlowForecast)({
        currentBalance: 1000,
        recurringCashFlow: [],
        upcomingBills: [],
        today: new Date('2026-04-14'),
        range: {
            preset: 'year',
            from: new Date('2026-01-01'),
            to: new Date('2026-04-14'),
        },
    });
    strict_1.default.equal(monthForecast.points[0]?.date, '2026-04-01');
    strict_1.default.equal(yearForecast.points[0]?.date, '2026-01-01');
});
(0, node_test_1.default)('forecast fluctuates across the selected range using realized and future cash flow events', () => {
    const forecast = (0, dashboard_1.buildCashFlowForecast)({
        currentBalance: 1150,
        startingBalance: 500,
        realizedTransactions: [
            { id: 'salary', vendor: 'Payroll', category_id: 'salary', amount: 1000, date: '2026-04-01', type: 'INCOME' },
            { id: 'rent', vendor: 'Rent', category_id: 'rent', amount: 300, date: '2026-04-03', type: 'EXPENSE' },
            { id: 'food', vendor: 'Market', category_id: 'groceries', amount: 50, date: '2026-04-05', type: 'EXPENSE' },
        ],
        recurringCashFlow: [{ id: 'bonus', name: 'Bonus', amount: 200, type: 'income', dayOfMonth: 20 }],
        upcomingBills: [{ id: 'power', name: 'Power', amount: 100, dueDate: '2026-04-22', paid: false }],
        today: new Date('2026-04-14'),
        range: {
            preset: 'month',
            from: new Date('2026-04-01'),
            to: new Date('2026-04-14'),
        },
    });
    strict_1.default.deepEqual(forecast.points.map((point) => point.date), ['2026-04-01', '2026-04-03', '2026-04-05', '2026-04-20', '2026-04-22', '2026-04-30']);
    strict_1.default.equal(forecast.points[0]?.balance, 1500);
    strict_1.default.equal(forecast.points[1]?.balance, 1200);
    strict_1.default.equal(forecast.points[2]?.balance, 1150);
    strict_1.default.equal(forecast.points[3]?.balance, 1350);
    strict_1.default.equal(forecast.points[4]?.balance, 1250);
    strict_1.default.equal(forecast.points[5]?.balance, 1250);
    strict_1.default.equal(forecast.projectedBalance, 1250);
});
(0, node_test_1.default)('insight generated for spending increase and near-budget threshold without duplicates', () => {
    const insights = (0, dashboard_1.generateSmartInsights)({
        currentTransactions: transactions,
        previousTransactions: [
            { id: 'p1', vendor: 'Market', category_id: 'groceries', amount: 60, date: '2026-03-11', type: 'EXPENSE' },
        ],
        categories,
        bills: (0, dashboard_1.createDemoBills)(new Date('2026-04-14')),
        today: new Date('2026-04-14'),
    });
    strict_1.default.ok(insights.some((insight) => insight.text.includes('Groceries')));
    strict_1.default.equal(new Set(insights.map((insight) => insight.id)).size, insights.length);
});
(0, node_test_1.default)('insight generation is stable for the same input data', () => {
    const input = {
        currentTransactions: transactions,
        previousTransactions: [],
        categories,
        bills: (0, dashboard_1.createDemoBills)(new Date('2026-04-14')),
        today: new Date('2026-04-14'),
    };
    strict_1.default.deepEqual((0, dashboard_1.generateSmartInsights)(input), (0, dashboard_1.generateSmartInsights)(input));
});
(0, node_test_1.default)('progress percentage calculation caps at 100 and handles zero target', () => {
    strict_1.default.equal((0, dashboard_1.getSavingsGoalProgress)(500, 1000), 50);
    strict_1.default.equal((0, dashboard_1.getSavingsGoalProgress)(1200, 1000), 100);
    strict_1.default.equal((0, dashboard_1.getSavingsGoalProgress)(500, 0), 0);
});
(0, node_test_1.default)('estimated completion date is produced for positive monthly savings rate', () => {
    const goals = (0, dashboard_1.buildSavingsGoalViews)([{ id: 'goal', title: 'Laptop', currentAmount: 200, targetAmount: 800 }], 200, new Date('2026-04-14'));
    strict_1.default.equal(goals[0].estimatedCompletionDate, 'Jul 2026');
});
(0, node_test_1.default)('upcoming bills sort correctly and exclude paid items', () => {
    const bills = (0, dashboard_1.getUpcomingBills)([
        { id: 'paid', name: 'Paid', amount: 10, dueDate: '2026-04-10', paid: true },
        { id: 'soon', name: 'Soon', amount: 20, dueDate: '2026-04-16', paid: false },
        { id: 'later', name: 'Later', amount: 30, dueDate: '2026-04-21', paid: false },
        { id: 'old', name: 'Old', amount: 40, dueDate: '2026-04-12', paid: false },
    ], new Date('2026-04-14'), 3);
    strict_1.default.deepEqual(bills.map((bill) => bill.id), ['old', 'soon', 'later']);
    strict_1.default.equal(bills[0].status, 'overdue');
    strict_1.default.equal(bills[1].status, 'due-soon');
});
(0, node_test_1.default)('date range helpers support week month year and custom', () => {
    const today = new Date('2026-04-14');
    strict_1.default.equal((0, dashboard_1.getDateRange)('week', today).from.toISOString().slice(0, 10), '2026-04-13');
    strict_1.default.equal((0, dashboard_1.getDateRange)('month', today).from.toISOString().slice(0, 10), '2026-04-01');
    strict_1.default.equal((0, dashboard_1.getDateRange)('year', today).from.toISOString().slice(0, 10), '2026-01-01');
    strict_1.default.equal((0, dashboard_1.getDateRange)('custom', today, { from: new Date('2026-04-05'), to: new Date('2026-04-10') }).from.toISOString().slice(0, 10), '2026-04-05');
});
(0, node_test_1.default)('budget health scoring covers high medium and low scenarios', () => {
    const high = (0, dashboard_1.calculateBudgetHealth)({
        currentTransactions: [{ id: 'i', vendor: 'Payroll', category_id: 'salary', amount: 4000, date: '2026-04-01', type: 'INCOME' }],
        previousTransactions: [],
        categories,
        bills: [],
        today: new Date('2026-04-14'),
    });
    const medium = (0, dashboard_1.calculateBudgetHealth)({
        currentTransactions: transactions,
        previousTransactions: [{ id: 'old', vendor: 'Market', category_id: 'groceries', amount: 80, date: '2026-03-01', type: 'EXPENSE' }],
        categories,
        bills: [{ id: 'soon', name: 'Soon', amount: 20, dueDate: '2026-04-16', paid: false }],
        today: new Date('2026-04-14'),
    });
    const low = (0, dashboard_1.calculateBudgetHealth)({
        currentTransactions: [
            { id: 'l1', vendor: 'Rent', category_id: 'rent', amount: 2000, date: '2026-04-01', type: 'EXPENSE' },
        ],
        previousTransactions: [],
        categories,
        bills: [{ id: 'old', name: 'Old', amount: 50, dueDate: '2026-04-10', paid: false }],
        today: new Date('2026-04-14'),
    });
    strict_1.default.equal(high.status, 'good');
    strict_1.default.equal(medium.status, 'warning');
    strict_1.default.equal(low.status, 'poor');
});
