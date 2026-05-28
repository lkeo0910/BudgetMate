import {
  addDays,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  endOfWeek,
  endOfYear,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from 'date-fns';

import type { Category } from '@/types/category';
import { formatVND, type Transaction } from '../types/transaction';

export type DashboardDatePreset = 'week' | 'month' | 'year' | 'custom';
export type InsightSeverity = 'info' | 'warning' | 'positive';
export type BillStatus = 'overdue' | 'due-soon' | 'upcoming';
export type BudgetHealthStatus = 'good' | 'warning' | 'poor';

export interface DashboardDateRange {
  from: Date;
  to: Date;
  preset: DashboardDatePreset;
}

export interface RecurringCashFlow {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  dayOfMonth: number;
}

export interface UpcomingBill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
}

export interface SavingsGoal {
  id: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
}

export interface ForecastPoint {
  date: string;
  label: string;
  balance: number;
}

export interface ForecastResult {
  points: ForecastPoint[];
  projectedBalance: number;
  changeAmount: number;
  daysRemaining: number;
}

export interface SmartInsight {
  id: string;
  severity: InsightSeverity;
  text: string;
}

export interface BudgetProgressItem {
  categoryId: string;
  categoryName: string;
  spent: number;
  limit: number;
  ratio: number;
}

export interface SavingsGoalView extends SavingsGoal {
  progressPercent: number;
  estimatedCompletionDate: string | null;
}

export interface UpcomingBillView extends UpcomingBill {
  status: BillStatus;
  daysUntilDue: number;
}

export interface BudgetHealthResult {
  score: number;
  status: BudgetHealthStatus;
  explanation: string;
}

const BILL_THRESHOLD_DAYS = 7;

export function createDemoBills(today: Date): UpcomingBill[] {
  return [
    {
      id: 'rent-payment',
      name: 'Rent Payment',
      amount: 1450,
      dueDate: format(addDays(today, 3), 'yyyy-MM-dd'),
      paid: false,
    },
    {
      id: 'internet-bill',
      name: 'Internet',
      amount: 70,
      dueDate: format(addDays(today, 5), 'yyyy-MM-dd'),
      paid: false,
    },
    {
      id: 'car-loan',
      name: 'Car Loan',
      amount: 320,
      dueDate: format(addDays(today, 10), 'yyyy-MM-dd'),
      paid: false,
    },
    {
      id: 'streaming',
      name: 'Streaming',
      amount: 19,
      dueDate: format(subDays(today, 1), 'yyyy-MM-dd'),
      paid: false,
    },
  ];
}

export function createDemoGoals(): SavingsGoal[] {
  return [
    { id: 'laptop', title: 'Buy a Laptop', currentAmount: 1200, targetAmount: 2000 },
    { id: 'trip', title: 'Vacation Trip', currentAmount: 850, targetAmount: 1500 },
    { id: 'emergency', title: 'Emergency Fund', currentAmount: 2400, targetAmount: 5000 },
  ];
}

export function formatDashboardCurrency(amount: number): string {
  return formatVND(amount);
}

export function formatDashboardDate(value: string | Date): string {
  const date = value instanceof Date ? value : parseDate(value);
  return format(date, 'MMM d');
}

export function getSignedAmountLabel(transaction: Pick<Transaction, 'amount' | 'type'>): string {
  const sign = transaction.type === 'INCOME' ? '+' : '-';
  return `${sign}${formatDashboardCurrency(transaction.amount)}`;
}

export function getRecentTransactionsState(transactions: Transaction[], isLoading: boolean): 'loading' | 'empty' | 'ready' {
  if (isLoading) {
    return 'loading';
  }
  return transactions.length === 0 ? 'empty' : 'ready';
}

export function parseDate(value: string): Date {
  return startOfDay(new Date(`${value}T00:00:00`));
}

export function getDateRange(
  preset: DashboardDatePreset,
  today: Date,
  customRange?: { from?: Date; to?: Date },
): DashboardDateRange {
  const currentDay = startOfDay(today);

  if (preset === 'week') {
    return { from: startOfWeek(currentDay, { weekStartsOn: 1 }), to: currentDay, preset };
  }

  if (preset === 'year') {
    return { from: startOfYear(currentDay), to: currentDay, preset };
  }

  if (preset === 'custom' && customRange?.from && customRange?.to) {
    return {
      from: startOfDay(customRange.from),
      to: startOfDay(customRange.to),
      preset,
    };
  }

  return { from: startOfMonth(currentDay), to: currentDay, preset: preset === 'custom' ? 'month' : preset };
}

