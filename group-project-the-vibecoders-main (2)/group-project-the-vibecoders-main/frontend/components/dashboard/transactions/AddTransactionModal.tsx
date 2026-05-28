'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, UploadCloud } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { inferCategoryType } from '@/lib/category-types';
import { inferCategoryIconKey } from '@/lib/category-presets';
import { cn } from '@/lib/utils';
import { Category } from '@/types/category';
import { formatVND } from '@/types/transaction';
import { useTransactions } from '@/context/transaction-context';
import transactionService from '@/lib/services/transaction.service';

// ── Zod schema ─────────────────────────────────────────────────────────────
const transactionSchema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z
    .coerce
    .number({ invalid_type_error: 'Amount is required' })
    .positive({ message: 'Amount must be greater than 0' }),
  date: z.date({ required_error: 'A date is required.' }),
  vendor: z.string().min(2, { message: 'Vendor must be at least 2 characters.' }),
  categoryId: z
    .string({ required_error: 'Category required' })
    .min(1, { message: 'Category required' }),
  notes: z.string().max(1000, { message: 'Notes cannot exceed 1000 characters.' }).optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

function getUploadedFile(
  event: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>
) {
  if ('dataTransfer' in event) {
    return event.dataTransfer.files?.[0] ?? null;
  }

  return event.target.files?.[0] ?? null;
}

function suggestCategoryId(
  categories: Category[],
  type: 'expense' | 'income',
  vendor: string,
  rawText: string
) {
  const haystack = `${vendor} ${rawText}`.toLowerCase();

  const rules = type === 'income'
    ? [
      {
        keywords: ['salary', 'payroll', 'income', 'bonus', 'refund'],
        categoryKeywords: ['salary', 'income', 'refund', 'gift', 'freelance'],
      },
    ]
    : [
      {
        keywords: ['coffee', 'cafe', 'tea', 'restaurant', 'food', 'grabfood', 'highlands'],
        categoryKeywords: ['food', 'eat', 'drink', 'grocery'],
      },
      {
        keywords: ['grab', 'taxi', 'bus', 'metro', 'fuel', 'petrol', 'parking'],
        categoryKeywords: ['transport'],
      },
      {
        keywords: ['shopee', 'lazada', 'tiki', 'mart', 'supermarket', 'co.op', 'winmart'],
        categoryKeywords: ['shopping', 'grocery'],
      },
      {
        keywords: ['hospital', 'clinic', 'pharmacy', 'medicine'],
        categoryKeywords: ['health'],
      },
    ];

  for (const rule of rules) {
    if (!rule.keywords.some((keyword) => haystack.includes(keyword))) {
      continue;
    }

    const matchedCategory = categories.find((category) =>
      rule.categoryKeywords.some((keyword) =>
        category.category_name.toLowerCase().includes(keyword)
      )
    );

    if (matchedCategory) {
      return matchedCategory.id;
    }
  }

  return '';
}

interface PendingReceipt {
  id: number;
  vendor: string;
  amount: number;
  confidence: number;
  date: string; // ISO "YYYY-MM-DD"
}

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  defaultValues?: PendingReceipt | null;
  /** Force the 'isScanning' state for visual mockup purposes on sticker sheet */
  forceScanningState?: boolean;
}

