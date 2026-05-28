'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Landmark, PiggyBank, Plus, Target, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useTransactions } from '@/context/transaction-context';
import { useToast } from '@/hooks/use-toast';
import { formatDashboardCurrency } from '@/lib/dashboard';
import savingsGoalsService from '@/lib/services/savings-goals.service';
import {
  createEmptySavingsGoalState,
  dispatchSavingsGoalsChanged,
  type GoalContribution,
  type SavingsGoalState,
  buildSavingsGoalsFromState,
  SAVINGS_GOALS_EVENT,
} from '@/lib/savings-goals';

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function GoalsPage() {
  const { categories, refreshTransactions, refreshCategories } = useTransactions();
  const { toast } = useToast();
  const todayIso = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [state, setState] = useState<SavingsGoalState>(createEmptySavingsGoalState());
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalStartingAmount, setGoalStartingAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [contributionDrafts, setContributionDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    const syncGoals = async () => {
      try {
        const nextState = await savingsGoalsService.getSavingsGoals();
        if (!isMounted) {
          return;
        }
        setState(nextState);
      } catch {
        if (!isMounted) {
          return;
        }
        setState(createEmptySavingsGoalState());
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

  const goalViews = useMemo(() => buildSavingsGoalsFromState(state), [state]);
  const totalSaved = useMemo(() => goalViews.reduce((sum, goal) => sum + goal.currentAmount, 0), [goalViews]);
  const totalTarget = useMemo(() => goalViews.reduce((sum, goal) => sum + goal.targetAmount, 0), [goalViews]);

  const handleAddGoal = async () => {
    const title = goalTitle.trim();
    const targetAmount = Number(goalTarget) || 0;
    const initialAmount = Number(goalStartingAmount) || 0;

    if (!title || targetAmount <= 0) {
      toast({
        title: 'Missing goal details',
        description: 'Please enter a goal name and target amount.',
        variant: 'destructive',
      });
      return;
    }

    if (goalTargetDate && goalTargetDate < todayIso) {
      toast({
        title: 'Invalid target date',
        description: 'Target date must be today or later.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await savingsGoalsService.createGoal({
        title,
        target_amount: targetAmount,
        initial_amount: initialAmount,
        target_date: goalTargetDate || undefined,
      });

      // Refresh categories since backend created a new category for the goal
      await refreshCategories();

      const nextState = await savingsGoalsService.getSavingsGoals();
      setState(nextState);
      dispatchSavingsGoalsChanged();
      setGoalTitle('');
      setGoalTarget('');
      setGoalStartingAmount('');
      setGoalTargetDate('');
      toast({
        title: 'Goal added',
        description: `${title} is ready for contributions.`,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'The goal could not be saved.';
      toast({
        title: 'Could not add goal',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleAddContribution = async (goalId: string) => {
    const amount = Number(contributionDrafts[goalId]) || 0;
    if (amount <= 0) {
      toast({
        title: 'Contribution required',
        description: 'Enter a contribution amount greater than zero.',
        variant: 'destructive',
      });
      return;
    }

    const contribution: GoalContribution = {
      id: createId('contribution'),
      goalId,
      amount,
      date: format(new Date(), 'yyyy-MM-dd'),
    };

    const goal = state.goals.find((entry) => entry.id === goalId);
    if (!goal) {
      return;
    }

    try {
      await savingsGoalsService.createContribution(goalId, {
        amount,
        date: contribution.date,
      });

      const nextState = await savingsGoalsService.getSavingsGoals();
      setState(nextState);
      dispatchSavingsGoalsChanged();

      // Refresh transactions and categories since the backend automatically created them
      await Promise.all([
        refreshTransactions(),
        refreshCategories(),
      ]);

      setContributionDrafts((current) => ({ ...current, [goalId]: '' }));
      toast({
        title: 'Contribution added',
        description: `${formatDashboardCurrency(amount)} was added to this goal and recorded as a ${goal.title} expense.`,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'The goal contribution could not be saved.';
      toast({
        title: 'Could not add payment',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const goal = state.goals.find((entry) => entry.id === goalId);
    if (!goal) {
      return;
    }

    try {
      await savingsGoalsService.deleteGoal(goalId);

      // Refresh transactions and categories since the backend cascade-deleted them
      await Promise.all([
        refreshTransactions(),
        refreshCategories(),
      ]);

      const nextState = await savingsGoalsService.getSavingsGoals();
      setState(nextState);
      dispatchSavingsGoalsChanged();
      toast({
        title: 'Goal removed',
        description: `${goal.title} was deleted.`,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'The goal could not be deleted.';
      toast({
        title: 'Could not remove goal',
        description: errorMessage,
        variant: 'destructive',
        className: 'border-red-500',
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      <div className="flex flex-col gap-5 rounded-[2rem] border border-sky-200/70 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">Goals</p>
          <h1 className="text-4xl font-semibold text-slate-900">Savings Goals</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Create goals here, track how much is already saved, and add contributions over time. The dashboard savings
            card will reflect whatever you save here.
          </p>
        </div>

        <div className="grid gap-3 rounded-[1.75rem] border border-sky-200/70 bg-white/90 p-5 shadow-sm min-w-[280px]">
          <SummaryLine icon={PiggyBank} label="Saved So Far" value={formatDashboardCurrency(totalSaved)} />
          <SummaryLine icon={Target} label="Target Across Goals" value={formatDashboardCurrency(totalTarget)} />
          <SummaryLine icon={Landmark} label="Active Goals" value={String(goalViews.length)} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="rounded-[1.75rem] border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Add Goal</h2>
          <p className="mt-1 text-sm text-slate-500">Set a target, optionally include money you already have saved, and start contributing.</p>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Goal name</label>
              <Input value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="Emergency fund" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Target amount</label>
                <Input type="number" value={goalTarget} onChange={(event) => setGoalTarget(event.target.value)} placeholder="5000000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Already saved</label>
                <Input type="number" value={goalStartingAmount} onChange={(event) => setGoalStartingAmount(event.target.value)} placeholder="0" />
              </div>
            </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Target date</label>
              <Input type="date" min={todayIso} value={goalTargetDate} onChange={(event) => setGoalTargetDate(event.target.value)} />
            </div>

            <Button onClick={handleAddGoal} className="w-full rounded-xl bg-slate-900 hover:bg-slate-800">
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          {goalViews.length > 0 ? (
            goalViews.map((goal) => {
              const storedGoal = state.goals.find((entry) => entry.id === goal.id);
              const progressPercent = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
              const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
              const contributionCount = state.contributions.filter((entry) => entry.goalId === goal.id).length;

              return (
                <Card key={goal.id} className="rounded-[1.75rem] border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-900">{goal.title}</h3>
                          <p className="text-sm text-slate-500">
                            {formatDashboardCurrency(goal.currentAmount)} of {formatDashboardCurrency(goal.targetAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        <Progress value={progressPercent} />
                        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                          <span>{Math.round(progressPercent)}% complete</span>
                          <span>{formatDashboardCurrency(remaining)} remaining</span>
                          <span>{contributionCount} contributions</span>
                          {storedGoal?.targetDate ? <span>Target: {format(new Date(storedGoal.targetDate), 'MMM d, yyyy')}</span> : null}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end">
                      <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium text-slate-600">Add payment / contribution</label>
                        <Input
                          type="number"
                          value={contributionDrafts[goal.id] ?? ''}
                          onChange={(event) =>
                            setContributionDrafts((current) => ({
                              ...current,
                              [goal.id]: event.target.value,
                            }))
                          }
                          placeholder="250000"
                        />
                      </div>
                      <Button onClick={() => handleAddContribution(goal.id)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                        Add Payment
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-sm">
              <PiggyBank className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-xl font-semibold text-slate-900">No goals yet</h3>
              <p className="mt-2 text-sm text-slate-500">Create your first savings goal on the left and it will also appear on the dashboard.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
