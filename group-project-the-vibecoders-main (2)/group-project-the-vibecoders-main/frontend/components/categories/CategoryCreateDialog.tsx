'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import {
  CATEGORY_PRESETS,
  type CategoryIconKey,
  type CategoryPreset,
  getPresetByName,
} from '@/lib/category-presets';
import type { Category, CategoryType } from '@/types/category';
import categoryService from '@/lib/services/category.service';
import { useToast } from '@/hooks/use-toast';

interface CategoryCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  defaultType: CategoryType;
  onCreated: (category: Category) => void;
}

export function CategoryCreateDialog({
  open,
  onOpenChange,
  categories,
  defaultType,
  onCreated,
}: CategoryCreateDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<CategoryIconKey>(defaultType === 'income' ? 'wallet' : 'tag');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName('');
    setSelectedIcon(defaultType === 'income' ? 'wallet' : 'tag');
  }, [defaultType, open]);

  const availablePresets = useMemo(
    () =>
      CATEGORY_PRESETS.filter((preset) => {
        if (preset.type !== defaultType) {
          return false;
        }
        return !categories.some(
          (category) => category.category_name.trim().toLowerCase() === preset.name.trim().toLowerCase(),
        );
      }),
    [categories, defaultType],
  );

  const iconChoices = useMemo(
    () =>
      CATEGORY_PRESETS.filter((preset, index, list) => {
        if (preset.type !== defaultType) {
          return false;
        }
        return list.findIndex((entry) => entry.iconKey === preset.iconKey) === index;
      }).map((preset) => preset.iconKey),
    [defaultType],
  );

  const handleUsePreset = (preset: CategoryPreset) => {
    setName(preset.name);
    setSelectedIcon(preset.iconKey);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    if (
      categories.some((category) => category.category_name.trim().toLowerCase() === trimmedName.toLowerCase())
    ) {
      toast({
        title: 'Category already exists',
        description: 'Choose a different name or use the existing category.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const preset = getPresetByName(trimmedName, defaultType);
      const created = await categoryService.createCategory({
        category_name: trimmedName,
        monthly_limit: null,
        category_type: defaultType,
        category_icon: preset?.iconKey ?? selectedIcon,
      });
      onCreated(created);
      onOpenChange(false);
      toast({
        title: 'Category created',
        description: `${created.category_name} is now available in your categories.`,
      });
    } catch {
      toast({
        title: 'Could not create category',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>
            Pick a preset or type a new name, then choose the icon you want to use for this category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Popular categories</p>
            <div className="flex flex-wrap gap-2">
              {availablePresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleUsePreset(preset)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <CategoryIcon iconKey={preset.iconKey} className="h-4 w-4" />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Category name</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter category name" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Choose logo</p>
            <div className="grid grid-cols-5 gap-2">
              {iconChoices.map((iconKey) => (
                <button
                  key={iconKey}
                  type="button"
                  onClick={() => setSelectedIcon(iconKey)}
                  className={`flex h-12 items-center justify-center rounded-2xl border transition ${
                    selectedIcon === iconKey
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {selectedIcon === iconKey ? <Check className="h-4 w-4" /> : <CategoryIcon iconKey={iconKey} className="h-5 w-5" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving || !name.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Create Category'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