export function AddTransactionModal({
  isOpen,
  onClose,
  onSave,
  defaultValues,
  forceScanningState = false,
}: AddTransactionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(forceScanningState);
  const { transactions, categories, addTransaction, refreshCategories } = useTransactions();
  const { toast } = useToast();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense' as const,
      amount: '' as unknown as number,
      vendor: '',
      categoryId: '',
      date: new Date(),
      notes: '',
    },
  });

  // Pre-fill / Reset logic
  useEffect(() => {
    if (isOpen) {
      refreshCategories(); // Load latest categories when modal opens
      setIsScanning(forceScanningState);
      if (defaultValues) {
        form.reset({
          type: 'expense' as const,
          amount: (defaultValues.amount || '') as unknown as number,
          vendor: defaultValues.vendor || '',
          date: defaultValues.date ? new Date(defaultValues.date) : new Date(),
          categoryId: '',
          notes: '',
        });
      } else {
        form.reset({
          type: 'expense' as const,
          amount: '' as unknown as number,
          vendor: '',
          date: new Date(),
          categoryId: '',
          notes: '',
        });
      }
    }
  }, [isOpen, defaultValues, form, forceScanningState, refreshCategories]);

  const selectedType = form.watch('type');
  const filteredCategories = React.useMemo(() => {
    const expectedType = selectedType === 'income' ? 'income' : 'expense';

    return categories.filter(
      (category) => inferCategoryType(category, transactions) === expectedType,
    );
  }, [categories, selectedType, transactions]);

  const handleFileUpload = async (
    event: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    const file = getUploadedFile(event);
    if (!file) {
      return;
    }

    setIsScanning(true);

    try {
      const result = await transactionService.processReceipt(file);

      form.setValue('vendor', result.vendor, { shouldValidate: true });
      if (typeof result.amount === 'number') {
        form.setValue('amount', result.amount, { shouldValidate: true });
      }
      if (result.date) {
        form.setValue('date', new Date(result.date), { shouldValidate: true });
      }
      if (result.type) {
        form.setValue('type', result.type.toLowerCase() as 'expense' | 'income');
      }
      if (result.category_id) {
        form.setValue('categoryId', result.category_id, { shouldValidate: true });
      }
      if (result.notes) {
        form.setValue('notes', result.notes, { shouldValidate: true });
      }

      const suggestedCategoryId = suggestCategoryId(
        categories,
        form.getValues('type'),
        result.vendor,
        result.notes ?? ''
      );
      if (!result.category_id && suggestedCategoryId) {
        form.setValue('categoryId', suggestedCategoryId, { shouldValidate: true });
      }

      toast({
        title: 'Verify extracted fields',
        description: 'Please verify the extracted fields before saving.',
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Could not scan this receipt. Please try another file or enter the transaction manually.';

      toast({
        title: 'Receipt scan failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);

      if (!('dataTransfer' in event)) {
        event.target.value = '';
      }
    }
  };

  const onSubmit: SubmitHandler<TransactionFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const apiData = {
        vendor: data.vendor,
        category_id: data.categoryId,
        amount: data.amount,
        date: format(data.date, 'yyyy-MM-dd'),
        type: data.type.toUpperCase() as 'INCOME' | 'EXPENSE',
        notes: data.notes,
      };

      const result = await addTransaction(apiData);

      toast({
        title: 'Transaction Saved',
        description: `Verified ${formatVND(result.amount)} at ${result.vendor}`,
      });

      onSave?.(result);
      form.reset();
      onClose();
    } catch {
      // Error toast is handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden flex flex-col max-h-[85vh]">

        {/* ── SCANNING OVERLAY ── */}
        {isScanning && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-teal-100">
              <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
              <div className="text-center">
                <p className="font-bold text-slate-900 text-lg">AI is Scanning...</p>
                <p className="text-sm text-slate-500">Extracting merchant & amount</p>
              </div>
            </div>
          </div>
        )}

        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Upload a receipt or enter details manually below.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 p-6 pt-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <div className="space-y-6">
            {/* ── HYBRID DROPZONE ── */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileUpload}
              className="relative group border-2 border-dashed border-slate-200 rounded-2xl p-6 transition-all hover:border-teal-400 hover:bg-teal-50/30 cursor-pointer text-center"
            >
              <input
                type="file"
                accept="image/*,.pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileUpload}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Drop receipt here to auto-fill</p>
                <p className="text-xs text-slate-400">PDF, JPG, PNG (Max 5MB)</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                <Tabs
                  defaultValue="expense"
                  value={selectedType}
                  onValueChange={(value) => {
                    form.setValue('type', value as 'expense' | 'income');
                    form.setValue('categoryId', '');
                  }}
                  className="w-full"
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="expense" className="w-1/2">Expense</TabsTrigger>
                    <TabsTrigger value="income" className="w-1/2">Income</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₫)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            disabled={isScanning}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col mt-2.5">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                disabled={isScanning}
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground',
                                )}
                              >
                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
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
                      <FormLabel>{selectedType === 'expense' ? 'Vendor' : 'Source'}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Highlands Coffee..."
                          disabled={isScanning}
                          {...field}
                        />
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
                      <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isScanning}>
                        <FormControl>
                        <SelectTrigger>
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
                          placeholder="Add an optional note for this transaction"
                          disabled={isScanning}
                          className="min-h-24 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200/50"
                  disabled={isSubmitting || isScanning}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmitting ? 'Saving...' : 'Save Transaction'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
