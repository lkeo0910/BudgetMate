import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';

export function KPICards() {
  const kpis = [
    {
      title: 'Total Balance',
      value: '12.485.500 ₫',
      change: '+5.2%',
      positive: true,
      icon: Wallet,
      bgColor: 'from-primary to-secondary',
    },
    {
      title: 'This Month Spending',
      value: '2.340.000 ₫',
      change: '+12.5%',
      positive: false,
      icon: TrendingDown,
      bgColor: 'from-accent to-orange-500',
    },
    {
      title: 'Monthly Income',
      value: '5.500.000 ₫',
      change: '+2.1%',
      positive: true,
      icon: TrendingUp,
      bgColor: 'from-green-500 to-emerald-600',
    },
    {
      title: 'Budget Remaining',
      value: '3.160.000 ₫',
      change: '68% of budget',
      positive: true,
      icon: Target,
      bgColor: 'from-blue-500 to-cyan-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card key={index} className="border-0 bg-white dark:bg-slate-800 shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${kpi.bgColor} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className={`text-sm font-semibold ${kpi.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {kpi.positive ? '↑' : '↓'} {kpi.change}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
