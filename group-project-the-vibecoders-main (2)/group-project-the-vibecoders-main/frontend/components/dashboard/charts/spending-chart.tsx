import React from 'react';
import { Card } from '@/components/ui/card';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatDashboardCurrency } from '@/lib/dashboard';

interface SpendingCategoryDatum {
  id: string;
  name: string;
  value: number;
  color: string;
}

export function SpendingChart({
  data,
  isLoading,
}: {
  data: SpendingCategoryDatum[];
  isLoading: boolean;
}) {
  return (
    <Card className="border-0 bg-white shadow-md p-6">
      <h3 className="text-xl font-semibold text-foreground">Spending by Category</h3>

      <div className="mt-4 h-[320px]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading category spend...</div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No spending data in this time range.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={72}
                outerRadius={110}
                paddingAngle={3}
              >
                {data.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatDashboardCurrency(value)} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
