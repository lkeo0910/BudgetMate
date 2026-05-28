"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDemoBills = createDemoBills;
exports.createDemoGoals = createDemoGoals;
exports.formatDashboardCurrency = formatDashboardCurrency;
exports.formatDashboardDate = formatDashboardDate;
exports.getSignedAmountLabel = getSignedAmountLabel;
exports.getRecentTransactionsState = getRecentTransactionsState;
exports.parseDate = parseDate;
exports.getDateRange = getDateRange;
exports.getPreviousDateRange = getPreviousDateRange;
exports.filterTransactionsByRange = filterTransactionsByRange;
exports.getRecentTransactions = getRecentTransactions;
exports.computeCurrentBalance = computeCurrentBalance;
exports.getTransactionSummary = getTransactionSummary;
exports.getCategorySpendData = getCategorySpendData;
exports.getBudgetProgressItems = getBudgetProgressItems;
exports.buildCashFlowForecast = buildCashFlowForecast;
exports.inferRecurringCashFlowFromTransactions = inferRecurringCashFlowFromTransactions;
exports.getMonthlySavingsRate = getMonthlySavingsRate;
exports.getSavingsGoalProgress = getSavingsGoalProgress;
exports.estimateGoalCompletionDate = estimateGoalCompletionDate;
exports.buildSavingsGoalViews = buildSavingsGoalViews;
exports.getUpcomingBills = getUpcomingBills;
exports.generateSmartInsights = generateSmartInsights;
exports.calculateBudgetHealth = calculateBudgetHealth;
const date_fns_1 = require("date-fns");
const transaction_1 = require("../types/transaction");
const BILL_THRESHOLD_DAYS = 7;
function createDemoBills(today) {
    return [
        {
            id: 'rent-payment',
            name: 'Rent Payment',
            amount: 1450,
            dueDate: (0, date_fns_1.format)((0, date_fns_1.addDays)(today, 3), 'yyyy-MM-dd'),
            paid: false,
        },
        {
            id: 'internet-bill',
            name: 'Internet',
            amount: 70,
            dueDate: (0, date_fns_1.format)((0, date_fns_1.addDays)(today, 5), 'yyyy-MM-dd'),
            paid: false,
        },
        {
            id: 'car-loan',
            name: 'Car Loan',
            amount: 320,
            dueDate: (0, date_fns_1.format)((0, date_fns_1.addDays)(today, 10), 'yyyy-MM-dd'),
            paid: false,
        },
        {
            id: 'streaming',
            name: 'Streaming',
            amount: 19,
            dueDate: (0, date_fns_1.format)((0, date_fns_1.subDays)(today, 1), 'yyyy-MM-dd'),
            paid: false,
        },
    ];
}
function createDemoGoals() {
    return [
        { id: 'laptop', title: 'Buy a Laptop', currentAmount: 1200, targetAmount: 2000 },
        { id: 'trip', title: 'Vacation Trip', currentAmount: 850, targetAmount: 1500 },
        { id: 'emergency', title: 'Emergency Fund', currentAmount: 2400, targetAmount: 5000 },
    ];
}
function formatDashboardCurrency(amount) {
    return (0, transaction_1.formatVND)(amount);
}
function formatDashboardDate(value) {
    const date = value instanceof Date ? value : parseDate(value);
    return (0, date_fns_1.format)(date, 'MMM d');
}
function getSignedAmountLabel(transaction) {
    const sign = transaction.type === 'INCOME' ? '+' : '-';
    return `${sign}${formatDashboardCurrency(transaction.amount)}`;
}
function getRecentTransactionsState(transactions, isLoading) {
    if (isLoading) {
        return 'loading';
    }
    return transactions.length === 0 ? 'empty' : 'ready';
}
function parseDate(value) {
    return (0, date_fns_1.startOfDay)(new Date(`${value}T00:00:00`));
}
function getDateRange(preset, today, customRange) {
    const currentDay = (0, date_fns_1.startOfDay)(today);
    if (preset === 'week') {
        return { from: (0, date_fns_1.startOfWeek)(currentDay, { weekStartsOn: 1 }), to: currentDay, preset };
    }
    if (preset === 'year') {
        return { from: (0, date_fns_1.startOfYear)(currentDay), to: currentDay, preset };
    }
    if (preset === 'custom' && customRange?.from && customRange?.to) {
        return {
            from: (0, date_fns_1.startOfDay)(customRange.from),
            to: (0, date_fns_1.startOfDay)(customRange.to),
            preset,
        };
    }
    return { from: (0, date_fns_1.startOfMonth)(currentDay), to: currentDay, preset: preset === 'custom' ? 'month' : preset };
}
function getPreviousDateRange(range) {
    const days = (0, date_fns_1.differenceInCalendarDays)(range.to, range.from) + 1;
    const previousTo = (0, date_fns_1.subDays)(range.from, 1);
    const previousFrom = (0, date_fns_1.subDays)(previousTo, days - 1);
    return {
        from: previousFrom,
        to: previousTo,
        preset: range.preset,
    };
}
function filterTransactionsByRange(transactions, range) {
    return transactions.filter((transaction) => {
        const txDate = parseDate(transaction.date);
        return !(0, date_fns_1.isBefore)(txDate, range.from) && !(0, date_fns_1.isAfter)(txDate, range.to);
    });
}
function getRecentTransactions(transactions, limit = 6) {
    return [...transactions]
        .sort((a, b) => {
        const diff = parseDate(b.date).getTime() - parseDate(a.date).getTime();
        if (diff !== 0) {
            return diff;
        }
        return a.vendor.localeCompare(b.vendor);
    })
        .slice(0, limit);
}
function computeCurrentBalance(transactions) {
    return transactions.reduce((total, transaction) => {
        return total + (transaction.type === 'INCOME' ? transaction.amount : -transaction.amount);
    }, 0);
}
function getTransactionSummary(transactions, categories) {
    const income = transactions
        .filter((transaction) => transaction.type === 'INCOME')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expense = transactions
        .filter((transaction) => transaction.type === 'EXPENSE')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
    const budgetLimit = categories
        .filter((category) => category.category_type === 'expense')
        .reduce((sum, category) => sum + (category.monthly_limit || 0), 0);
    const budgetRemaining = Math.max(budgetLimit - expense, 0);
    return {
        income,
        expense,
        net: income - expense,
        budgetLimit,
        budgetRemaining,
    };
}
function getCategorySpendData(transactions, categories) {
    const spendByCategory = new Map();
    transactions
        .filter((transaction) => transaction.type === 'EXPENSE')
        .forEach((transaction) => {
        spendByCategory.set(transaction.category_id, (spendByCategory.get(transaction.category_id) ?? 0) + transaction.amount);
    });
    return categories
        .map((category, index) => ({
        id: category.id,
        name: category.category_name,
        value: spendByCategory.get(category.id) ?? 0,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
        .filter((category) => category.value > 0)
        .sort((a, b) => b.value - a.value);
}
function getBudgetProgressItems(categories, transactions) {
    const spendByCategory = new Map();
    transactions
        .filter((transaction) => transaction.type === 'EXPENSE')
        .forEach((transaction) => {
        spendByCategory.set(transaction.category_id, (spendByCategory.get(transaction.category_id) ?? 0) + transaction.amount);
    });
    return categories
        .filter((category) => category.category_type === 'expense' && (category.monthly_limit ?? 0) > 0)
        .map((category) => {
        const spent = spendByCategory.get(category.id) ?? 0;
        const limit = category.monthly_limit ?? 0;
        const ratio = limit > 0 ? spent / limit : 0;
        return {
            categoryId: category.id,
            categoryName: category.category_name,
            spent,
            limit,
            ratio,
        };
    })
        .sort((a, b) => b.ratio - a.ratio);
}
function buildCashFlowForecast(params) {
    const recurringCashFlow = params.recurringCashFlow ?? [];
    const unpaidBills = (params.upcomingBills ?? []).filter((bill) => !bill.paid);
    const realizedTransactions = params.realizedTransactions ?? [];
    const today = (0, date_fns_1.startOfDay)(params.today);
    const forecastStart = params.range ? (0, date_fns_1.startOfDay)(params.range.from) : today;
    const forecastEnd = (0, date_fns_1.startOfDay)(getForecastRangeEnd(params.range, today));
    let balance = params.startingBalance ?? params.currentBalance;
    const points = [];
    let previousBalance = balance;
    for (let cursor = forecastStart; !(0, date_fns_1.isAfter)(cursor, forecastEnd); cursor = (0, date_fns_1.addDays)(cursor, 1)) {
        realizedTransactions.forEach((transaction) => {
            if (parseDate(transaction.date).getTime() === cursor.getTime()) {
                balance += transaction.type === 'INCOME' ? transaction.amount : -transaction.amount;
            }
        });
        if ((0, date_fns_1.isAfter)(cursor, today)) {
            recurringCashFlow.forEach((entry) => {
                if (cursor.getDate() === entry.dayOfMonth) {
                    balance += entry.type === 'income' ? entry.amount : -entry.amount;
                }
            });
            unpaidBills.forEach((bill) => {
                if (parseDate(bill.dueDate).getTime() === cursor.getTime()) {
                    balance -= bill.amount;
                }
            });
        }
        const shouldIncludePoint = points.length === 0 || balance !== previousBalance || cursor.getTime() === forecastEnd.getTime();
        if (shouldIncludePoint) {
            points.push({
                date: (0, date_fns_1.format)(cursor, 'yyyy-MM-dd'),
                label: (0, date_fns_1.format)(cursor, 'MMM d'),
                balance,
            });
        }
        previousBalance = balance;
    }
    const projectedBalance = points[points.length - 1]?.balance ?? params.currentBalance;
    return {
        points,
        projectedBalance,
        changeAmount: projectedBalance - params.currentBalance,
        daysRemaining: Math.max((0, date_fns_1.differenceInCalendarDays)(forecastEnd, forecastStart), 0),
    };
}
function getForecastRangeEnd(range, today) {
    if (!range) {
        return (0, date_fns_1.endOfMonth)(today);
    }
    if (range.preset === 'week') {
        return (0, date_fns_1.endOfWeek)(range.to, { weekStartsOn: 1 });
    }
    if (range.preset === 'year') {
        return (0, date_fns_1.endOfYear)(range.to);
    }
    if (range.preset === 'custom') {
        return range.to;
    }
    return (0, date_fns_1.endOfMonth)(range.to);
}
function inferRecurringCashFlowFromTransactions(transactions, today) {
    const grouped = new Map();
    transactions.forEach((transaction) => {
        const key = `${transaction.vendor}::${transaction.type}`;
        const entry = grouped.get(key) ?? {
            vendor: transaction.vendor,
            type: transaction.type === 'INCOME' ? 'income' : 'expense',
            dates: [],
            amounts: [],
        };
        entry.dates.push(parseDate(transaction.date));
        entry.amounts.push(transaction.amount);
        grouped.set(key, entry);
    });
    return [...grouped.entries()]
        .map(([key, entry]) => {
        const sortedDates = [...entry.dates].sort((a, b) => a.getTime() - b.getTime());
        const uniqueMonths = new Set(sortedDates.map((date) => (0, date_fns_1.format)(date, 'yyyy-MM'))).size;
        if (sortedDates.length < 2 || uniqueMonths < 2) {
            return null;
        }
        const monthGaps = sortedDates
            .slice(1)
            .map((date, index) => (0, date_fns_1.differenceInCalendarMonths)(date, sortedDates[index]));
        const averageMonthGap = monthGaps.reduce((sum, gap) => sum + gap, 0) / monthGaps.length;
        if (averageMonthGap > 2) {
            return null;
        }
        const averageAmount = entry.amounts.reduce((sum, amount) => sum + amount, 0) / entry.amounts.length;
        const averageDay = Math.round(sortedDates.reduce((sum, date) => sum + date.getDate(), 0) / sortedDates.length);
        const latestDate = sortedDates[sortedDates.length - 1];
        if (latestDate.getMonth() === today.getMonth() && latestDate.getFullYear() === today.getFullYear()) {
            return null;
        }
        return {
            id: `recurring-${key}`,
            name: entry.vendor,
            amount: averageAmount,
            type: entry.type,
            dayOfMonth: Math.min(Math.max(averageDay, 1), 28),
        };
    })
        .filter((entry) => entry !== null);
}
function getMonthlySavingsRate(transactions, range) {
    const summary = computeCurrentBalance(transactions);
    const days = Math.max((0, date_fns_1.differenceInCalendarDays)(range.to, range.from) + 1, 1);
    return (summary / days) * 30;
}
function getSavingsGoalProgress(currentAmount, targetAmount) {
    if (targetAmount <= 0) {
        return 0;
    }
    return Math.min((currentAmount / targetAmount) * 100, 100);
}
function estimateGoalCompletionDate(goal, monthlySavingsRate, asOf) {
    if (goal.targetAmount <= 0 || goal.currentAmount >= goal.targetAmount) {
        return null;
    }
    if (monthlySavingsRate <= 0) {
        return null;
    }
    const remaining = goal.targetAmount - goal.currentAmount;
    const monthsNeeded = Math.ceil(remaining / monthlySavingsRate);
    return (0, date_fns_1.format)((0, date_fns_1.addDays)(asOf, monthsNeeded * 30), 'MMM yyyy');
}
function buildSavingsGoalViews(goals, monthlySavingsRate, asOf) {
    return goals.map((goal) => ({
        ...goal,
        progressPercent: getSavingsGoalProgress(goal.currentAmount, goal.targetAmount),
        estimatedCompletionDate: estimateGoalCompletionDate(goal, monthlySavingsRate, asOf),
    }));
}
function getUpcomingBills(bills, today, thresholdDays = BILL_THRESHOLD_DAYS) {
    const currentDay = (0, date_fns_1.startOfDay)(today);
    return bills
        .filter((bill) => !bill.paid)
        .map((bill) => {
        const dueDate = parseDate(bill.dueDate);
        const daysUntilDue = (0, date_fns_1.differenceInCalendarDays)(dueDate, currentDay);
        let status = 'upcoming';
        if (daysUntilDue < 0) {
            status = 'overdue';
        }
        else if (daysUntilDue <= thresholdDays) {
            status = 'due-soon';
        }
        return {
            ...bill,
            status,
            daysUntilDue,
        };
    })
        .sort((a, b) => parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime());
}
function generateSmartInsights(params) {
    const insights = [];
    const seen = new Set();
    const addInsight = (insight) => {
        if (!seen.has(insight.id) && insights.length < 5) {
            seen.add(insight.id);
            insights.push(insight);
        }
    };
    const currentExpenses = groupExpensesByCategory(params.currentTransactions);
    const previousExpenses = groupExpensesByCategory(params.previousTransactions);
    const topIncrease = [...currentExpenses.entries()]
        .map(([categoryId, value]) => ({
        categoryId,
        current: value,
        previous: previousExpenses.get(categoryId) ?? 0,
    }))
        .filter((entry) => entry.previous > 0 && entry.current > entry.previous)
        .sort((a, b) => (b.current - b.previous) - (a.current - a.previous))[0];
    if (topIncrease && topIncrease.previous > 0) {
        const categoryName = params.categories.find((category) => category.id === topIncrease.categoryId)?.category_name ?? 'a category';
        const percentIncrease = Math.round(((topIncrease.current - topIncrease.previous) / topIncrease.previous) * 100);
        addInsight({
            id: `increase-${topIncrease.categoryId}`,
            severity: 'warning',
            text: `${categoryName} spending is up ${percentIncrease}% versus the previous period.`,
        });
    }
    getBudgetProgressItems(params.categories, params.currentTransactions)
        .filter((item) => item.ratio >= 0.85)
        .slice(0, 2)
        .forEach((item) => {
        const overBudget = item.ratio >= 1;
        addInsight({
            id: `budget-${item.categoryId}`,
            severity: 'warning',
            text: overBudget
                ? `${item.categoryName} is already over budget.`
                : `${item.categoryName} is at ${Math.round(item.ratio * 100)}% of budget.`,
        });
    });
    const overdueBill = getUpcomingBills(params.bills, params.today).find((bill) => bill.status === 'overdue');
    if (overdueBill) {
        addInsight({
            id: `bill-${overdueBill.id}`,
            severity: 'warning',
            text: `${overdueBill.name} is overdue and should be paid now.`,
        });
    }
    const summary = getTransactionSummary(params.currentTransactions, params.categories);
    if (summary.net > 0) {
        addInsight({
            id: 'positive-cash-flow',
            severity: 'positive',
            text: `You are on track to save ${formatDashboardCurrency(summary.net)} this period.`,
        });
    }
    else if (summary.net < 0) {
        addInsight({
            id: 'negative-cash-flow',
            severity: 'warning',
            text: `Your expenses exceed income by ${formatDashboardCurrency(Math.abs(summary.net))}.`,
        });
    }
    const highestExpense = [...currentExpenses.entries()]
        .sort((a, b) => b[1] - a[1])[0];
    if (highestExpense) {
        const categoryName = params.categories.find((category) => category.id === highestExpense[0])?.category_name ?? 'this category';
        addInsight({
            id: `opportunity-${highestExpense[0]}`,
            severity: 'info',
            text: `Reducing ${categoryName} could free up ${formatDashboardCurrency(highestExpense[1] * 0.1)} this period.`,
        });
    }
    return insights;
}
function calculateBudgetHealth(params) {
    const summary = getTransactionSummary(params.currentTransactions, params.categories);
    const upcomingBills = getUpcomingBills(params.bills, params.today);
    const savingsRate = summary.income > 0 ? Math.max(Math.min((summary.net / summary.income) * 100, 100), -100) : 0;
    const adherenceItems = getBudgetProgressItems(params.categories, params.currentTransactions);
    const averageBudgetUse = adherenceItems.length
        ? adherenceItems.reduce((sum, item) => sum + Math.min(item.ratio, 1.5), 0) / adherenceItems.length
        : 0;
    const overdueCount = upcomingBills.filter((bill) => bill.status === 'overdue').length;
    const currentExpense = summary.expense;
    const previousExpense = getTransactionSummary(params.previousTransactions, params.categories).expense;
    const spendingTrend = previousExpense > 0 ? (currentExpense - previousExpense) / previousExpense : 0;
    const weights = {
        savings: 0.35,
        budget: 0.3,
        bills: 0.2,
        trend: 0.15,
    };
    const savingsScore = summary.income === 0 && summary.expense > 0
        ? 0
        : clamp((savingsRate + 20) * 2, 0, 100);
    const budgetScore = clamp(100 - averageBudgetUse * 75, 0, 100);
    const billScore = clamp(100 - overdueCount * 45, 0, 100);
    const trendScore = clamp(100 - Math.max(spendingTrend, 0) * 100, 0, 100);
    const score = Math.round(savingsScore * weights.savings +
        budgetScore * weights.budget +
        billScore * weights.bills +
        trendScore * weights.trend);
    if (score >= 75) {
        return {
            score,
            status: 'good',
            explanation: 'Healthy cash flow, steady budgets, and bills are under control.',
        };
    }
    if (score >= 50) {
        return {
            score,
            status: 'warning',
            explanation: 'You are stable, but spending trends or bills need attention.',
        };
    }
    return {
        score,
        status: 'poor',
        explanation: 'Cash flow pressure is building and needs intervention soon.',
    };
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function groupExpensesByCategory(transactions) {
    const grouped = new Map();
    transactions
        .filter((transaction) => transaction.type === 'EXPENSE')
        .forEach((transaction) => {
        grouped.set(transaction.category_id, (grouped.get(transaction.category_id) ?? 0) + transaction.amount);
    });
    return grouped;
}
const CATEGORY_COLORS = ['#2563eb', '#f97316', '#06b6d4', '#8b5cf6', '#14b8a6', '#ef4444'];
