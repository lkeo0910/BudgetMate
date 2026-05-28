'use client';

import { useModal } from "@/context/modal-context";
import { useTransactions } from "@/context/transaction-context";
import { AddTransactionModal } from "../transactions/AddTransactionModal";

export function GlobalModalContainer() {
  const { isAddTransactionOpen, closeAddTransaction, defaultValues } = useModal();
  const { addTransaction } = useTransactions();
  
  return (
    <AddTransactionModal 
      isOpen={isAddTransactionOpen} 
      onClose={closeAddTransaction} 
      onSave={addTransaction}
      defaultValues={defaultValues} 
    />
  );
}
