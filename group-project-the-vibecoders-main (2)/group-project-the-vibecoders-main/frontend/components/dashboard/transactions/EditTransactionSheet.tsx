'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Transaction } from '@/types/transaction';
import { useTransactions } from '@/context/transaction-context';
import { useToast } from '@/hooks/use-toast';
import { inferCategoryType } from '@/lib/category-types';
import { inferCategoryIconKey } from '@/lib/category-presets';

const editTransactionSchema = z.object({
  vendor: z.string().min(2, { message: 'Vendor or source is required.' }),
  categoryId: z.string().min(1, { message: 'Category is required.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be greater than 0.' }),
  date: z.string().min(1, { message: 'Date is required.' }),
  type: z.enum(['expense', 'income']),
  notes: z.string().max(1000, { message: 'Note cannot exceed 1000 characters.' }).optional(),
});

type EditTransactionValues = z.infer<typeof editTransactionSchema>;

interface EditTransactionSheetProps {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave?: (transaction: Transaction) => void;
}

export function EditTransactionSheet({
  open,
  transaction,
  onClose,
  onSave,
}: EditTransactionSheetProps) {
  const { toast } = useToast();
  const { transactions, categories, updateTransaction, refreshCategories } = useTransactions();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<EditTransactionValues>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      vendor: '',
      categoryId: '',
      amount: 0,
      date: '',
      type: 'expense',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      refreshCategories();
    }
    
    if (!open || !transaction) return;

    form.reset({
      vendor: transaction.vendor,
      categoryId: transaction.category_id,
      amount: transaction.amount,
      date: transaction.date,
      type: transaction.type.toLowerCase() as 'expense' | 'income',
      notes: transaction.notes ?? '',
    });
  }, [form, open, transaction]);

  const selectedType = form.watch('type');
  const filteredCategories = React.useMemo(() => {
    const expectedType = selectedType === 'income' ? 'income' : 'expense';

    return categories.filter(
      (category) => inferCategoryType(category, transactions) === expectedType,
    );
  }, [categories, selectedType, transactions]);

  const onSubmit = async (values: EditTransactionValues) => {
    if (!transaction) return;

    setIsSaving(true);
    try {
      const updated = await updateTransaction(transaction.id, {
        vendor: values.vendor,
        category_id: values.categoryId,
        amount: values.amount,
        date: values.date,
        type: values.type.toUpperCase() as 'INCOME' | 'EXPENSE',
        notes: values.notes?.trim() || undefined,
      });

      toast({
        title: 'Success',
        description: 'Transaction updated successfully.',
      });

      onSave?.(updated);
      onClose();
    } catch (error) {
      // Error toast is handled in the context
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader className="border-b border-slate-200 pb-4">
          <SheetTitle>Edit transaction</SheetTitle>
          <SheetDescription>
            Update the transaction details, category, type, and note.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4 mt-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('categoryId', '');
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose transaction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{selectedType === 'income' ? 'Source' : 'Vendor'}</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter vendor or source" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <CategoryIcon iconKey={inferCategoryIconKey(cat)} className="h-4 w-4" />
                              <span>{cat.category_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add context for this transaction"
                        className="min-h-28 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="border-t border-slate-200 mt-auto pt-6">
              <div className="flex w-full gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isSaving ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
