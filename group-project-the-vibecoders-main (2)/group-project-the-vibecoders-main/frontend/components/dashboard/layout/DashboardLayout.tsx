'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DateRange } from 'react-day-picker';
import { CalendarDays } from 'lucide-react';
import { SummaryCards } from '@/components/dashboard/charts/SummaryCards';
import { SpendingChart } from '@/components/dashboard/charts/spending-chart';
import { BudgetProgressCard } from '@/components/dashboard/charts/BudgetProgressCard';
import { RecentTransactions } from '@/components/dashboard/transactions/RecentTransactions';
import {
  BudgetHealthCard,
  CashflowNotesCard,
  CashFlowForecastCard,
  SavingsGoalsCard,
  SmartInsightsCard,
} from '@/components/dashboard/cards/DashboardWidgets';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useTransactions } from '@/context/transaction-context';
import {
  type DashboardDatePreset,
  buildCashFlowForecast,
  buildSavingsGoalViews,
  calculateBudgetHealth,
  computeCurrentBalance,
  filterTransactionsByRange,
  formatDashboardCurrency,
  getBudgetProgressItems,
  getCategorySpendData,
  getDateRange,
  generateSmartInsights,
  inferRecurringCashFlowFromTransactions,
  getMonthlySavingsRate,
  getPreviousDateRange,
  getTransactionSummary,
} from '@/lib/dashboard';
import {
  buildSavingsGoalsFromState,
  createEmptySavingsGoalState,
  SAVINGS_GOALS_EVENT,
} from '@/lib/savings-goals';
import savingsGoalsService from '@/lib/services/savings-goals.service';

