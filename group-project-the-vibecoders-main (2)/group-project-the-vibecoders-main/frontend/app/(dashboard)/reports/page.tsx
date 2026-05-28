'use client';

import React, { useMemo, useState } from 'react';
import {
  differenceInCalendarDays,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { usePathname } from 'next/navigation';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sankey,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  CalendarRange,
  ChartColumn,
  ChartLine,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTransactions } from '@/context/transaction-context';
import { formatVND, type Transaction } from '@/types/transaction';
import transactionService from '@/lib/services/transaction.service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const REPORT_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#14b8a6', '#f97316'];

type ReportRange = '1w' | '1m' | '6m' | '12m' | 'all' | 'custom';
type ChartMode = 'overview' | 'bars' | 'trend' | 'flow';
type SankeyNodeRole = 'income' | 'hub' | 'savings' | 'expense' | 'deficit';
type FlowNode = {
  name: string;
  role: SankeyNodeRole;
  value: number;
  fill: string;
};
type FlowLink = {
  source: number;
  target: number;
  value: number;
  color: string;
};

function parseLocalDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function getRangeLabel(range: ReportRange) {
  if (range === '6m') {
    return 'Last 6 months';
  }
  if (range === '1m') {
    return 'Last month';
  }
  if (range === '1w') {
    return 'Last 7 days';
  }
  if (range === '12m') {
    return 'Last year';
  }
  if (range === 'custom') {
    return 'Custom range';
  }
  return 'All time';
}

function getPresetRangeBounds(range: '1w' | '1m' | '6m' | '12m', today: Date) {
  const to = startOfDay(today);

  if (range === '1w') {
    const from = new Date(to);
    from.setDate(from.getDate() - 6);
    return { from, to };
  }

  if (range === '1m') {
    return { from: startOfDay(subMonths(to, 1)), to };
  }

  if (range === '6m') {
    return { from: startOfMonth(subMonths(to, 5)), to };
  }

  return { from: startOfMonth(subMonths(to, 11)), to };
}

function filterTransactionsByRange(
  transactions: Transaction[],
  range: ReportRange,
  customRange?: DateRange,
) {
  if (range === 'custom') {
    const from = customRange?.from ? startOfDay(customRange.from) : undefined;
    const to = customRange?.to ? startOfDay(customRange.to) : undefined;

    return transactions.filter((transaction) => {
      const date = parseLocalDate(transaction.date);
      if (from && isBefore(date, from)) {
        return false;
      }
      if (to && isAfter(date, to)) {
        return false;
      }
      return true;
    });
  }

  if (range === 'all') {
    return transactions;
  }

  const today = new Date();
  const { from, to } = getPresetRangeBounds(range, today);

  return transactions.filter((transaction) => {
    const date = parseLocalDate(transaction.date);
    return !isBefore(date, from) && !isAfter(date, to);
  });
}

function getReportBucketMode(range: ReportRange, customRange?: DateRange) {
  if (range === 'custom' && customRange?.from && customRange?.to) {
    const days = differenceInCalendarDays(startOfDay(customRange.to), startOfDay(customRange.from)) + 1;

    if (days <= 31) {
      return 'day' as const;
    }

    if (days <= 120) {
      return 'week' as const;
    }
  }

  if (range === '6m') {
    return 'week' as const;
  }

  if (range === '1w' || range === '1m') {
    return 'day' as const;
  }

  return 'month' as const;
}

