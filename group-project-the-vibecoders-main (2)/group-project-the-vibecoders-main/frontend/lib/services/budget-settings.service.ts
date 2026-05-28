import api from '../api/axios';

export interface BudgetSettingsResponse {
  user_id: string;
  manual_available_amount: number;
  created_at: string;
  updated_at: string;
}

const budgetSettingsService = {
  async getBudgetSettings(): Promise<BudgetSettingsResponse> {
    const response = await api.get<BudgetSettingsResponse>('/users/budget-settings');
    return response.data;
  },

  async updateBudgetSettings(manual_available_amount: number): Promise<BudgetSettingsResponse> {
    const response = await api.put<BudgetSettingsResponse>('/users/budget-settings', {
      manual_available_amount,
    });
    return response.data;
  },
};

export default budgetSettingsService;
