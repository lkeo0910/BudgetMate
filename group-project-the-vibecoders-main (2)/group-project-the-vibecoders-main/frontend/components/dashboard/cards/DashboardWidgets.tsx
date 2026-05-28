'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  type BudgetHealthResult,
  type ForecastResult,
  type SavingsGoalView,
  type SmartInsight,
  formatDashboardCurrency,
} from '@/lib/dashboard';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function CashFlowForecastCard({ forecast }: { forecast: ForecastResult }) {
  return (
    <Card className="border-0 bg-white shadow-md p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Cash Flow Forecast</h3>
          <p className="mt-1 text-sm text-muted-foreground">Projected end-of-month balance using recurring patterns from your transaction history.</p>
        </div>
        <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={forecast.points}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} minTickGap={24} />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => formatDashboardCurrency(value)}
              width={88}
            />
            <Tooltip
              formatter={(value: number) => formatDashboardCurrency(value)}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
            />
            <Line
              type="linear"
              dataKey="balance"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 3, fill: '#10b981' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 text-2xl font-semibold text-foreground">
        You&apos;ll have <span className="text-emerald-600">{formatDashboardCurrency(forecast.projectedBalance)}</span> by the end of the month
      </p>
      <p className={cn('mt-2 text-sm font-medium', forecast.changeAmount >= 0 ? 'text-emerald-600' : 'text-red-500')}>
        {forecast.changeAmount >= 0 ? '+' : '-'}
        {formatDashboardCurrency(Math.abs(forecast.changeAmount))} in {forecast.daysRemaining} days
      </p>
    </Card>
  );
}

export function SmartInsightsCard({ insights }: { insights: SmartInsight[] }) {
  return (
    <Card className="border-0 bg-white shadow-md p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold text-foreground">Smart Insights</h3>
      </div>

      <div className="mt-5 space-y-4">
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">No insights yet. Add more activity to surface trends.</p>
        ) : (
          insights.map((insight) => (
            <div key={insight.id} className="flex items-start gap-3">
              <SeverityIcon severity={insight.severity} />
              <p className="text-sm leading-6 text-foreground">{insight.text}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export function SavingsGoalsCard({
  goals,
  isLoading,
}: {
  goals: SavingsGoalView[];
  isLoading: boolean;
}) {
  return (
    <Card className="border-0 bg-white shadow-md p-6">
      <h3 className="text-xl font-semibold text-foreground">Savings Goals</h3>
      <div className="mt-5 space-y-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading goals...</p>
        ) : goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No savings goals yet.</p>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="space-y-3 rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{goal.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDashboardCurrency(goal.currentAmount)} of {formatDashboardCurrency(goal.targetAmount)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">{Math.round(goal.progressPercent)}%</p>
              </div>
              <Progress value={goal.progressPercent} />
              <p className="text-xs text-muted-foreground">
                {goal.estimatedCompletionDate
                  ? `Estimated completion: ${goal.estimatedCompletionDate}`
                  : goal.targetAmount <= 0
                    ? 'Target amount is not set.'
                    : goal.currentAmount >= goal.targetAmount
                      ? 'Goal complete.'
                      : 'Need a positive monthly savings rate to estimate completion.'}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export function CashflowNotesCard({ forecast }: { forecast: ForecastResult }) {
  const largestSwing = forecast.points.reduce<{ delta: number; label: string } | null>((largest, point, index, points) => {
    if (index === 0) {
      return largest;
    }

    const delta = point.balance - points[index - 1].balance;
    if (!largest || Math.abs(delta) > Math.abs(largest.delta)) {
      return { delta, label: point.label };
    }
    return largest;
  }, null);

  const notes = [
    forecast.projectedBalance < 0
      ? {
          id: 'negative-balance',
          tone: 'red',
          icon: AlertTriangle,
          text: `Forecast ends below zero at ${formatDashboardCurrency(forecast.projectedBalance)}.`,
        }
      : {
          id: 'healthy-balance',
          tone: 'green',
          icon: CheckCircle2,
          text: `Forecast ends with ${formatDashboardCurrency(forecast.projectedBalance)} remaining.`,
        },
    forecast.changeAmount >= 0
      ? {
          id: 'positive-trend',
          tone: 'green',
          icon: TrendingUp,
          text: `Net cash flow improves by ${formatDashboardCurrency(forecast.changeAmount)} over this range.`,
        }
      : {
          id: 'negative-trend',
          tone: 'red',
          icon: TrendingDown,
          text: `Net cash flow drops by ${formatDashboardCurrency(Math.abs(forecast.changeAmount))} over this range.`,
        },
    largestSwing
      ? {
          id: 'largest-swing',
          tone: largestSwing.delta >= 0 ? 'green' : 'red',
          icon: largestSwing.delta >= 0 ? TrendingUp : TrendingDown,
          text: `${largestSwing.delta >= 0 ? 'Biggest inflow' : 'Biggest outflow'} lands near ${largestSwing.label}: ${formatDashboardCurrency(Math.abs(largestSwing.delta))}.`,
        }
      : {
          id: 'steady',
          tone: 'blue',
          icon: Clock3,
          text: 'No major cash flow swings are forecast in this period.',
        },
  ];

  return (
    <Card className="border-0 bg-white shadow-md p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold text-foreground">Cashflow Notes</h3>
      </div>
      <div className="mt-5 space-y-4">
        {notes.map((note) => {
          const Icon = note.icon;
          const toneClass =
            note.tone === 'green'
              ? 'bg-emerald-50 text-emerald-700'
              : note.tone === 'red'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-sky-50 text-sky-700';

          return (
            <div key={note.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', toneClass)}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm leading-6 text-foreground">{note.text}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function BudgetHealthCard({ health }: { health: BudgetHealthResult }) {
  const colorClass =
    health.status === 'good'
      ? 'text-emerald-600 bg-emerald-50'
      : health.status === 'warning'
        ? 'text-amber-600 bg-amber-50'
        : 'text-red-500 bg-red-50';

  return (
    <Card className="border-0 bg-white shadow-md p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold text-foreground">Budget Health Score</h3>
      </div>
      <div className={cn('mt-5 inline-flex rounded-full px-4 py-2 text-3xl font-bold', colorClass)}>
        {health.score}
      </div>
      <p className="mt-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">{health.status}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{health.explanation}</p>
    </Card>
  );
}

function SeverityIcon({ severity }: { severity: SmartInsight['severity'] }) {
  if (severity === 'positive') {
    return <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />;
  }

  if (severity === 'warning') {
    return <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />;
  }

  return <Clock3 className="mt-0.5 h-5 w-5 text-sky-500" />;
}
