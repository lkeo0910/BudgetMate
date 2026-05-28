import type { SavingsGoal } from '@/lib/dashboard';

export interface StoredSavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  initialAmount: number;
  targetDate?: string;
  createdAt: string;
  categoryId?: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface SavingsGoalState {
  goals: StoredSavingsGoal[];
  contributions: GoalContribution[];
}

export const SAVINGS_GOALS_EVENT = 'savings-goals-changed';

export function createEmptySavingsGoalState(): SavingsGoalState {
  return { goals: [], contributions: [] };
}

export function dispatchSavingsGoalsChanged() {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(SAVINGS_GOALS_EVENT));
}

export function buildSavingsGoalsFromState(state: SavingsGoalState): SavingsGoal[] {
  return state.goals.map((goal) => {
    const contributionTotal = state.contributions
      .filter((entry) => entry.goalId === goal.id)
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      id: goal.id,
      title: goal.title,
      currentAmount: goal.initialAmount + contributionTotal,
      targetAmount: goal.targetAmount,
    };
  });
}
