'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface PendingReceipt {
  id: number;
  vendor: string;
  amount: number;
  confidence: number;
  date: string;
}

interface ModalContextType {
  isAddTransactionOpen: boolean;
  defaultValues: PendingReceipt | null;
  openAddTransaction: (values?: PendingReceipt | null) => void;
  closeAddTransaction: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [defaultValues, setDefaultValues] = useState<PendingReceipt | null>(null);

  const openAddTransaction = useCallback((values: PendingReceipt | null = null) => {
    setDefaultValues(values);
    setIsAddTransactionOpen(true);
  }, []);

  const closeAddTransaction = useCallback(() => {
    setIsAddTransactionOpen(false);
    setDefaultValues(null);
  }, []);

  return (
    <ModalContext.Provider
      value={{
        isAddTransactionOpen,
        defaultValues,
        openAddTransaction,
        closeAddTransaction,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
