import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function BudgetChart() {
  const data = [
    { category: 'Housing', budget: 1500, spent: 1200, remaining: 300 },
    { category: 'Food', budget: 600, spent: 450, remaining: 150 },
    { category: 'Transport', budget: 400, spent: 280, remaining: 120 },
    { category: 'Entertain', budget: 300, spent: 220, remaining: 80 },
    { category: 'Utilities', budget: 250, spent: 190, remaining: 60 },
  ];

  return (
    <Card className="border-0 bg-white dark:bg-slate-800 shadow-md p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Budget Tracker</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="category" 
            stroke="#9ca3af"
            style={{ fontSize: '11px' }}
          />
          <YAxis 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
          />
          <Legend 
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="budget" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          <Bar dataKey="spent" fill="#f97316" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
