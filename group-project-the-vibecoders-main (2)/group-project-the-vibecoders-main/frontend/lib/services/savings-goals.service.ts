import api from '../api/axios';
import type { GoalContribution, SavingsGoalState, StoredSavingsGoal } from '@/lib/savings-goals';

interface SavingsGoalApiResponse {
  id: string;
  user_id: string;
  category_id?: string;
  title: string;
  target_amount: number;
  initial_amount: number;
  target_date?: string;
  created_at: string;
  updated_at: string;
}

interface GoalContributionApiResponse {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  date: string;
  note?: string;
  created_at: string;
}

interface SavingsGoalsStateApiResponse {
  goals: SavingsGoalApiResponse[];
  contributions: GoalContributionApiResponse[];
}

export interface SavingsGoalCreate {
  title: string;
  target_amount: number;
  initial_amount: number;
  target_date?: string;
}

export interface GoalContributionCreate {
  amount: number;
  date: string;
  note?: string;
}

function mapGoal(goal: SavingsGoalApiResponse): StoredSavingsGoal {
  return {
    id: goal.id,
    title: goal.title,
    targetAmount: goal.target_amount,
    initialAmount: goal.initial_amount,
    targetDate: goal.target_date,
    createdAt: goal.created_at,
    categoryId: goal.category_id,
  };
}

function mapContribution(contribution: GoalContributionApiResponse): GoalContribution {
  return {
    id: contribution.id,
    goalId: contribution.goal_id,
    amount: contribution.amount,
    date: contribution.date,
    note: contribution.note,
  };
}

const savingsGoalsService = {
  async getSavingsGoals(): Promise<SavingsGoalState> {
    const response = await api.get<SavingsGoalsStateApiResponse>('/users/savings-goals');
    return {
      goals: response.data.goals.map(mapGoal),
      contributions: response.data.contributions.map(mapContribution),
    };
  },

  async createGoal(data: SavingsGoalCreate): Promise<StoredSavingsGoal> {
    const response = await api.post<SavingsGoalApiResponse>('/users/savings-goals', data);
    return mapGoal(response.data);
  },

  async deleteGoal(goalId: string): Promise<void> {
    await api.delete(`/users/savings-goals/${goalId}`);
  },

  async createContribution(goalId: string, data: GoalContributionCreate): Promise<GoalContribution> {
    const response = await api.post<GoalContributionApiResponse>(`/users/savings-goals/${goalId}/contributions`, data);
    return mapContribution(response.data);
  },
};

export default savingsGoalsService;
