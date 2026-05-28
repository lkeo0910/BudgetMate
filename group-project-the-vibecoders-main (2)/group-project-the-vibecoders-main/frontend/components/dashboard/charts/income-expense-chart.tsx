import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function IncomeExpenseChart() {
  const data = [
    { month: 'Jan', income: 5500, expense: 2100 },
    { month: 'Feb', income: 5500, expense: 2250 },
    { month: 'Mar', income: 5500, expense: 1950 },
    { month: 'Apr', income: 5500, expense: 2400 },
    { month: 'May', income: 5500, expense: 2200 },
    { month: 'Jun', income: 5500, expense: 2340 },
  ];

  return (
    <Card className="border-0 bg-white dark:bg-slate-800 shadow-md p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Income vs Expense</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="month" 
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
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
          <Line 
            type="monotone" 
            dataKey="income" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="expense" 
            stroke="#f97316" 
            strokeWidth={2}
            dot={{ fill: '#f97316', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
