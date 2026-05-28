'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BanknoteArrowUp, Car, Clapperboard, PiggyBank, Receipt, ShoppingCart, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/types/transaction';
import {
  formatDashboardDate,
  getRecentTransactions,
  getRecentTransactionsState,
  getSignedAmountLabel,
} from '@/lib/dashboard';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
  getCategoryName: (id: string) => string;
  onViewAll: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Salary: BanknoteArrowUp,
  Groceries: ShoppingCart,
  Transport: Car,
  Entertainment: Clapperboard,
  Rent: Wallet,
  Goals: PiggyBank,
};

export function RecentTransactions({
  transactions,
  isLoading,
  getCategoryName,
  onViewAll,
}: RecentTransactionsProps) {
  const rows = getRecentTransactions(transactions, 6);
  const state = getRecentTransactionsState(rows, isLoading);

  return (
    <Card className="border-0 bg-white shadow-md p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Recent Transactions</h3>
          <p className="mt-1 text-sm text-muted-foreground">Latest activity sorted by most recent date.</p>
        </div>
        <Button variant="outline" onClick={onViewAll}>
          View all
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {state === 'loading' && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground">
            Loading recent transactions...
          </div>
        )}

        {state === 'empty' && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-muted-foreground">
            No recent transactions in this time range.
          </div>
        )}

        {state === 'ready' &&
          rows.map((transaction) => {
            const categoryName = getCategoryName(transaction.category_id);
            const Icon = iconMap[categoryName] ?? Receipt;
            const amountPositive = transaction.type === 'INCOME';

            return (
              <button
                key={transaction.id}
                type="button"
                onClick={onViewAll}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4 text-left transition hover:border-slate-200 hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-2xl',
                    amountPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-700',
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{transaction.vendor}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {categoryName} • {formatDashboardDate(transaction.date)}
                    </p>
                  </div>
                </div>
                <p className={cn('text-sm font-semibold', amountPositive ? 'text-emerald-600' : 'text-slate-900')}>
                  {getSignedAmountLabel(transaction)}
                </p>
              </button>
            );
          })}
      </div>
    </Card>
  );
}
