import api from '../api/axios';
import { Category, CategoryCreate, CategoryUpdate } from '@/types/category';

const categoryService = {
  async getAllCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/users/categories');
    return response.data;
  },

  async createCategory(data: CategoryCreate): Promise<Category> {
    const response = await api.post<Category>('/users/categories', data);
    return response.data;
  },

  async updateCategory(id: string, data: CategoryUpdate): Promise<Category> {
    const response = await api.put<Category>(`/users/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/users/categories/${id}`);
  },
};

export default categoryService;
