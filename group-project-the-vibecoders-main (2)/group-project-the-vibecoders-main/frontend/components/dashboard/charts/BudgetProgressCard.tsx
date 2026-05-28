import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatVND } from '@/types/transaction';

interface BudgetProgressCardProps {
  label: string;
  spent: number;
  limit: number;
  className?: string;
}

function getBudgetColor(pct: number): string {
  if (pct > 85) return 'bg-red-500';
  if (pct > 50) return 'bg-yellow-400';
  return 'bg-green-500';
}

export function BudgetProgressCard({ label, spent, limit, className }: BudgetProgressCardProps) {
  const pct = Math.min(Math.round((spent / limit) * 100), 100);
  const color = getBudgetColor(pct);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold text-slate-900">
            {formatVND(spent)}
          </span>
          <span className="text-sm text-slate-500">of {formatVND(limit)}</span>
        </div>
        {/* Custom traffic-light progress bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn('h-full rounded-full transition-all duration-500', color)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span
            className={cn(
              'text-xs font-semibold',
              pct > 85 ? 'text-red-600' : pct > 50 ? 'text-yellow-600' : 'text-green-600',
            )}
          >
            {pct}% used
          </span>
          <span className="text-xs text-slate-400">{formatVND(limit - spent)} left</span>
        </div>
      </CardContent>
    </Card>
  );
}
