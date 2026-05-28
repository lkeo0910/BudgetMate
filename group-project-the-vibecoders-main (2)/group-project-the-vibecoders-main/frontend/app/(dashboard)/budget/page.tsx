'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { addMonths, format } from 'date-fns';
import {
  BanknoteArrowUp,
  ChevronLeft,
  ChevronRight,
  Check,
  Coins,
  PencilLine,
  PiggyBank,
  Plus,
  ReceiptText,
  Wallet,
} from 'lucide-react';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import { useTransactions } from '@/context/transaction-context';
import {
  type BudgetCategoryType,
  inferCategoryType,
} from '@/lib/category-types';
import { inferCategoryIconKey, getRemainingCategoryPresets } from '@/lib/category-presets';
import budgetSettingsService from '@/lib/services/budget-settings.service';
import categoryService from '@/lib/services/category.service';
import { formatDashboardCurrency } from '@/lib/dashboard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function parseLocalDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export default function BudgetPage() {
  const { transactions, categories, refreshCategories, isLoading } = useTransactions();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

  const [manualAvailableInput, setManualAvailableInput] = useState('');
  const [manualAvailable, setManualAvailable] = useState(0);
  const [newCategoryType, setNewCategoryType] = useState<BudgetCategoryType>('expense');
  const [newCategoryPreset, setNewCategoryPreset] = useState('');
  const [newCategoryAssigned, setNewCategoryAssigned] = useState('');
  const [isSavingAvailable, setIsSavingAvailable] = useState(false);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(true);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    const loadBudgetSettings = async () => {
      setIsLoadingAvailable(true);
      try {
        const settings = await budgetSettingsService.getBudgetSettings();
        if (!isMounted) {
          return;
        }
        const amount = settings.manual_available_amount ?? 0;
        setManualAvailable(amount);
        setManualAvailableInput(amount ? String(amount) : '');
      } catch {
        if (!isMounted) {
          return;
        }
        setManualAvailable(0);
        setManualAvailableInput('');
      } finally {
        if (isMounted) {
          setIsLoadingAvailable(false);
        }
      }
    };

    void loadBudgetSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setAssignmentDrafts(
      Object.fromEntries(categories.map((category) => [category.id, category.monthly_limit == null ? '' : String(category.monthly_limit)])),
    );
  }, [categories]);

  const monthTransactions = useMemo(() => {
    const currentMonth = selectedMonth.getMonth();
    const currentYear = selectedMonth.getFullYear();

    return transactions.filter((transaction) => {
      const transactionDate = parseLocalDate(transaction.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });
  }, [selectedMonth, transactions]);

  const incomeThisMonth = useMemo(
    () =>
      monthTransactions
        .filter((transaction) => transaction.type === 'INCOME')
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [monthTransactions],
  );

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();

    monthTransactions
      .filter((transaction) => transaction.type === 'EXPENSE')
      .forEach((transaction) => {
        map.set(transaction.category_id, (map.get(transaction.category_id) ?? 0) + transaction.amount);
      });

    return map;
  }, [monthTransactions]);

  const incomeByCategory = useMemo(() => {
    const map = new Map<string, number>();

    monthTransactions
      .filter((transaction) => transaction.type === 'INCOME')
      .forEach((transaction) => {
        map.set(transaction.category_id, (map.get(transaction.category_id) ?? 0) + transaction.amount);
      });

    return map;
  }, [monthTransactions]);

  const categoryRows = useMemo(
    () =>
      categories
        .map((category) => {
          const categoryType = inferCategoryType(category, transactions);
          const activity =
            categoryType === 'income'
              ? incomeByCategory.get(category.id) ?? 0
              : expenseByCategory.get(category.id) ?? 0;
          const assigned = category.monthly_limit ?? 0;
          const available = assigned - activity;

          return {
            ...category,
            categoryType,
            activity,
            assigned,
            available,
          };
        })
        .sort((a, b) => b.assigned - a.assigned || a.category_name.localeCompare(b.category_name)),
    [categories, expenseByCategory, incomeByCategory, transactions],
  );

  const expenseCategoryRows = useMemo(
    () => categoryRows.filter((category) => category.categoryType === 'expense'),
    [categoryRows],
  );

  const incomeCategoryRows = useMemo(
    () => categoryRows.filter((category) => category.categoryType === 'income'),
    [categoryRows],
  );

  const totalAssigned = useMemo(
    () => expenseCategoryRows.reduce((sum, category) => sum + category.assigned, 0),
    [expenseCategoryRows],
  );

  const moneyLeftFromPreviousMonths = useMemo(() => {
    const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);

    return transactions
      .filter((transaction) => parseLocalDate(transaction.date) < monthStart)
      .reduce((sum, transaction) => sum + (transaction.type === 'INCOME' ? transaction.amount : -transaction.amount), 0);
  }, [selectedMonth, transactions]);

  const totalSpent = useMemo(
    () => expenseCategoryRows.reduce((sum, category) => sum + category.activity, 0),
    [expenseCategoryRows],
  );

  const availableToAssign = manualAvailable + incomeThisMonth - totalAssigned;
  const availableCategoryPresets = useMemo(
    () => getRemainingCategoryPresets(categories, newCategoryType),
    [categories, newCategoryType],
  );
  const creationStyles =
    newCategoryType === 'income'
      ? {
          panel: 'border-emerald-200 bg-emerald-50/50',
          activeTab: 'bg-emerald-600 text-white',
          idleTab: 'text-emerald-700 hover:text-emerald-800',
          select: 'border-emerald-200 bg-white',
          input: 'border-emerald-200 bg-white',
          addButton: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        }
      : {
          panel: 'border-rose-200 bg-rose-50/40',
          activeTab: 'bg-rose-600 text-white',
          idleTab: 'text-rose-700 hover:text-rose-800',
          select: 'border-rose-200 bg-white',
          input: 'border-rose-200 bg-white',
          addButton: 'bg-rose-600 hover:bg-rose-700 text-white',
        };

  const handleSaveAvailable = async () => {
    setIsSavingAvailable(true);
    try {
      const parsedValue = Number(manualAvailableInput) || 0;
      await budgetSettingsService.updateBudgetSettings(parsedValue);
      setManualAvailable(parsedValue);
      toast({
        title: 'Available amount updated',
        description: 'Manual available funds were saved to the server.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Could not save the available amount.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingAvailable(false);
    }
  };

  const handleCreateCategory = async () => {
    const preset = availableCategoryPresets.find((item) => item.name === newCategoryPreset);
    if (!preset) {
      return;
    }
    const name = preset.name.trim();
    if (!name) {
      return;
    }

    setIsCreatingCategory(true);
    try {
      await categoryService.createCategory({
        category_name: name,
        monthly_limit: newCategoryAssigned.trim() === '' ? null : Number(newCategoryAssigned),
        category_type: newCategoryType,
        category_icon: preset.iconKey,
      });

      await refreshCategories();
      setNewCategoryPreset('');
      setNewCategoryAssigned('');
      setNewCategoryType('expense');
      toast({
        title: 'Category added',
        description: `${name} was added as an ${newCategoryType} category.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create the category.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSaveAssignment = async (categoryId: string) => {
    const draftValue = assignmentDrafts[categoryId]?.trim() ?? '';
    const category = categories.find((item) => item.id === categoryId);

    if (!category) {
      return;
    }

    setSavingCategoryId(categoryId);
    try {
      await categoryService.updateCategory(categoryId, {
        monthly_limit: draftValue === '' ? null : Number(draftValue),
      });
      await refreshCategories();
      toast({
        title: 'Budget assigned',
        description: `${category.category_name} was updated.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update category allocation.',
        variant: 'destructive',
      });
    } finally {
      setSavingCategoryId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      <div className="flex flex-col gap-5 rounded-[2rem] border border-emerald-200/70 bg-gradient-to-r from-lime-100 via-emerald-50 to-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">Budget</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setSelectedMonth((current) => addMonths(current, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-4xl font-semibold text-slate-900">{format(selectedMonth, 'MMMM yyyy')}</h1>
            <Button variant="outline" size="icon" onClick={() => setSelectedMonth((current) => addMonths(current, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="min-w-[280px] grid gap-3 rounded-[1.75rem] border border-emerald-300/70 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Available To Assign</p>
              <p className={cn('text-3xl font-bold', availableToAssign >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                {isLoadingAvailable ? 'Loading...' : formatDashboardCurrency(availableToAssign)}
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              type="number"
              value={manualAvailableInput}
              onChange={(event) => setManualAvailableInput(event.target.value)}
              placeholder="Add manual available amount"
              className="h-11 rounded-xl border-emerald-200 bg-emerald-50/60"
            />
            <Button
              onClick={handleSaveAvailable}
              disabled={isSavingAvailable}
              className="h-11 rounded-xl bg-emerald-600 px-5 text-white hover:bg-emerald-700"
            >
              {isSavingAvailable ? 'Saving...' : 'Save Amount'}
            </Button>
          </div>

          <p className="text-xs text-slate-500">Formula: manual amount + income this month - assigned expense budgets</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className={cn('rounded-[1.75rem] p-6 shadow-sm', creationStyles.panel)}>
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Assign Your Categories</h2>
                <p className={cn('mt-1 text-sm font-medium', newCategoryType === 'income' ? 'text-emerald-700' : 'text-rose-700')}>
                  {newCategoryType === 'income'
                    ? 'Income categories represent money coming in.'
                    : 'Expense categories represent money going out.'}
                </p>
              </div>

              <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
                <div className="flex h-11 rounded-xl border border-white/70 bg-white/70 p-1">
                  {(['expense', 'income'] as BudgetCategoryType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setNewCategoryType(type);
                        setNewCategoryPreset('');
                      }}
                      className={cn(
                        'rounded-lg px-4 text-sm font-medium capitalize transition-colors',
                        newCategoryType === type ? creationStyles.activeTab : creationStyles.idleTab,
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto]">
                    <Select value={newCategoryPreset} onValueChange={setNewCategoryPreset}>
                      <SelectTrigger className={cn('h-11 rounded-xl', creationStyles.select)}>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategoryPresets.map((preset) => (
                          <SelectItem key={preset.name} value={preset.name}>
                            <div className="flex items-center gap-2">
                              <CategoryIcon iconKey={preset.iconKey} className="h-4 w-4" />
                              <span>{preset.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={newCategoryAssigned}
                      onChange={(event) => setNewCategoryAssigned(event.target.value)}
                      placeholder="Assigned amount"
                      className={cn('h-11 rounded-xl', creationStyles.input)}
                    />
                    <Button
                      onClick={handleCreateCategory}
                      disabled={isCreatingCategory || !newCategoryPreset}
                      className={cn('h-11 rounded-xl px-5', creationStyles.addButton)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {isCreatingCategory ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden rounded-[1.75rem] border-rose-200 bg-white shadow-sm">
            <div className="border-b border-rose-200 bg-rose-50 px-6 py-4">
              <div className="grid grid-cols-[minmax(0,1.4fr)_140px_140px_140px_96px] gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>Expense Category</span>
                <span>Assigned</span>
                <span>Activity</span>
                <span>Available</span>
                <span />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {expenseCategoryRows.map((category) => {
                const availableClass =
                  category.available < 0
                    ? 'bg-red-50 text-red-600'
                    : category.available <= category.assigned * 0.2 && category.assigned > 0
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700';

                return (
                  <div
                    key={category.id}
                    className="grid grid-cols-[minmax(0,1.4fr)_140px_140px_140px_96px] items-center gap-4 px-6 py-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                          <CategoryIcon iconKey={inferCategoryIconKey(category)} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-base font-semibold text-slate-900">{category.category_name}</p>
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                              Expense
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Input
                      type="number"
                      value={assignmentDrafts[category.id] ?? ''}
                      onChange={(event) =>
                        setAssignmentDrafts((current) => ({
                          ...current,
                          [category.id]: event.target.value,
                        }))
                      }
                      className="h-10 rounded-xl border-rose-200"
                    />

                    <p className="text-sm font-semibold text-rose-700">-{formatDashboardCurrency(category.activity)}</p>

                    <div className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${availableClass}`}>
                      {formatDashboardCurrency(category.available)}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleSaveAssignment(category.id)}
                      disabled={savingCategoryId === category.id}
                      className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                    >
                      {savingCategoryId === category.id ? <Check className="h-4 w-4 animate-pulse" /> : 'Save'}
                    </Button>
                  </div>
                );
              })}

              {!isLoading && expenseCategoryRows.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <PiggyBank className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-4 text-lg font-semibold text-slate-900">No expense categories yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Add your first expense category above and start assigning money to it.
                  </p>
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="rounded-[1.75rem] border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Income Categories</h3>
              </div>
              <div className="whitespace-nowrap rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                {incomeCategoryRows.length} income categories
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-100">
              <div className="border-b border-emerald-200 bg-emerald-50 px-6 py-4">
                <div className="grid grid-cols-[minmax(0,1.4fr)_140px_140px] gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <span>Income Category</span>
                  <span>Assigned</span>
                  <span>Activity</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
              {incomeCategoryRows.length > 0 ? (
                incomeCategoryRows.map((category) => (
                  <div
                    key={category.id}
                    className="grid grid-cols-[minmax(0,1.4fr)_140px_140px] items-center gap-4 px-6 py-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <CategoryIcon iconKey={inferCategoryIconKey(category)} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-base font-semibold text-slate-900">{category.category_name}</p>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              Income
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-slate-700">
                      {formatDashboardCurrency(category.assigned)}
                    </p>

                    <p className="text-sm font-semibold text-emerald-700">
                      {formatDashboardCurrency(category.activity)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-slate-500">
                    No income categories yet. Switch the type to income above when creating one.
                  </p>
                </div>
              )}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[1.75rem] border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">This Month Summary</h3>
            <div className="mt-5 space-y-4">
              <SummaryRow icon={BanknoteArrowUp} label="Income Added" value={formatDashboardCurrency(incomeThisMonth)} tone="emerald" />
              <SummaryRow
                icon={PiggyBank}
                label="Money Left From Previous Months"
                value={formatDashboardCurrency(moneyLeftFromPreviousMonths)}
                tone="blue"
              />
              <SummaryRow icon={Coins} label="Assigned" value={formatDashboardCurrency(totalAssigned)} tone="blue" />
              <SummaryRow icon={ReceiptText} label="Spent" value={formatDashboardCurrency(totalSpent)} tone="amber" />
              <SummaryRow
                icon={Wallet}
                label="Left To Assign"
                value={formatDashboardCurrency(availableToAssign)}
                tone={availableToAssign >= 0 ? 'emerald' : 'red'}
              />
            </div>
          </Card>

          <Card className="rounded-[1.75rem] border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">How This Works</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>Income transactions in {format(selectedMonth, 'MMMM yyyy')} automatically increase your budget pool.</p>
              <p>Only expense categories get assigned amounts and use `monthly_limit` as their monthly budget target.</p>
              <p>Income categories stay separate so there is a clear difference between money in and money out.</p>
              <p>Activity comes from transactions already logged this month.</p>
              <p>Later, you can also add categories directly from the transaction flow without changing this page.</p>
            </div>
          </Card>

          <Card className="rounded-[1.75rem] border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <PencilLine className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-white/70">Next step idea</p>
                <p className="text-lg font-semibold">Add budget allocations inside transaction creation later</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: 'emerald' | 'blue' | 'amber' | 'red';
}) {
  const toneClasses = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-600',
  } as const;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