export function getPreviousDateRange(range: DashboardDateRange): DashboardDateRange {
  const days = differenceInCalendarDays(range.to, range.from) + 1;
  const previousTo = subDays(range.from, 1);
  const previousFrom = subDays(previousTo, days - 1);
  return {
    from: previousFrom,
    to: previousTo,
    preset: range.preset,
  };
}

export function filterTransactionsByRange(transactions: Transaction[], range: DashboardDateRange): Transaction[] {
  return transactions.filter((transaction) => {
    const txDate = parseDate(transaction.date);
    return !isBefore(txDate, range.from) && !isAfter(txDate, range.to);
  });
}

export function getRecentTransactions(transactions: Transaction[], limit = 6): Transaction[] {
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

export function computeCurrentBalance(transactions: Transaction[]): number {
  return transactions.reduce((total, transaction) => {
    return total + (transaction.type === 'INCOME' ? transaction.amount : -transaction.amount);
  }, 0);
}

export function getTransactionSummary(transactions: Transaction[], categories: Category[]) {
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

export function getCategorySpendData(transactions: Transaction[], categories: Category[]) {
  const spendByCategory = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === 'EXPENSE')
    .forEach((transaction) => {
      spendByCategory.set(
        transaction.category_id,
        (spendByCategory.get(transaction.category_id) ?? 0) + transaction.amount,
      );
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

export function getBudgetProgressItems(categories: Category[], transactions: Transaction[]): BudgetProgressItem[] {
  const spendByCategory = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === 'EXPENSE')
    .forEach((transaction) => {
      spendByCategory.set(
        transaction.category_id,
        (spendByCategory.get(transaction.category_id) ?? 0) + transaction.amount,
      );
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

export function buildCashFlowForecast(params: {
  currentBalance: number;
  startingBalance?: number;
  recurringCashFlow?: RecurringCashFlow[];
  upcomingBills?: UpcomingBill[];
  realizedTransactions?: Transaction[];
  today: Date;
  range?: Pick<DashboardDateRange, 'preset' | 'from' | 'to'>;
}): ForecastResult {
  const recurringCashFlow = params.recurringCashFlow ?? [];
  const unpaidBills = (params.upcomingBills ?? []).filter((bill) => !bill.paid);
  const realizedTransactions = params.realizedTransactions ?? [];
  const today = startOfDay(params.today);
  const forecastStart = params.range ? startOfDay(params.range.from) : today;
  const forecastEnd = startOfDay(getForecastRangeEnd(params.range, today));

  let balance = params.startingBalance ?? params.currentBalance;
  const points: ForecastPoint[] = [];
  let previousBalance = balance;

  for (let cursor = forecastStart; !isAfter(cursor, forecastEnd); cursor = addDays(cursor, 1)) {
    realizedTransactions.forEach((transaction) => {
      if (parseDate(transaction.date).getTime() === cursor.getTime()) {
        balance += transaction.type === 'INCOME' ? transaction.amount : -transaction.amount;
      }
    });

    if (isAfter(cursor, today)) {
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

    const shouldIncludePoint =
      points.length === 0 || balance !== previousBalance || cursor.getTime() === forecastEnd.getTime();

    if (shouldIncludePoint) {
      points.push({
        date: format(cursor, 'yyyy-MM-dd'),
        label: format(cursor, 'MMM d'),
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
    daysRemaining: Math.max(differenceInCalendarDays(forecastEnd, forecastStart), 0),
  };
}

function getForecastRangeEnd(
  range: Pick<DashboardDateRange, 'preset' | 'from' | 'to'> | undefined,
  today: Date,
): Date {
  if (!range) {
    return endOfMonth(today);
  }

  if (range.preset === 'week') {
    return endOfWeek(range.to, { weekStartsOn: 1 });
  }

  if (range.preset === 'year') {
    return endOfYear(range.to);
  }

  if (range.preset === 'custom') {
    return range.to;
  }

  return endOfMonth(range.to);
}

export function inferRecurringCashFlowFromTransactions(
  transactions: Transaction[],
  today: Date,
): RecurringCashFlow[] {
  const grouped = new Map<
    string,
    {
      vendor: string;
      type: 'income' | 'expense';
      dates: Date[];
      amounts: number[];
    }
  >();

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
      const uniqueMonths = new Set(sortedDates.map((date) => format(date, 'yyyy-MM'))).size;

      if (sortedDates.length < 2 || uniqueMonths < 2) {
        return null;
      }

      const monthGaps = sortedDates
        .slice(1)
        .map((date, index) => differenceInCalendarMonths(date, sortedDates[index]));

      const averageMonthGap = monthGaps.reduce((sum, gap) => sum + gap, 0) / monthGaps.length;
      if (averageMonthGap > 2) {
        return null;
      }

      const averageAmount = entry.amounts.reduce((sum, amount) => sum + amount, 0) / entry.amounts.length;
      const averageDay = Math.round(
        sortedDates.reduce((sum, date) => sum + date.getDate(), 0) / sortedDates.length,
      );
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
      } satisfies RecurringCashFlow;
    })
    .filter((entry): entry is RecurringCashFlow => entry !== null);
}

export function getMonthlySavingsRate(transactions: Transaction[], range: DashboardDateRange): number {
  const summary = computeCurrentBalance(transactions);
  const days = Math.max(differenceInCalendarDays(range.to, range.from) + 1, 1);
  return (summary / days) * 30;
}

export function getSavingsGoalProgress(currentAmount: number, targetAmount: number): number {
  if (targetAmount <= 0) {
    return 0;
  }
  return Math.min((currentAmount / targetAmount) * 100, 100);
}

export function estimateGoalCompletionDate(goal: SavingsGoal, monthlySavingsRate: number, asOf: Date): string | null {
  if (goal.targetAmount <= 0 || goal.currentAmount >= goal.targetAmount) {
    return null;
  }

  if (monthlySavingsRate <= 0) {
    return null;
  }

  const remaining = goal.targetAmount - goal.currentAmount;
  const monthsNeeded = Math.ceil(remaining / monthlySavingsRate);
  return format(addDays(asOf, monthsNeeded * 30), 'MMM yyyy');
}

export function buildSavingsGoalViews(
  goals: SavingsGoal[],
  monthlySavingsRate: number,
  asOf: Date,
): SavingsGoalView[] {
  return goals.map((goal) => ({
    ...goal,
    progressPercent: getSavingsGoalProgress(goal.currentAmount, goal.targetAmount),
    estimatedCompletionDate: estimateGoalCompletionDate(goal, monthlySavingsRate, asOf),
  }));
}

export function getUpcomingBills(
  bills: UpcomingBill[],
  today: Date,
  thresholdDays = BILL_THRESHOLD_DAYS,
): UpcomingBillView[] {
  const currentDay = startOfDay(today);

  return bills
    .filter((bill) => !bill.paid)
    .map((bill) => {
      const dueDate = parseDate(bill.dueDate);
      const daysUntilDue = differenceInCalendarDays(dueDate, currentDay);
      let status: BillStatus = 'upcoming';

      if (daysUntilDue < 0) {
        status = 'overdue';
      } else if (daysUntilDue <= thresholdDays) {
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

export function generateSmartInsights(params: {
  currentTransactions: Transaction[];
  previousTransactions: Transaction[];
  categories: Category[];
  bills: UpcomingBill[];
  today: Date;
}): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const seen = new Set<string>();

  const addInsight = (insight: SmartInsight) => {
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
  } else if (summary.net < 0) {
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

export function calculateBudgetHealth(params: {
  currentTransactions: Transaction[];
  previousTransactions: Transaction[];
  categories: Category[];
  bills: UpcomingBill[];
  today: Date;
}): BudgetHealthResult {
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

  const score = Math.round(
    savingsScore * weights.savings +
      budgetScore * weights.budget +
      billScore * weights.bills +
      trendScore * weights.trend,
  );

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function groupExpensesByCategory(transactions: Transaction[]) {
  const grouped = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === 'EXPENSE')
    .forEach((transaction) => {
      grouped.set(transaction.category_id, (grouped.get(transaction.category_id) ?? 0) + transaction.amount);
    });

  return grouped;
}

const CATEGORY_COLORS = ['#2563eb', '#f97316', '#06b6d4', '#8b5cf6', '#14b8a6', '#ef4444'];
