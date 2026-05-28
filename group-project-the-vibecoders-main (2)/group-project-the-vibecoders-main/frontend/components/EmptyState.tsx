import * as React from 'react';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title = 'No transactions found',
  description = "You haven't logged any transactions yet. Start tracking your finances today.",
  actionLabel = 'Log Your First Expense',
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-8 py-16 text-center',
        className,
      )}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 text-teal-500">
        {icon ?? <Receipt className="w-8 h-8" strokeWidth={1.5} />}
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>
      {actionLabel && (
        <Button
          onClick={onAction}
          className="bg-teal-500 hover:bg-teal-600 text-white mt-2"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
