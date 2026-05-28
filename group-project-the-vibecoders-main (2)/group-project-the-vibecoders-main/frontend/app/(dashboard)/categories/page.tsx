'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTransactions } from '@/context/transaction-context';
import { useToast } from '@/hooks/use-toast';
import {
  CATEGORY_PRESETS,
  type CategoryIconKey,
  getPresetByName,
  getRemainingCategoryPresets,
  inferCategoryIconKey,
} from '@/lib/category-presets';
import categoryService from '@/lib/services/category.service';
import type { Category, CategoryType } from '@/types/category';
import { cn } from '@/lib/utils';

function uniqueIconsForType(type: CategoryType): CategoryIconKey[] {
  return CATEGORY_PRESETS.filter((preset, index, list) => {
    if (preset.type !== type) {
      return false;
    }
    return list.findIndex((entry) => entry.iconKey === preset.iconKey) === index;
  }).map((preset) => preset.iconKey);
}

const EMPTY_FORM = {
  id: null as string | null,
  type: 'expense' as CategoryType,
  name: '',
  icon: 'tag' as CategoryIconKey,
};

type CategoryFilter = 'all' | 'income' | 'expense';

export default function CategoriesPage() {
  const { categories, refreshCategories, refreshTransactions } = useTransactions();
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    void refreshCategories();
  }, [refreshCategories]);

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => left.category_name.localeCompare(right.category_name)),
    [categories],
  );

  const availablePresets = useMemo(
    () => getRemainingCategoryPresets(categories, form.type),
    [categories, form.type],
  );

  const iconChoices = useMemo(() => uniqueIconsForType(form.type), [form.type]);
  const editIconChoices = useMemo(() => uniqueIconsForType(editForm.type), [editForm.type]);
  const getTypeStyles = (type: CategoryType) =>
    type === 'income'
      ? {
          activeTab: 'bg-emerald-600 text-white',
          idleTab: 'text-emerald-700 hover:text-emerald-800',
          selectedPreset: 'border-emerald-600 bg-emerald-600 text-white',
          presetIdle: 'border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50',
          selectedIcon: 'border-emerald-600 bg-emerald-600 text-white',
          iconIdle: 'border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300',
          primaryButton: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          cancelButton: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800',
        }
      : {
          activeTab: 'bg-rose-600 text-white',
          idleTab: 'text-rose-700 hover:text-rose-800',
          selectedPreset: 'border-rose-600 bg-rose-600 text-white',
          presetIdle: 'border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50',
          selectedIcon: 'border-rose-600 bg-rose-600 text-white',
          iconIdle: 'border-rose-200 bg-white text-rose-700 hover:border-rose-300',
          primaryButton: 'bg-rose-600 hover:bg-rose-700 text-white',
          cancelButton: 'border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800',
        };
  const typeStyles = getTypeStyles(form.type);
  const editTypeStyles = getTypeStyles(editForm.type);

  const resetForm = () => {
    setForm({
      id: null,
      type: 'expense',
      name: '',
      icon: 'tag',
    });
    setSelectedPreset('');
  };

  const handlePreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = getPresetByName(presetName, form.type);
    if (!preset) {
      return;
    }

    setForm((current) => ({
      ...current,
      name: preset.name,
      icon: preset.iconKey,
    }));
  };

  const handleSave = async () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      return;
    }

    const duplicate = categories.find(
      (category) =>
        category.category_name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        category.id !== form.id,
    );

    if (duplicate) {
      toast({
        title: 'Category already exists',
        description: 'Choose a different category name.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const preset = getPresetByName(trimmedName, form.type);
      await categoryService.createCategory({
        category_name: trimmedName,
        monthly_limit: null,
        category_type: form.type,
        category_icon: preset?.iconKey ?? form.icon,
      });

      await refreshCategories();
      toast({
        title: 'Category created',
        description: `${trimmedName} was saved successfully.`,
      });
      resetForm();
    } catch {
      toast({
        title: 'Could not save category',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditForm({
      id: category.id,
      type: category.category_type,
      name: category.category_name,
      icon: inferCategoryIconKey(category),
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.id) {
      return;
    }

    const trimmedName = editForm.name.trim();
    if (!trimmedName) {
      return;
    }

    const duplicate = categories.find(
      (category) =>
        category.category_name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        category.id !== editForm.id,
    );

    if (duplicate) {
      toast({
        title: 'Category already exists',
        description: 'Choose a different category name.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingEdit(true);
    try {
      await categoryService.updateCategory(editForm.id, {
        category_name: trimmedName,
        category_type: editForm.type,
        category_icon: editForm.icon,
      });
      await refreshCategories();
      toast({
        title: 'Category updated',
        description: `${trimmedName} was saved successfully.`,
      });
      setIsEditDialogOpen(false);
      setEditForm(EMPTY_FORM);
    } catch {
      toast({
        title: 'Could not save category',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (category: Category) => {
    setDeletingId(category.id);
    try {
      await categoryService.deleteCategory(category.id);
      await refreshCategories();
      await refreshTransactions({ orderBy: 'date', order: 'desc' });
      toast({
        title: 'Category deleted',
        description: `${category.category_name} and its related records were removed.`,
      });
    } catch {
      toast({
        title: 'Could not delete category',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
      setCategoryToDelete(null);
    }
  };

  const visibleCategories = useMemo(
    () =>
      categoryFilter === 'all'
        ? sortedCategories
        : sortedCategories.filter((category) => category.category_type === categoryFilter),
    [categoryFilter, sortedCategories],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Categories</p>
        <h1 className="text-3xl font-semibold text-slate-900">Manage Categories</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-500">
          Create income or expense categories, choose the icon, and update or delete any existing category.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[560px_minmax(0,1fr)]">
        <Card className="rounded-[1.75rem] border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Create Category</h2>
              <p className="mt-1 text-sm text-slate-500">
                Start by choosing whether this is an income or expense category.
              </p>
            </div>

            <div className="flex h-11 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(['expense', 'income'] as CategoryType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setForm((current) => ({
                      ...current,
                      type,
                      icon: type === 'income' ? 'wallet' : 'tag',
                    }));
                    setSelectedPreset('');
                  }}
                  className={cn(
                    'rounded-lg px-4 text-sm font-medium capitalize transition-colors',
                    form.type === type ? typeStyles.activeTab : typeStyles.idleTab,
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Available presets</p>
              <div className="flex flex-wrap gap-2">
                {availablePresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePreset(preset.name)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition',
                      selectedPreset === preset.name
                        ? typeStyles.selectedPreset
                        : typeStyles.presetIdle,
                    )}
                  >
                    <CategoryIcon iconKey={preset.iconKey} className="h-4 w-4" />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Category name</label>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Enter category name"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Choose logo</p>
              <div className="grid grid-cols-5 gap-2">
                {iconChoices.map((iconKey) => (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, icon: iconKey }))}
                    className={cn(
                      'flex h-12 items-center justify-center rounded-2xl border transition',
                      form.icon === iconKey
                        ? typeStyles.selectedIcon
                        : typeStyles.iconIdle,
                    )}
                  >
                    {form.icon === iconKey ? <Check className="h-4 w-4" /> : <CategoryIcon iconKey={iconKey} className="h-5 w-5" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" onClick={handleSave} disabled={isSaving || !form.name.trim()} className={typeStyles.primaryButton}>
                <Plus className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Create Category'}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Current Categories</h2>
              <p className="mt-1 text-sm text-slate-500">
                Editing or deleting here updates the rest of the app because categories come from the backend.
              </p>
              <div className="mt-4 flex h-10 w-fit rounded-xl border border-slate-200 bg-slate-50 p-1">
                {(['all', 'income', 'expense'] as CategoryFilter[]).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setCategoryFilter(filter)}
                    className={cn(
                      'rounded-lg px-3 text-sm font-medium capitalize transition-colors',
                      categoryFilter === filter
                        ? filter === 'income'
                          ? 'bg-emerald-600 text-white'
                          : filter === 'expense'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-900 text-white'
                        : filter === 'income'
                          ? 'text-emerald-700 hover:text-emerald-800'
                          : filter === 'expense'
                            ? 'text-rose-700 hover:text-rose-800'
                            : 'text-slate-700 hover:text-slate-900',
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {visibleCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-2xl',
                        category.category_type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                      )}
                    >
                      <CategoryIcon iconKey={inferCategoryIconKey(category)} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">{category.category_name}</p>
                      <p
                        className={cn(
                          'text-sm capitalize',
                          category.category_type === 'income' ? 'text-emerald-600' : 'text-rose-600',
                        )}
                      >
                        {category.category_type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                      className="border-slate-200 text-slate-900 hover:bg-slate-50 hover:text-slate-950"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-slate-200 text-slate-900 hover:bg-slate-50 hover:text-slate-950"
                      onClick={() => setCategoryToDelete(category)}
                      disabled={deletingId === category.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deletingId === category.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              ))}

              {visibleCategories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
                  No categories in this filter.
                </div>
              ) : null}
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditForm(EMPTY_FORM);
        }
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category type, name, and logo. Changes are saved to backend immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="flex h-11 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(['expense', 'income'] as CategoryType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setEditForm((current) => ({
                      ...current,
                      type,
                      icon: type === current.type ? current.icon : type === 'income' ? 'wallet' : 'tag',
                    }))
                  }
                  className={cn(
                    'rounded-lg px-4 text-sm font-medium capitalize transition-colors',
                    editForm.type === type ? editTypeStyles.activeTab : editTypeStyles.idleTab,
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Category name</label>
              <Input
                value={editForm.name}
                onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Enter category name"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Choose logo</p>
              <div className="grid grid-cols-5 gap-2">
                {editIconChoices.map((iconKey) => (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setEditForm((current) => ({ ...current, icon: iconKey }))}
                    className={cn(
                      'flex h-12 items-center justify-center rounded-2xl border transition',
                      editForm.icon === iconKey
                        ? editTypeStyles.selectedIcon
                        : editTypeStyles.iconIdle,
                    )}
                  >
                    {editForm.icon === iconKey ? <Check className="h-4 w-4" /> : <CategoryIcon iconKey={iconKey} className="h-5 w-5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSavingEdit || !editForm.name.trim()}
              className={editTypeStyles.primaryButton}
            >
              <Check className="mr-2 h-4 w-4" />
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting <span className="font-semibold text-slate-900">{categoryToDelete?.category_name}</span> will also delete the related transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (!categoryToDelete) {
                  return;
                }
                void handleDelete(categoryToDelete);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
