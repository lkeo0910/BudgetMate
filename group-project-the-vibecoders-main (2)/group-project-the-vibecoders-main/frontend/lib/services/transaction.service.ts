import api from '../api/axios';
import { 
  ReceiptOcrResult,
  Transaction, 
  TransactionCreate, 
  TransactionsResponse,
  TransactionType
} from '@/types/transaction';

export interface TransactionFilters {
  search?: string;
  type?: TransactionType | 'income' | 'expense' | 'all';
  categoryIds?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  size?: number;
  orderBy?: 'date' | 'amount' | 'vendor';
  order?: 'asc' | 'desc';
}

const transactionService = {
  async getAllTransactions(filters: TransactionFilters = {}): Promise<TransactionsResponse> {
    const response = await api.get<TransactionsResponse>('/transactions', {
      params: filters,
    });
    return response.data;
  },

  async getAllTransactionsAcrossPages(filters: TransactionFilters = {}): Promise<Transaction[]> {
    // Now that the backend supports returning all records if page is omitted,
    // we can just call getAllTransactions without a page parameter.
    const { page, ...rest } = filters;
    const response = await this.getAllTransactions(rest);
    return response.items;
  },

  async createTransaction(data: TransactionCreate): Promise<Transaction> {
    const response = await api.post<Transaction>('/transactions', data);
    return response.data;
  },

  async updateTransaction(id: string, data: Partial<TransactionCreate>): Promise<Transaction> {
    const response = await api.put<Transaction>(`/transactions/${id}`, data);
    return response.data;
  },

  async deleteTransaction(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },

  async processReceipt(file: File): Promise<ReceiptOcrResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ReceiptOcrResult>('/transactions/receipt-ocr', formData);

    return response.data;
  },
};

export default transactionService;
