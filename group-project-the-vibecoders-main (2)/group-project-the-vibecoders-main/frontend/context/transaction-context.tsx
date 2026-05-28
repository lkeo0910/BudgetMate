'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { 
  Transaction, 
  TransactionCreate, 
} from '@/types/transaction';
import transactionService from '@/lib/services/transaction.service';
import categoryService from '@/lib/services/category.service';
import { Category } from '@/types/category';
import { useToast } from '@/hooks/use-toast';

interface TransactionContextType {
  transactions: Transaction[];
  categories: Category[];
  isLoading: boolean;
  addTransaction: (draft: TransactionCreate) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<TransactionCreate>) => Promise<Transaction>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  refreshTransactions: (filters?: Parameters<typeof transactionService.getAllTransactions>[0]) => Promise<void>;
  refreshCategories: () => Promise<void>;
  getCategoryName: (id: string) => string;
  paginationMeta: { total: number; page: number; size: number; pages: number };
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, page: 1, size: 5, pages: 0 });

  const clearData = useCallback(() => {
    setTransactions([]);
    setCategories([]);
    setPaginationMeta({ total: 0, page: 1, size: 5, pages: 0 });
    setIsLoading(false);
  }, []);

  const hasAccessToken = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return !!localStorage.getItem('access_token');
  }, []);

  const fetchInitialData = useCallback(async () => {
    if (!hasAccessToken()) {
      clearData();
      return;
    }

    setIsLoading(true);
    try {
      const [response, catResponse] = await Promise.all([
        transactionService.getAllTransactions({ orderBy: 'date', order: 'desc' }),
        categoryService.getAllCategories(),
      ]);
      setTransactions(response.items);
      setPaginationMeta({ total: response.total, page: response.page, size: response.size, pages: response.pages });
      setCategories(catResponse);
    } catch (error) {
      console.error('Failed to fetch initial transaction data', error);
      setTransactions([]);
      setPaginationMeta({ total: 0, page: 1, size: 5, pages: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [clearData, hasAccessToken]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleAuthChanged = () => {
      void fetchInitialData();
    };

    window.addEventListener('auth-changed', handleAuthChanged);
    window.addEventListener('storage', handleAuthChanged);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChanged);
      window.removeEventListener('storage', handleAuthChanged);
    };
  }, [fetchInitialData]);

  const refreshTransactions = useCallback(async (filters: Parameters<typeof transactionService.getAllTransactions>[0] = {}) => {
    if (!hasAccessToken()) {
      clearData();
      return;
    }

    setIsLoading(true);
    try {
      const response = await transactionService.getAllTransactions(filters);
      setTransactions(response.items);
      setPaginationMeta({ total: response.total, page: response.page, size: response.size, pages: response.pages });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh transactions.',
        variant: 'destructive',
      });
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [clearData, hasAccessToken, toast]);

  const refreshCategories = useCallback(async () => {
    if (!hasAccessToken()) {
      clearData();
      return;
    }

    try {
      const response = await categoryService.getAllCategories();
      setCategories(response);
    } catch (error) {
      console.error('Failed to refresh categories', error);
    }
  }, [clearData, hasAccessToken]);

  const addTransaction = useCallback(async (draft: TransactionCreate) => {
    try {
      const result = await transactionService.createTransaction(draft);
      setTransactions((current) => [result, ...current]);
      return result;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add transaction.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const updateTransaction = useCallback(async (id: string, data: Partial<TransactionCreate>) => {
    try {
      const result = await transactionService.updateTransaction(id, data);
      setTransactions((current) =>
        current.map((tx) => (tx.id === id ? result : tx))
      );
      return result;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update transaction.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    try {
      await transactionService.deleteTransaction(transactionId);
      setTransactions((current) =>
        current.filter((tx) => tx.id !== transactionId)
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete transaction.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const getCategoryName = useCallback((id: string) => {
    return categories.find(c => c.id === id)?.category_name || 'Uncategorized';
  }, [categories]);

  const value = useMemo(
    () => ({
      transactions,
      categories,
      isLoading,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      refreshTransactions,
      refreshCategories,
      getCategoryName,
      paginationMeta,
    }),
    [transactions, categories, isLoading, addTransaction, updateTransaction, deleteTransaction, refreshTransactions, refreshCategories, getCategoryName, paginationMeta]
  );

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export function useTransactions() {
  const context = useContext(TransactionContext);

  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }

  return context;
}