export function DashboardLayout() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const { transactions, categories, isLoading, getCategoryName, refreshTransactions } = useTransactions();

  const [preset, setPreset] = useState<DashboardDatePreset>('month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [goals, setGoals] = useState(() => buildSavingsGoalsFromState(createEmptySavingsGoalState()));

  useEffect(() => {
    refreshTransactions({ orderBy: 'date', order: 'desc' });
  }, [refreshTransactions]);

  useEffect(() => {
    let isMounted = true;

    const syncGoals = async () => {
      try {
        const goalState = await savingsGoalsService.getSavingsGoals();
        if (!isMounted) {
          return;
        }
        setGoals(buildSavingsGoalsFromState(goalState));
      } catch {
        if (!isMounted) {
          return;
        }
        setGoals(buildSavingsGoalsFromState(createEmptySavingsGoalState()));
      }
    };

    void syncGoals();
    const handleGoalsChanged = () => {
      void syncGoals();
    };
    const handleAuthChanged = () => {
      void syncGoals();
    };

    window.addEventListener(SAVINGS_GOALS_EVENT, handleGoalsChanged);
    window.addEventListener('auth-changed', handleAuthChanged);

    return () => {
      isMounted = false;
      window.removeEventListener(SAVINGS_GOALS_EVENT, handleGoalsChanged);
      window.removeEventListener('auth-changed', handleAuthChanged);
    };
  }, []);

  const activeRange = useMemo(
    () => getDateRange(preset, today, customRange),
    [preset, today, customRange],
  );
  const previousRange = useMemo(() => getPreviousDateRange(activeRange), [activeRange]);

  const filteredTransactions = useMemo(
    () => filterTransactionsByRange(transactions, activeRange),
    [transactions, activeRange],
  );
  const previousTransactions = useMemo(
    () => filterTransactionsByRange(transactions, previousRange),
    [transactions, previousRange],
  );

  const summary = useMemo(
    () => getTransactionSummary(filteredTransactions, categories),
    [filteredTransactions, categories],
  );
  const totalBalance = useMemo(() => computeCurrentBalance(transactions), [transactions]);
  const openingBalance = useMemo(
    () =>
      computeCurrentBalance(
        transactions.filter((transaction) => {
          const transactionDate = new Date(`${transaction.date}T00:00:00`);
          return transactionDate < activeRange.from;
        }),
      ),
    [transactions, activeRange],
  );
  const spendingData = useMemo(
    () => getCategorySpendData(filteredTransactions, categories),
    [filteredTransactions, categories],
  );
  const budgetProgress = useMemo(
    () => getBudgetProgressItems(categories, filteredTransactions).slice(0, 3),
    [categories, filteredTransactions],
  );
  const inferredRecurringCashFlow = useMemo(
    () => inferRecurringCashFlowFromTransactions(filteredTransactions, activeRange.to),
    [filteredTransactions, activeRange],
  );
  const forecast = useMemo(
    () =>
      buildCashFlowForecast({
        currentBalance: totalBalance,
        startingBalance: openingBalance,
        recurringCashFlow: inferredRecurringCashFlow,
        upcomingBills: [],
        realizedTransactions: filteredTransactions,
        today: activeRange.to,
        range: activeRange,
      }),
    [activeRange, filteredTransactions, inferredRecurringCashFlow, openingBalance, totalBalance],
  );
  const insights = useMemo(
    () =>
      generateSmartInsights({
        currentTransactions: filteredTransactions,
        previousTransactions,
        categories,
        bills: [],
        today,
      }),
    [filteredTransactions, previousTransactions, categories, today],
  );
  const monthlySavingsRate = useMemo(
    () => getMonthlySavingsRate(filteredTransactions, activeRange),
    [filteredTransactions, activeRange],
  );
  const savingsGoals = useMemo(
    () => buildSavingsGoalViews(goals, monthlySavingsRate, today),
    [goals, monthlySavingsRate, today],
  );
  const budgetHealth = useMemo(
    () =>
      calculateBudgetHealth({
        currentTransactions: filteredTransactions,
        previousTransactions,
        categories,
        bills: [],
        today,
      }),
    [filteredTransactions, previousTransactions, categories, today],
  );

  const summaryCards = useMemo(
    () => [
      {
        title: 'Total Balance',
        value: formatDashboardCurrency(totalBalance),
        change: `${filteredTransactions.length} transactions in range`,
        positive: totalBalance >= 0,
        icon: 'wallet' as const,
      },
      {
        title: 'This Period Spending',
        value: formatDashboardCurrency(summary.expense),
        change: summary.expense > 0 ? 'Expenses in selected period' : 'No expenses yet',
        positive: false,
        icon: 'expense' as const,
      },
      {
        title: 'This Period Income',
        value: formatDashboardCurrency(summary.income),
        change: summary.income > 0 ? 'Income in selected period' : 'No income yet',
        positive: true,
        icon: 'income' as const,
      },
      {
        title: 'Budget Remaining',
        value: formatDashboardCurrency(summary.budgetRemaining),
        change: summary.budgetLimit > 0 ? `${Math.round((summary.budgetRemaining / summary.budgetLimit) * 100)}% of budget left` : 'No budgets configured',
        positive: summary.budgetRemaining >= 0,
        icon: 'target' as const,
        href: '/budget',
      },
    ],
    [filteredTransactions.length, summary, totalBalance],
  );

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track what changed, what is next, and where your budget stands.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['week', 'month', 'year'] as DashboardDatePreset[]).map((value) => (
            <Button
              key={value}
              variant={preset === value ? 'default' : 'outline'}
              onClick={() => setPreset(value)}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={preset === 'custom' ? 'default' : 'outline'} onClick={() => setPreset('custom')}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Custom range
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={(range) => {
                  setPreset('custom');
                  setCustomRange(range);
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <SummaryCards cards={summaryCards} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <CashFlowForecastCard forecast={forecast} />
        <RecentTransactions
          transactions={filteredTransactions}
          isLoading={isLoading}
          getCategoryName={getCategoryName}
          onViewAll={() => router.push('/transactions')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr_1fr]">
        <SpendingChart data={spendingData} isLoading={isLoading} />
        <SmartInsightsCard insights={insights} />
        <SavingsGoalsCard goals={savingsGoals} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {budgetProgress.length > 0 ? (
          budgetProgress.map((item) => (
            <BudgetProgressCard
              key={item.categoryId}
              label={item.categoryName}
              spent={item.spent}
              limit={item.limit}
            />
          ))
        ) : (
          <div className="lg:col-span-3 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-muted-foreground">
            No category budgets available for this range yet.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <CashflowNotesCard forecast={forecast} />
        <BudgetHealthCard health={budgetHealth} />
      </div>
    </div>
  );
}
