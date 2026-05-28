'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SortingState } from '@tanstack/react-table';
import {
  Download,
  PlusCircle,
  ScanLine,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import { CategoriesButton } from '@/components/dashboard/layout/CategoriesButton';
import { AddTransactionModal } from '@/components/dashboard/transactions/AddTransactionModal';
import { createTransactionColumns } from '@/components/dashboard/transactions/columns';
import { DataTable } from '@/components/dashboard/transactions/data-table';
import { EditTransactionSheet } from '@/components/dashboard/transactions/EditTransactionSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Transaction,
  TransactionFilters,
  filterTransactions,
  formatVND,
} from '@/types/transaction';
import { useTransactions } from '@/context/transaction-context';

interface PendingReceipt {
  id: number;
  vendor: string;
  amount: number;
  confidence: number;
  date: string;
}

const INITIAL_RECEIPTS: PendingReceipt[] = [
  { id: 1, vendor: 'Highlands Coffee', amount: 115_000, confidence: 92, date: '2026-03-30' },
  { id: 2, vendor: 'GrabBike', amount: 95_000, confidence: 88, date: '2026-03-29' },
];

function countActiveFilters(filters: TransactionFilters) {
  return (
    (filters.categories?.length ?? 0) +
    (filters.type && filters.type !== 'all' ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.minAmount !== undefined ? 1 : 0) +
    (filters.maxAmount !== undefined ? 1 : 0)
  );
}

function TransactionsContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { transactions, categories, deleteTransaction, getCategoryName, refreshTransactions, refreshCategories, paginationMeta } = useTransactions();

  // Main page state for the transaction ledger. This state is read by
  // `transactions/data-table.tsx`, `transactions/columns.tsx`, and `EditTransactionSheet.tsx`.
  const [pendingReceipts, setPendingReceipts] = useState<PendingReceipt[]>(INITIAL_RECEIPTS);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [activeFilters, setActiveFilters] = useState<TransactionFilters>({ type: 'all' });
  const [page, setPage] = useState(1);

  const [draftCategories, setDraftCategories] = useState<string[]>([]);
  const [draftType, setDraftType] = useState<'all' | 'expense' | 'income'>('all');
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');
  const [draftMinAmt, setDraftMinAmt] = useState('');
  const [draftMaxAmt, setDraftMaxAmt] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [receiptDefaults, setReceiptDefaults] = useState<PendingReceipt | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  React.useEffect(() => {
    if (searchParams.get('action') === 'upload') {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  React.useEffect(() => {
    const orderBy = sorting[0]?.id as any;
    const order = sorting[0]?.desc ? 'desc' : 'asc';
    
    const categoryIds = activeFilters.categories?.length ? activeFilters.categories.join(',') : undefined;

    refreshTransactions({ 
      orderBy, 
      order,
      page,
      size: 5,
      search: search || undefined,
      type: activeFilters.type !== 'all' ? activeFilters.type?.toUpperCase() as any : undefined,
      categoryIds,
      dateFrom: activeFilters.dateFrom,
      dateTo: activeFilters.dateTo,
      minAmount: activeFilters.minAmount,
      maxAmount: activeFilters.maxAmount,
    });
  }, [sorting, search, activeFilters, page, refreshTransactions]);

  React.useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  // Builds the category checklist shown in the filter dialog using shared
  // helpers from `types/transaction.ts` plus the categories already in the ledger.
  const availableCategories = useMemo(() => {
    return categories.sort((left, right) => left.category_name.localeCompare(right.category_name));
  }, [categories]);


  // Column definitions come from `transactions/columns.tsx`.
  // The row action callbacks point back into this layout so edit/delete can update local state.
  const columns = useMemo(
    () =>
        createTransactionColumns({
          onEdit: setEditingTransaction,
          onDelete: (transaction) => {
            deleteTransaction(transaction.id);
            toast({
              title: 'Transaction deleted',
              description: `${transaction.vendor} was removed from the ledger.`,
          });
        },
        getCategoryName,
      }),
    [deleteTransaction, toast, getCategoryName]
  );

  const filterCount = countActiveFilters(activeFilters);

  const openFilter = () => {
    setDraftCategories(activeFilters.categories ?? []);
    setDraftType(activeFilters.type ?? 'all');
    setDraftDateFrom(activeFilters.dateFrom ?? '');
    setDraftDateTo(activeFilters.dateTo ?? '');
    setDraftMinAmt(activeFilters.minAmount?.toString() ?? '');
    setDraftMaxAmt(activeFilters.maxAmount?.toString() ?? '');
    setFilterOpen(true);
  };

  const clearFilters = () => {
    setActiveFilters({ type: 'all' });
    setPage(1);
    setDraftCategories([]);
    setDraftType('all');
    setDraftDateFrom('');
    setDraftDateTo('');
    setDraftMinAmt('');
    setDraftMaxAmt('');
    setFilterOpen(false);
  };

  const applyFilters = () => {
    setPage(1);
    setActiveFilters({
      categories: draftCategories.length ? draftCategories : undefined,
      type: draftType,
      dateFrom: draftDateFrom || undefined,
      dateTo: draftDateTo || undefined,
      minAmount: draftMinAmt ? Number(draftMinAmt.replace(/,/g, '')) : undefined,
      maxAmount: draftMaxAmt ? Number(draftMaxAmt.replace(/,/g, '')) : undefined,
    });
    setFilterOpen(false);
  };

  const toggleDraftCategory = (category: string) => {
    setDraftCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const removeCategoryFilter = (category: string) => {
    setPage(1);
    setActiveFilters((current) => ({
      ...current,
      categories: current.categories?.filter((item) => item !== category),
    }));
  };

  const removeFilter = (key: keyof TransactionFilters) => {
    setPage(1);
    setActiveFilters((current) => ({
      ...current,
      [key]: key === 'type' ? 'all' : undefined,
    }));
  };

  const openAddTransaction = (receipt?: PendingReceipt | null) => {
    setReceiptDefaults(receipt ?? null);
    setIsAddModalOpen(true);
  };

  const closeAddTransaction = () => {
    setReceiptDefaults(null);
    setIsAddModalOpen(false);
  };

  // Receives submitted values from `AddTransactionModal.tsx`, converts them into the
  // shared `Transaction` shape, then injects the new item into the table data.
  const handleAddTransaction = (transaction: Transaction) => {
    if (receiptDefaults) {
      setPendingReceipts((current) => current.filter((receipt) => receipt.id !== receiptDefaults.id));
    }

    toast({
      title: 'Transaction added',
      description: `${transaction.vendor} was saved to your ledger.`,
    });
  };

  // Exports only the already-filtered ledger rows so CSV output matches what
  // `DataTable` is currently showing on screen.
  const handleExportCsv = () => {
    if (!transactions.length) {
      toast({
        title: 'Nothing to export',
        description: 'Try widening your filters before exporting CSV.',
      });
      return;
    }

    const rows = [
      ['Date', 'Vendor/Source', 'Category', 'Type', 'Amount', 'Note'],
      ...transactions.map((transaction) => [
        String(transaction.date),
        transaction.vendor,
        getCategoryName(transaction.category_id),
        transaction.type,
        String(transaction.amount),
        transaction.notes ?? '',
      ]),
    ];

    const csvContent = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transactions-export.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV exported',
      description: `${transactions.length} transactions were exported. (Current page only)`,
    });
  };

  return (
    <>
      <div className="container mx-auto max-w-7xl space-y-8 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Full Transaction History
          </h1>
          <p className="text-sm text-muted-foreground">
            Review receipts, manage every transaction, and export your filtered ledger.
          </p>
        </div>

        {pendingReceipts.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ScanLine className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Needs Review
              </h2>
              <Badge className="min-w-20 justify-center border-amber-300 bg-amber-100 text-center text-xs text-amber-700">
                {pendingReceipts.length} pending
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingReceipts.map((receipt) => (
                <Card
                  key={receipt.id}
                  className="border-amber-200 bg-amber-50/60 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4 p-5">
                    <div className="space-y-1.5 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-base font-bold text-slate-900">
                          {formatVND(receipt.amount)}
                        </span>
                        <span className="truncate text-sm font-medium text-slate-700">
                          at {receipt.vendor}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-slate-500">
                        <span>
                          {new Date(receipt.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="font-semibold text-teal-600">
                          Confidence: {receipt.confidence}%
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="shrink-0 bg-teal-500 text-white hover:bg-teal-600"
                      onClick={() => openAddTransaction(receipt)}
                    >
                      Review & File
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative w-full xl:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search by vendor, category, or note..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 border-slate-200 bg-white pl-10 focus:border-teal-400 focus:ring-teal-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {(['all', 'expense', 'income'] as const).map((type) => (
                  <Button
                    key={type}
                    variant="ghost"
                    className={`h-9 rounded-lg px-4 capitalize ${
                      (activeFilters.type ?? 'all') === type
                        ? 'bg-slate-900 text-white hover:bg-slate-800 hover:text-white'
                        : 'text-slate-600'
                    }`}
                    onClick={() =>
                      setActiveFilters((current) => ({
                        ...current,
                        type,
                      }))
                    }
                  >
                    {type}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={openFilter}
                className="relative h-11 gap-2 border-slate-200 px-4 font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter
                {filterCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white shadow-sm">
                    {filterCount}
                  </span>
                ) : null}
              </Button>

              <Button
                variant="outline"
                className="h-11 gap-2 border-slate-200 px-4 font-semibold text-slate-600 hover:bg-slate-50"
                onClick={handleExportCsv}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>

              <CategoriesButton />

              <Button
                onClick={() => openAddTransaction()}
                className="h-11 gap-2 rounded-xl bg-teal-500 px-6 font-bold text-white shadow-lg shadow-teal-200/50 transition-all hover:scale-105 hover:bg-teal-600 active:scale-95"
              >
                <PlusCircle className="h-4 w-4" />
                Add Transaction
              </Button>
            </div>
          </div>

          {(activeFilters.categories?.length ||
            (activeFilters.type && activeFilters.type !== 'all') ||
            activeFilters.dateFrom ||
            activeFilters.dateTo ||
            activeFilters.minAmount !== undefined ||
            activeFilters.maxAmount !== undefined) ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.categories?.map((id) => (
                <Badge
                  key={id}
                  variant="outline"
                  className="gap-1 rounded-full border-teal-200 bg-teal-50 px-3 py-1 text-teal-700"
                >
                  {getCategoryName(id)}
                  <button type="button" onClick={() => removeCategoryFilter(id)}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))}

              {activeFilters.type && activeFilters.type !== 'all' ? (
                <Badge
                  variant="outline"
                  className="gap-1 rounded-full border-slate-300 bg-slate-50 px-3 py-1 text-slate-700 capitalize"
                >
                  {activeFilters.type}
                  <button type="button" onClick={() => removeFilter('type')}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ) : null}

              {activeFilters.dateFrom ? (
                <Badge variant="outline" className="gap-1 rounded-full px-3 py-1">
                  From {activeFilters.dateFrom}
                  <button type="button" onClick={() => removeFilter('dateFrom')}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ) : null}

              {activeFilters.dateTo ? (
                <Badge variant="outline" className="gap-1 rounded-full px-3 py-1">
                  To {activeFilters.dateTo}
                  <button type="button" onClick={() => removeFilter('dateTo')}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ) : null}

              {activeFilters.minAmount !== undefined ? (
                <Badge variant="outline" className="gap-1 rounded-full px-3 py-1">
                  Min {formatVND(activeFilters.minAmount)}
                  <button type="button" onClick={() => removeFilter('minAmount')}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ) : null}

              {activeFilters.maxAmount !== undefined ? (
                <Badge variant="outline" className="gap-1 rounded-full px-3 py-1">
                  Max {formatVND(activeFilters.maxAmount)}
                  <button type="button" onClick={() => removeFilter('maxAmount')}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ) : null}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-500"
              >
                Clear all
              </Button>
            </div>
          ) : null}

          {/* Paginated ledger table from `transactions/data-table.tsx`.
              It renders the filtered rows and uses the action menu from `transactions/columns.tsx`. */}
          <DataTable 
            columns={columns} 
            data={transactions} 
            pageSize={5} 
            sorting={sorting}
            onSortingChange={setSorting}
            pageCount={paginationMeta.pages}
            pageIndex={paginationMeta.page - 1}
            totalItems={paginationMeta.total}
            onPaginationChange={(newPageIndex) => setPage(newPageIndex + 1)}
          />
        </div>
      </div>

      {/* Add flow is handled by `AddTransactionModal.tsx`.
          Saving here calls `handleAddTransaction`, which refreshes the local ledger immediately. */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={closeAddTransaction}
        onSave={handleAddTransaction}
        defaultValues={receiptDefaults}
      />

      {/* Edit flow is handled by `EditTransactionSheet.tsx`.
          The selected row comes from the actions column in `transactions/columns.tsx`. */}
      <EditTransactionSheet
        open={Boolean(editingTransaction)}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={(updatedTransaction) => {
          toast({
            title: 'Transaction updated',
            description: `${updatedTransaction.vendor} was updated successfully.`,
          });
        }}
      />

      {/* Advanced filters update `activeFilters`, which are applied by
          `filterTransactions()` from `types/transaction.ts` before rendering the table. */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-[540px]">
          <DialogHeader className="border-b border-slate-100 p-6 pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <SlidersHorizontal className="h-5 w-5 text-teal-600" />
              Advanced Filters
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Combine category, type, date, and amount filters to narrow your ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Transaction Type</Label>
              <Select value={draftType} onValueChange={(value) => setDraftType(value as typeof draftType)}>
                <SelectTrigger className="h-11 w-full border-slate-200 font-medium text-slate-800">
                  <SelectValue placeholder="All transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-slate-700">Categories</Label>
                {draftCategories.length ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-slate-500"
                    onClick={() => setDraftCategories([])}
                  >
                    Clear categories
                  </Button>
                ) : null}
              </div>

              <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
                {availableCategories.map((category) => (
                  <label
                    key={category.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-slate-700">{category.category_name}</span>
                    <Checkbox
                      checked={draftCategories.includes(category.id)}
                      onCheckedChange={() => toggleDraftCategory(category.id)}
                    />
                  </label>
                ))}
              </div>

              {draftCategories.length ? (
                <div className="flex flex-wrap gap-2">
                  {draftCategories.map((id) => (
                    <Badge
                      key={id}
                      variant="outline"
                      className="gap-1 rounded-full border-teal-200 bg-teal-50 px-3 py-1 text-teal-700"
                    >
                      {getCategoryName(id)}
                      <button type="button" onClick={() => toggleDraftCategory(id)}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Date Range</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">From</label>
                  <Input
                    type="date"
                    value={draftDateFrom}
                    onChange={(event) => setDraftDateFrom(event.target.value)}
                    className="h-11 border-slate-200 text-slate-800 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">To</label>
                  <Input
                    type="date"
                    value={draftDateTo}
                    onChange={(event) => setDraftDateTo(event.target.value)}
                    className="h-11 border-slate-200 text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Amount Range</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Minimum</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={draftMinAmt}
                    onChange={(event) => setDraftMinAmt(event.target.value)}
                    className="h-11 border-slate-200 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Maximum</label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={draftMaxAmt}
                    onChange={(event) => setDraftMaxAmt(event.target.value)}
                    className="h-11 border-slate-200 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 border-t border-slate-100 p-6 pt-4">
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="font-semibold text-slate-500 hover:bg-red-50 hover:text-red-500"
            >
              Clear All
            </Button>
            <Button
              onClick={applyFilters}
              className="flex-1 rounded-xl bg-teal-600 font-bold text-white shadow-lg shadow-teal-200/50 hover:bg-teal-700"
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TransactionsLayout() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading transactions...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
