import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowDownCircle, ArrowUpCircle, Target, Wallet } from 'lucide-react';

interface SummaryCardItem {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: 'wallet' | 'expense' | 'income' | 'target';
  href?: string;
}

const iconMap = {
  wallet: Wallet,
  expense: ArrowDownCircle,
  income: ArrowUpCircle,
  target: Target,
} as const;

const iconBgMap = {
  wallet: 'from-sky-500 to-cyan-500',
  expense: 'from-orange-500 to-rose-500',
  income: 'from-emerald-500 to-green-600',
  target: 'from-indigo-500 to-blue-600',
} as const;

export function SummaryCards({ cards }: { cards: SummaryCardItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = iconMap[card.icon];
        const cardContent = (
          <Card className="overflow-hidden border-0 bg-white shadow-md transition-transform hover:-translate-y-0.5">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${iconBgMap[card.icon]}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className={`mt-4 text-sm font-semibold ${card.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                {card.change}
              </p>
            </div>
          </Card>
        );

        return card.href ? (
          <Link key={card.title} href={card.href} className="block">
            {cardContent}
          </Link>
        ) : (
          <div key={card.title}>{cardContent}</div>
        );
      })}
    </div>
  );
}
