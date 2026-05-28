'use client';

import Link from 'next/link';
import { Shapes } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CategoriesButton() {
  return (
    <Button
      asChild
      variant="outline"
      className="h-11 gap-2 border-slate-200 px-4 font-semibold text-slate-600 hover:bg-slate-50"
    >
      <Link href="/categories">
        <Shapes className="h-4 w-4" />
        Categories
      </Link>
    </Button>
  );
}