export default function ReportsPage() {
  const pathname = usePathname();
  const { transactions, categories, isLoading: isContextLoading, refreshTransactions } = useTransactions();
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState<ReportRange>('1m');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [chartMode, setChartMode] = useState<ChartMode>('overview');

  React.useEffect(() => {
    if (pathname?.startsWith('/reports')) {
      setChartMode('overview');
    }
  }, [pathname]);

  React.useEffect(() => {
    refreshTransactions({ orderBy: 'date', order: 'desc' });
  }, [refreshTransactions]);

  React.useEffect(() => {
    setIsLoading(isContextLoading);
  }, [isContextLoading]);

  const filteredTransactions = useMemo(
    () => filterTransactionsByRange(transactions, range, customRange),
    [transactions, range, customRange],
  );

  const bucketMode = useMemo(
    () => getReportBucketMode(range, customRange),
    [range, customRange],
  );

  const cashflowData = useMemo(() => {
    const bucket = new Map<string, { label: string; income: number; expense: number; net: number }>();

    filteredTransactions.forEach((transaction) => {
      const date = parseLocalDate(transaction.date);
      const bucketStart =
        bucketMode === 'day'
          ? date
          : bucketMode === 'week'
            ? startOfWeek(date, { weekStartsOn: 1 })
            : startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
      const bucketEnd =
        bucketMode === 'week'
          ? endOfWeek(date, { weekStartsOn: 1 })
          : bucketStart;
      const key = format(bucketStart, bucketMode === 'day' ? 'yyyy-MM-dd' : bucketMode === 'week' ? 'yyyy-MM-dd' : 'yyyy-MM');
      const label =
        bucketMode === 'day'
          ? format(bucketStart, 'MMM d')
          : bucketMode === 'week'
            ? `${format(bucketStart, 'MMM d')} - ${format(bucketEnd, 'MMM d')}`
            : format(bucketStart, 'MMM yyyy');
      const current = bucket.get(key) ?? { label, income: 0, expense: 0, net: 0 };

      if (transaction.type === 'INCOME') {
        current.income += transaction.amount;
      } else {
        current.expense += transaction.amount;
      }

      current.net = current.income - current.expense;
      bucket.set(key, current);
    });

    return Array.from(bucket.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, value]) => value);
  }, [bucketMode, filteredTransactions]);

  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((transaction) => transaction.type === 'INCOME')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expense = filteredTransactions
      .filter((transaction) => transaction.type === 'EXPENSE')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const net = income - expense;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;

    return { income, expense, net, savingsRate };
  }, [filteredTransactions]);

  const expenseByCategory = useMemo(() => {
    const bucket = new Map<string, number>();

    filteredTransactions
      .filter((transaction) => transaction.type === 'EXPENSE')
      .forEach((transaction) => {
        const categoryName = categories.find((category) => category.id === transaction.category_id)?.category_name ?? 'Uncategorized';
        bucket.set(categoryName, (bucket.get(categoryName) ?? 0) + transaction.amount);
      });

    return Array.from(bucket.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: REPORT_COLORS[index % REPORT_COLORS.length],
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6);
  }, [categories, filteredTransactions]);

  const incomeByCategory = useMemo(() => {
    const bucket = new Map<string, number>();

    filteredTransactions
      .filter((transaction) => transaction.type === 'INCOME')
      .forEach((transaction) => {
        const categoryName = categories.find((category) => category.id === transaction.category_id)?.category_name ?? 'Uncategorized';
        bucket.set(categoryName, (bucket.get(categoryName) ?? 0) + transaction.amount);
      });

    return Array.from(bucket.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6);
  }, [categories, filteredTransactions]);

  const averageNet = useMemo(() => {
    if (cashflowData.length === 0) {
      return 0;
    }

    return cashflowData.reduce((sum, period) => sum + period.net, 0) / cashflowData.length;
  }, [cashflowData]);

  const strongestMonth = useMemo(() => {
    return [...cashflowData].sort((a, b) => b.net - a.net)[0] ?? null;
  }, [cashflowData]);

  const weakestMonth = useMemo(() => {
    return [...cashflowData].sort((a, b) => a.net - b.net)[0] ?? null;
  }, [cashflowData]);

  const cashflowDateLabel = useMemo(() => {
    if (range === 'custom') {
      if (customRange?.from && customRange?.to) {
        return `${format(customRange.from, 'MMM d, yyyy')} - ${format(customRange.to, 'MMM d, yyyy')}`;
      }
      if (customRange?.from) {
        return `${format(customRange.from, 'MMM d, yyyy')} - Select end date`;
      }
      return 'Select start and end date';
    }

    if (range !== 'all') {
      const { from, to } = getPresetRangeBounds(range, new Date());
      return `${format(from, 'MMM d, yyyy')} - ${format(to, 'MMM d, yyyy')}`;
    }

    if (filteredTransactions.length === 0) {
      return getRangeLabel('all');
    }

    const sortedDates = filteredTransactions
      .map((transaction) => parseLocalDate(transaction.date))
      .sort((left, right) => left.getTime() - right.getTime());

    return `${format(sortedDates[0], 'MMM d, yyyy')} - ${format(sortedDates[sortedDates.length - 1], 'MMM d, yyyy')}`;
  }, [customRange, filteredTransactions, range]);

  const cashflowFlowData = useMemo(() => {
    const expenseEntries = expenseByCategory.length > 5
      ? [
          ...expenseByCategory.slice(0, 4),
          {
            name: 'Other Expenses',
            value: expenseByCategory.slice(4).reduce((sum, entry) => sum + entry.value, 0),
            color: '#94a3b8',
          },
        ]
      : expenseByCategory;

    const incomeNodes: FlowNode[] = incomeByCategory.map((entry) => ({
      name: entry.name,
      role: 'income',
      value: entry.value,
      fill: '#38bdf8',
    }));
    const deficitValue = Math.max(totals.expense - totals.income, 0);
    const deficitNodes: FlowNode[] = deficitValue > 0
      ? [
          {
            name: 'Deficit Funding',
            role: 'deficit',
            value: deficitValue,
            fill: '#f59e0b',
          },
        ]
      : [];
    const expenseNodes: FlowNode[] = expenseEntries.map((entry) => ({
      name: entry.name,
      role: 'expense',
      value: entry.value,
      fill: entry.color,
    }));

    const availableValue = totals.income + deficitValue;

    const nodes: FlowNode[] = [
      ...incomeNodes,
      ...deficitNodes,
      {
        name: 'Available Cash',
        role: 'hub',
        value: availableValue,
        fill: '#0f172a',
      },
      {
        name: 'Savings',
        role: 'savings',
        value: Math.max(totals.net, 0),
        fill: '#16a34a',
      },
      ...expenseNodes,
    ];

    const availableIndex = incomeNodes.length + deficitNodes.length;
    const savingsIndex = availableIndex + 1;
    const expenseStartIndex = savingsIndex + 1;
    const deficitIndex = incomeNodes.length;

    const links: FlowLink[] = [
      ...incomeByCategory.map((entry, index) => ({
        source: index,
        target: availableIndex,
        value: entry.value,
        color: '#93c5fd',
      })),
      ...(deficitValue > 0
        ? [
            {
              source: deficitIndex,
              target: availableIndex,
              value: deficitValue,
              color: '#fbbf24',
            },
          ]
        : []),
      ...(totals.net > 0
        ? [
            {
              source: availableIndex,
              target: savingsIndex,
              value: totals.net,
              color: '#86efac',
            },
          ]
        : []),
      ...expenseEntries.map((entry, index) => ({
        source: availableIndex,
        target: expenseStartIndex + index,
        value: entry.value,
        color: entry.color,
      })),
    ];

    return { nodes, links };
  }, [expenseByCategory, incomeByCategory, totals.expense, totals.income, totals.net]);

  const chartModes: Array<{
    id: ChartMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'bars', label: 'Bars', icon: ChartColumn },
    { id: 'trend', label: 'Trend', icon: ChartLine },
    { id: 'flow', label: 'Flow', icon: Wallet },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-emerald-50/70 p-6 shadow-sm">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Reports</p>
            <h1 className="text-4xl font-semibold text-slate-900">Cash Flow Report</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-500">
              Review income, expenses, savings rate, and category movement over time using your real transaction history.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              <CalendarRange className="h-4 w-4" />
              {cashflowDateLabel}
            </div>
            {([
              { id: '1w', label: '1W' },
              { id: '1m', label: '1M' },
              { id: '6m', label: '6M' },
              { id: '12m', label: '1Y' },
              { id: 'all', label: 'All' },
            ] as const).map((option) => (
              <Button
                key={option.id}
                variant={range === option.id ? 'default' : 'outline'}
                className={cn(
                  'min-w-[72px]',
                  range === option.id ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white',
                )}
                onClick={() => setRange(option.id)}
              >
                {option.label}
              </Button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={range === 'custom' ? 'default' : 'outline'}
                  className={cn(
                    'min-w-[120px]',
                    range === 'custom' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white',
                  )}
                  onClick={() => setRange('custom')}
                >
                  Custom range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Custom Range</h4>
                    <p className="text-sm text-slate-500">
                      Select the start and end dates for your report.
                    </p>
                  </div>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="from">From Date</Label>
                      <Input
                        id="from"
                        type="date"
                        value={customRange?.from ? format(customRange.from, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? parseLocalDate(e.target.value) : undefined;
                          setCustomRange(prev => ({ ...prev, from: date }));
                          setRange('custom');
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="to">To Date</Label>
                      <Input
                        id="to"
                        type="date"
                        value={customRange?.to ? format(customRange.to, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? parseLocalDate(e.target.value) : undefined;
                          setCustomRange(prev => ({ ...prev, to: date }));
                          setRange('custom');
                        }}
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryStat icon={TrendingUp} label="Total Income" value={formatVND(totals.income)} tone="emerald" />
        <SummaryStat icon={TrendingDown} label="Total Expenses" value={formatVND(totals.expense)} tone="rose" />
        <SummaryStat icon={Wallet} label="Total Net Income" value={formatVND(totals.net)} tone={totals.net >= 0 ? 'blue' : 'rose'} />
        <SummaryStat icon={PiggyBank} label="Savings Rate" value={`${Math.round(totals.savingsRate)}%`} tone={totals.savingsRate >= 0 ? 'emerald' : 'rose'} />
      </div>

      <Card className="border-0 bg-white p-6 shadow-md">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-sky-600" />
              <h2 className="text-xl font-semibold text-slate-900">Cash Flow</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">{cashflowDateLabel}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Average Net</p>
              <p className={cn('mt-1 text-lg font-semibold', averageNet >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                {formatVND(averageNet)}
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              {chartModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setChartMode(mode.id)}
                    className={cn(
                      'flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors',
                      chartMode === mode.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 h-[500px]">
          {cashflowData.length === 0 ? (
            <EmptyChartState isLoading={isLoading} message="No transaction history in this reporting range yet." />
          ) : chartMode === 'overview' ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} minTickGap={24} />
                <YAxis tickFormatter={(value) => formatVND(value)} width={100} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip formatter={(value: number) => formatVND(value)} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[10, 10, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#7c3aed" radius={[10, 10, 0, 0]} />
                <Line type="monotone" dataKey="net" name="Net Income" stroke="#dc2626" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : chartMode === 'bars' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} minTickGap={24} />
                <YAxis tickFormatter={(value) => formatVND(value)} width={100} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip formatter={(value: number) => formatVND(value)} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[10, 10, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#7c3aed" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : chartMode === 'trend' ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} minTickGap={24} />
                <YAxis tickFormatter={(value) => formatVND(value)} width={100} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip formatter={(value: number) => formatVND(value)} />
                <Legend />
                <Line
                  type="linear"
                  dataKey="income"
                  name="Income"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#22c55e' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="linear"
                  dataKey="expense"
                  name="Expenses"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#7c3aed' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="linear"
                  dataKey="net"
                  name="Net Income"
                  stroke="#dc2626"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#dc2626' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-[1.75rem] border border-slate-100 bg-gradient-to-r from-cyan-50 via-white to-emerald-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <Sankey
                  data={cashflowFlowData}
                  nodePadding={28}
                  nodeWidth={18}
                  node={renderFlowNode}
                  link={renderFlowLink}
                  margin={{ top: 24, right: 220, bottom: 24, left: 220 }}
                >
                  <Tooltip content={<FlowTooltip />} />
                </Sankey>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-0 bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold text-slate-900">Spending Mix</h2>
          <p className="mt-1 text-sm text-slate-500">
            Your top expense categories in the selected report range.
          </p>

          <div className="mt-6 h-[320px]">
            {expenseByCategory.length === 0 ? (
              <EmptyChartState isLoading={isLoading} message="No expense data available yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={72}
                    outerRadius={118}
                    paddingAngle={3}
                  >
                    {expenseByCategory.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatVND(value)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {expenseByCategory.slice(0, 4).map((entry) => (
              <div key={entry.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm font-medium text-slate-700">{entry.name}</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">{formatVND(entry.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-0 bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold text-slate-900">Income Sources</h2>
          <p className="mt-1 text-sm text-slate-500">Largest income categories recorded in this report range.</p>

          <div className="mt-6 h-[320px]">
            {incomeByCategory.length === 0 ? (
              <EmptyChartState isLoading={isLoading} message="No income sources available yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeByCategory} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tickFormatter={(value) => formatVND(value)} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip formatter={(value: number) => formatVND(value)} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-0 bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold text-slate-900">Net Trend</h2>
          <p className="mt-1 text-sm text-slate-500">A smoother view of how each month finished after expenses.</p>

          <div className="mt-6 h-[320px]">
            {cashflowData.length === 0 ? (
              <EmptyChartState isLoading={isLoading} message="No trend data available yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflowData}>
                  <defs>
                    <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} minTickGap={24} />
                  <YAxis tickFormatter={(value) => formatVND(value)} width={100} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip formatter={(value: number) => formatVND(value)} />
                  <Area type="monotone" dataKey="net" stroke="#0f766e" fill="url(#netFill)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="border-0 bg-white p-6 shadow-md">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Period Highlights</h2>
            <p className="mt-1 text-sm text-slate-500">Quick takeaways from the selected reporting range.</p>
          </div>

          <div className="mt-6 grid gap-4">
            <HighlightCard
              title="Strongest Month"
              value={strongestMonth ? strongestMonth.label : 'No data'}
              description={
                strongestMonth
                  ? `Net income reached ${formatVND(strongestMonth.net)}.`
                  : 'Add more transactions to surface strong months.'
              }
              tone="emerald"
            />
            <HighlightCard
              title="Weakest Month"
              value={weakestMonth ? weakestMonth.label : 'No data'}
              description={
                weakestMonth
                  ? `Net income landed at ${formatVND(weakestMonth.net)}.`
                  : 'Add more transactions to surface weak months.'
              }
              tone="rose"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function EmptyChartState({ isLoading, message }: { isLoading: boolean; message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
      {isLoading ? 'Loading report data...' : message}
    </div>
  );
}

function FlowTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { value?: number; source?: number; target?: number } }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const value = payload[0]?.payload?.value;
  if (typeof value !== 'number') {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-slate-900">{formatVND(value)}</p>
    </div>
  );
}

function renderFlowNode(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: FlowNode;
  containerWidth?: number;
}) {
  const x = props.x ?? 0;
  const y = props.y ?? 0;
  const width = props.width ?? 0;
  const height = props.height ?? 0;
  const node = props.payload;
  const containerWidth = props.containerWidth ?? 0;

  if (!node) {
    return <g />;
  }

  const labelShouldBeLeftSide = node.role === 'expense' || node.role === 'savings';
  const fallbackSplit = containerWidth > 0 ? x > containerWidth / 2 : false;
  const showLabelOnLeft = labelShouldBeLeftSide || fallbackSplit;
  const labelX = showLabelOnLeft ? x - 12 : x + width + 12;
  const textAnchor = showLabelOnLeft ? 'end' : 'start';
  const displayName = truncateFlowLabel(node.name, 18);
  const displayValue = formatVND(node.value);

  return (
    <g>
      <title>{`${node.name}: ${displayValue}`}</title>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={node.fill} fillOpacity={0.95} />
      <text
        x={labelX}
        y={y + height / 2 - 4}
        textAnchor={textAnchor}
        fontSize={13}
        fontWeight={600}
        fill="#0f172a"
      >
        {displayName}
      </text>
      <text
        x={labelX}
        y={y + height / 2 + 14}
        textAnchor={textAnchor}
        fontSize={12}
        fill="#334155"
      >
        {displayValue}
      </text>
    </g>
  );
}

function truncateFlowLabel(label: string, maxLength: number) {
  if (label.length <= maxLength) {
    return label;
  }
  return `${label.slice(0, maxLength - 1)}...`;
}

function renderFlowLink(props: {
  sourceX?: number;
  targetX?: number;
  sourceY?: number;
  targetY?: number;
  sourceControlX?: number;
  targetControlX?: number;
  linkWidth?: number;
  payload?: FlowLink;
}) {
  const sourceX = props.sourceX ?? 0;
  const targetX = props.targetX ?? 0;
  const sourceY = props.sourceY ?? 0;
  const targetY = props.targetY ?? 0;
  const sourceControlX = props.sourceControlX ?? sourceX;
  const targetControlX = props.targetControlX ?? targetX;
  const linkWidth = props.linkWidth ?? 0;
  const color = props.payload?.color ?? '#cbd5e1';

  const path = `
    M${sourceX},${sourceY}
    C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
  `;

  return (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeOpacity={0.35}
      strokeWidth={Math.max(linkWidth, 1)}
    />
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: 'emerald' | 'rose' | 'blue';
}) {
  const toneClasses =
    tone === 'emerald'
      ? 'bg-emerald-100 text-emerald-700'
      : tone === 'rose'
        ? 'bg-rose-100 text-rose-700'
        : 'bg-sky-100 text-sky-700';

  return (
    <Card className="border-0 bg-white p-6 shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', toneClasses)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

function HighlightCard({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  tone: 'emerald' | 'rose';
}) {
  return (
    <Card
      className={cn(
        'border-0 p-6 shadow-sm',
        tone === 'emerald' ? 'bg-emerald-50' : 'bg-rose-50',
      )}
    >
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </Card>
  );
}
